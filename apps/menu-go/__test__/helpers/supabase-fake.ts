/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-memory stand-in for the server Supabase client (src/lib/supabase.ts).
 *
 * Implements the subset of PostgREST behaviour menu-go uses: eq/neq/is/not/or
 * filters, FK embedding (`alias:table(...)`, `table!inner(...)`, filters on
 * embedded columns), exact head counts, insert/update/upsert/delete with
 * `.select()`, `.single()` / `.maybeSingle()`, and the two mg_ RPC functions
 * (atomic: any failure rolls the whole call back).
 *
 * Usage in a test file:
 *   jest.mock('../src/lib/supabase', () => require('./helpers/supabase-fake').moduleMock());
 *   import { db, resetDb } from './helpers/supabase-fake';
 */

type Row = Record<string, any>;
type Tables = Record<string, Row[]>;
type Filter = { column: string; test: (v: any) => boolean };

const TABLES = [
  'mg_user',
  'mg_account',
  'mg_config_restaurant',
  'mg_category',
  'mg_dishes',
  'mg_menu_view',
] as const;

// child table -> { column -> parent table }
const FKS: Record<string, Record<string, string>> = {
  mg_account: { userId: 'mg_user' },
  mg_config_restaurant: { userId: 'mg_user' },
  mg_category: { configRestaurantId: 'mg_config_restaurant' },
  mg_dishes: { configRestaurantId: 'mg_config_restaurant', categoryId: 'mg_category' },
  mg_menu_view: { configRestaurantId: 'mg_config_restaurant' },
};

const UNIQUE: Record<string, string[][]> = {
  mg_user: [['email']],
  mg_account: [['provider', 'providerAccountId']],
  mg_config_restaurant: [['slug']],
};

const NOT_NULL: Record<string, string[]> = {
  mg_dishes: ['name', 'price', 'configRestaurantId', 'categoryId'],
  mg_category: ['name', 'description'],
  mg_config_restaurant: ['userId'],
};

let idSeq = 0;
const now = () => new Date().toISOString();

function defaults(table: string): Row {
  const base: Row = { id: `${table}-${++idSeq}` };
  if (table === 'mg_config_restaurant') {
    Object.assign(base, {
      createdAt: now(),
      updatedAt: now(),
      primaryColor: '#4F46E5',
      backgroundColor: '#FFFFFF',
    });
  }
  if (table === 'mg_dishes') {
    Object.assign(base, { createdAt: now(), updatedAt: now(), isAvailable: true, tags: [] });
  }
  if (table === 'mg_menu_view') Object.assign(base, { createdAt: now(), source: 'direct' });
  return base;
}

export const db: { tables: Tables; log: Array<{ table: string; op: string; filters: string[]; payload?: any }>; failures: Set<string> } = {
  tables: {},
  log: [],
  failures: new Set(),
};

/** Replace all data. Rows missing an id get one. */
export function resetDb(seed: Partial<Record<(typeof TABLES)[number], Row[]>> = {}): void {
  idSeq = 0;
  db.log = [];
  db.failures = new Set();
  db.tables = {};
  for (const t of TABLES) {
    db.tables[t] = (seed[t] ?? []).map((r) => ({ ...defaults(t), ...r }));
  }
}

/** Make the next request touching `table` (or rpc `fn`) fail with a database error. */
export function failNext(tableOrFn: string): void {
  db.failures.add(tableOrFn);
}

function takeFailure(name: string): boolean {
  if (db.failures.has(name)) {
    db.failures.delete(name);
    return true;
  }
  return false;
}

function dbError(message: string, code = 'XX000') {
  return { message, code, details: null, hint: null };
}

