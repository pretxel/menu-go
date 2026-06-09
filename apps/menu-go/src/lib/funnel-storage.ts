export type ParsedDish = {
  name: string;
  description: string;
  price: number | string;
  tags: string[];
};

export type ParsedCategory = {
  name: string;
  dishes: ParsedDish[];
};

export type FunnelStep = 'photo' | 'extract' | 'preview' | 'details';

export type FunnelState = {
  step: FunnelStep;
  imageBase64?: string;
  categories?: ParsedCategory[];
  restaurant?: { name: string; address: string; phone: string };
};

export const FUNNEL_STORAGE_KEY = 'dineqrs:funnel';

// sessionStorage quota is typically 5–10MB; cap the photo so the rest of the
// state always fits.
export const MAX_IMAGE_CHARS = 4 * 1024 * 1024;

export type SaveResult = 'full' | 'without-image' | 'failed';

export function saveFunnelState(state: FunnelState): SaveResult {
  if (typeof window === 'undefined') return 'failed';

  const oversized = (state.imageBase64?.length ?? 0) > MAX_IMAGE_CHARS;
  const first: FunnelState = oversized ? { ...state, imageBase64: undefined } : state;

  try {
    window.sessionStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(first));
    return oversized ? 'without-image' : 'full';
  } catch {
    // Quota exceeded — the photo is the only large field; retry without it so
    // extraction results survive.
    try {
      window.sessionStorage.setItem(
        FUNNEL_STORAGE_KEY,
        JSON.stringify({ ...state, imageBase64: undefined }),
      );
      return 'without-image';
    } catch {
      return 'failed';
    }
  }
}

export function loadFunnelState(): FunnelState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(FUNNEL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FunnelState;
    if (!parsed || typeof parsed.step !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFunnelState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(FUNNEL_STORAGE_KEY);
  } catch {
    // ignore
  }
}