function checkConstraints(table: string, row: Row, others: Row[]) {
  for (const col of NOT_NULL[table] ?? []) {
    if (row[col] === null || row[col] === undefined) {
      throw dbError(`null value in column "${col}" of relation "${table}" violates not-null constraint`);
    }
  }
  for (const cols of UNIQUE[table] ?? []) {
    if (cols.some((c) => row[c] === null || row[c] === undefined)) continue;
    if (others.some((o) => o !== row && cols.every((c) => o[c] === row[c]))) {
      throw dbError(`duplicate key value violates unique constraint on ${table}(${cols.join(',')})`);
    }
  }
}

// ---- select string parsing / embedding -------------------------------------

type SelectItem =
  | { kind: 'star' }
  | { kind: 'col'; name: string }
  | { kind: 'embed'; alias: string; table: string; inner: boolean; items: SelectItem[] };

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseSelect(s: string): SelectItem[] {
  return splitTop(s).map((part) => {
    if (part === '*') return { kind: 'star' };
    const m = part.match(/^(?:(\w+):)?(\w+)(!inner)?\((.*)\)$/);
    if (m) {
      return { kind: 'embed', alias: m[1] ?? m[2], table: m[2], inner: !!m[3], items: parseSelect(m[4]) };
    }
    return { kind: 'col', name: part };
  });
}

function project(table: string, row: Row, items: SelectItem[], embedFilters: Filter[], path: string): Row | null {
  const out: Row = {};
  for (const item of items) {
    if (item.kind === 'star') Object.assign(out, row);
    else if (item.kind === 'col') out[item.name] = row[item.name];
  }
  for (const item of items) {
    if (item.kind !== 'embed') continue;
    const key = path ? `${path}.${item.alias}` : item.alias;
    const ownFilters = embedFilters.filter((f) => f.column.startsWith(`${key}.`));
    const matches = (r: Row) =>
      ownFilters
        .filter((f) => f.column.split('.').length === key.split('.').length + 1)
        .every((f) => f.test(r[f.column.slice(key.length + 1)]));

    const fkToParent = Object.entries(FKS[table] ?? {}).find(([, t]) => t === item.table);
    if (fkToParent) {
      // many-to-one
      const parent = db.tables[item.table].find((p) => p.id === row[fkToParent[0]]);
      const ok = parent && matches(parent);
      const projected = ok ? project(item.table, parent, item.items, embedFilters, key) : null;
      if (item.inner && !projected) return null;
      out[item.alias] = projected;
    } else {
      // one-to-many
      const fkCol = Object.entries(FKS[item.table] ?? {}).find(([, t]) => t === table)?.[0];
      if (!fkCol) throw new Error(`fake: no relationship ${table} -> ${item.table}`);
      const children = db.tables[item.table]
        .filter((c) => c[fkCol] === row.id && matches(c))
        .map((c) => project(item.table, c, item.items, embedFilters, key))
        .filter(Boolean);
      if (item.inner && children.length === 0) return null;
      out[item.alias] = children;
    }
  }
  return out;
}

// ---- query builder -----------------------------------------------------------

class Query implements PromiseLike<any> {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any;
  private selectStr: string | null = null;
  private filters: Filter[] = [];
  private filterDesc: string[] = [];
  private limitN: number | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private countHead = false;
  private onConflict: string[] = [];

  constructor(private table: string) {}

  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    this.selectStr = cols;
    if (opts?.head) this.countHead = true;
    return this;
  }
  insert(payload: any) {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }
  update(payload: any) {
    this.op = 'update';
    this.payload = payload;
    return this;
  }
  upsert(payload: any, opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = payload;
    this.onConflict = (opts?.onConflict ?? 'id').split(',').map((c) => c.trim());
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  private add(column: string, desc: string, test: (v: any) => boolean) {
    this.filters.push({ column, test });
    this.filterDesc.push(desc);
    return this;
  }
  eq(c: string, v: any) {
    return this.add(c, `${c}=eq.${v}`, (x) => x === v);
  }
  neq(c: string, v: any) {
    return this.add(c, `${c}=neq.${v}`, (x) => x !== v);
  }
  is(c: string, v: null) {
    return this.add(c, `${c}=is.${v}`, (x) => x === v || x === undefined);
  }
  not(c: string, op: string, v: any) {
    if (op !== 'is' || v !== null) throw new Error('fake: only not(col, "is", null)');
    return this.add(c, `${c}=not.is.null`, (x) => x !== null && x !== undefined);
  }
  or(expr: string) {
    const parts = expr.split(',').map((p) => {
      const [col, op, ...rest] = p.split('.');
      const val = rest.join('.');
      if (op === 'eq') return (r: Row) => String(r[col]) === val;
      if (op === 'is' && val === 'null') return (r: Row) => r[col] === null || r[col] === undefined;
      throw new Error(`fake: unsupported or() part ${p}`);
    });
    this.filters.push({ column: '__row__', test: (r: Row) => parts.some((f) => f(r)) });
    this.filterDesc.push(`or=(${expr})`);
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.mode = 'single';
    return this;
  }
  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }

  private rowMatches(r: Row) {
    return this.filters
      .filter((f) => !f.column.includes('.'))
      .every((f) => (f.column === '__row__' ? f.test(r) : f.test(r[f.column])));
  }

  private execute(): { data: any; error: any; count?: number | null } {
    db.log.push({ table: this.table, op: this.op, filters: this.filterDesc, payload: this.payload });
    if (takeFailure(this.table)) return { data: null, error: dbError('injected failure') };
    const rows = db.tables[this.table];
    if (!rows) throw new Error(`fake: unknown table ${this.table}`);
    const embedFilters = this.filters.filter((f) => f.column.includes('.'));

    let result: Row[] = [];
    try {
      if (this.op === 'select') {
        result = rows.filter((r) => this.rowMatches(r));
      } else if (this.op === 'insert' || this.op === 'upsert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const item of items) {
          const existing =
            this.op === 'upsert'
              ? rows.find((r) => this.onConflict.every((c) => r[c] === item[c]))
              : undefined;
          if (existing) {
            Object.assign(existing, item);
            checkConstraints(this.table, existing, rows);
            result.push(existing);
          } else {
            const row = { ...defaults(this.table), ...item };
            checkConstraints(this.table, row, rows);
            rows.push(row);
            result.push(row);
          }
        }
      } else if (this.op === 'update') {
        result = rows.filter((r) => this.rowMatches(r));
        for (const r of result) {
          Object.assign(r, this.payload);
          if ('updatedAt' in r) r.updatedAt = now();
          checkConstraints(this.table, r, rows);
        }
      } else if (this.op === 'delete') {
        result = rows.filter((r) => this.rowMatches(r));
        // ON DELETE RESTRICT foreign keys (0_init_mg_prefix.sql). The other two
        // (mg_account.userId CASCADE, mg_category.configRestaurantId SET NULL)
        // are not exercised by deletes in the app.
        const notRestrict = ['mg_account.userId', 'mg_category.configRestaurantId'];
        for (const [child, cols] of Object.entries(FKS)) {
          for (const [col, parent] of Object.entries(cols)) {
            if (parent !== this.table || notRestrict.includes(`${child}.${col}`)) continue;
            if (db.tables[child].some((c) => result.some((r) => r.id === c[col]))) {
              throw dbError(
                `update or delete on table "${this.table}" violates foreign key constraint on table "${child}"`,
                '23503',
              );
            }
          }
        }
        db.tables[this.table] = rows.filter((r) => !result.includes(r));
      }
    } catch (e: any) {
      return { data: null, error: e };
    }

    if (this.countHead) return { data: null, error: null, count: result.length };
    if (this.op !== 'select' && this.selectStr === null) return { data: null, error: null };

    const items = parseSelect(this.selectStr ?? '*');
    let projected = result
      .map((r) => project(this.table, r, items, embedFilters, ''))
      .filter(Boolean) as Row[];
    if (this.limitN !== null) projected = projected.slice(0, this.limitN);
    projected = JSON.parse(JSON.stringify(projected));

    if (this.mode === 'single') {
      if (projected.length !== 1) {
        return { data: null, error: dbError('JSON object requested, multiple (or no) rows returned') };
      }
      return { data: projected[0], error: null };
    }
    if (this.mode === 'maybe') {
      if (projected.length > 1) return { data: null, error: dbError('multiple rows returned') };
      return { data: projected[0] ?? null, error: null };
    }
    return { data: projected, error: null };
  }

  then<A = any, B = never>(
    onfulfilled?: ((value: any) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: any) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }
}

// ---- RPC (same logic as packages/db/migrations/1_mg_supabase_js.sql) -------

function importCatalog(restaurantId: string, categories: any[]) {
  for (const cat of categories ?? []) {
    let category = db.tables.mg_category.find(
      (c) => c.name === cat.name && c.configRestaurantId === restaurantId,
    );
    if (!category) {
      category = { ...defaults('mg_category'), name: cat.name, description: cat.name, configRestaurantId: restaurantId };
      checkConstraints('mg_category', category, db.tables.mg_category);
      db.tables.mg_category.push(category);
    }
    for (const dish of cat.dishes ?? []) {
      const row = {
        ...defaults('mg_dishes'),
        name: dish.name ?? null,
        description: dish.description ?? '',
        price: dish.price === undefined || dish.price === null || dish.price === '' ? 0 : Number(dish.price),
        tags: dish.tags ?? [],
        configRestaurantId: restaurantId,
        categoryId: category.id,
      };
      checkConstraints('mg_dishes', row, db.tables.mg_dishes);
      db.tables.mg_dishes.push(row);
    }
  }
}

const RPC: Record<string, (args: any) => any> = {
  mg_import_catalog: (a) => {
    importCatalog(a.p_config_restaurant_id, a.p_categories);
    return null;
  },
  mg_publish_new_catalog: (a) => {
    const restaurant: Row = {
      ...defaults('mg_config_restaurant'),
      name: a.p_name,
      userId: a.p_user_id,
      address: a.p_address ?? '',
      phone: a.p_phone ?? '',
      slug: a.p_slug,
      qrCode: a.p_qr_code,
    };
    checkConstraints('mg_config_restaurant', restaurant, db.tables.mg_config_restaurant);
    db.tables.mg_config_restaurant.push(restaurant);
    importCatalog(restaurant.id, a.p_categories);
    return { ...restaurant };
  },
};

class RpcCall implements PromiseLike<any> {
  private mode: 'many' | 'single' = 'many';
  constructor(
    private fn: string,
    private args: any,
  ) {}
  single() {
    this.mode = 'single';
    return this;
  }
  private execute() {
    db.log.push({ table: `rpc:${this.fn}`, op: 'rpc', filters: [], payload: this.args });
    if (takeFailure(this.fn)) return { data: null, error: dbError('injected failure') };
    const impl = RPC[this.fn];
    if (!impl) return { data: null, error: dbError(`function ${this.fn} does not exist`) };
    const snapshot = JSON.parse(JSON.stringify(db.tables));
    try {
      const data = impl(JSON.parse(JSON.stringify(this.args)));
      return { data, error: null };
    } catch (e: any) {
      db.tables = snapshot; // transaction rollback
      return { data: null, error: e };
    }
  }
  then<A = any, B = never>(
    onfulfilled?: ((value: any) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: any) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }
}

export const fakeClient = {
  from: (table: string) => new Query(table),
  rpc: (fn: string, args: any) => new RpcCall(fn, args),
};

/** Module shape for jest.mock('../src/lib/supabase', ...). */
// The real module imports `server-only`, which throws under jest, so the
// trivial `unwrap` is mirrored here instead of required from it.
export function moduleMock() {
  return {
    __esModule: true,
    getSupabase: () => fakeClient,
    unwrap: (res: { data: any; error: { message?: string } | null }) => {
      if (res.error) throw new Error(res.error.message ?? 'Supabase request failed');
      return res.data;
    },
  };
}

resetDb();
