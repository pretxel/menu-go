# Next.js 15 Migration Guide

## What Was Updated

### Core Dependencies
- **Next.js**: `14.0.3` → `15.1.3`
- **React & React-DOM**: `18.2.0` → `18.3.1`
- **TypeScript**: `5.4.0` → `5.7.2`

### Major Package Updates
- **@headlessui/react**: `1.7.14` → `2.2.0` (Breaking changes - see below)
- **@testing-library/react**: `13.2.0` → `16.1.0`
- **react-toastify**: `9.1.3` → `11.0.2`
- **sharp**: `0.32.6` → `0.33.5`
- **tailwindcss**: `3.3.2` → `3.4.17`

### Configuration Changes
- Moved `outputFileTracingRoot` from `experimental` to stable config
- Updated `eslint-config-next` to match Next.js 15

## Installation Steps

1. **Clean install dependencies:**
   ```bash
   # Remove old dependencies
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   rm -f pnpm-lock.yaml
   
   # Install fresh
   pnpm install
   ```

2. **Database setup (if needed):**
   ```bash
   pnpm run db:generate
   ```

3. **Test the application:**
   ```bash
   pnpm run dev
   ```

## Breaking Changes to Watch For

### 1. Headless UI v2
Headless UI was upgraded from v1 to v2. Key changes:
- Some component APIs have changed
- Check your usage of `Transition`, `Dialog`, `Menu`, etc.
- [Migration guide](https://headlessui.com/react/menu)

### 2. Next.js 15 Changes

#### Async Request APIs (Headers, Cookies, Params)
In Next.js 15, dynamic APIs like `headers()`, `cookies()`, and route `params` are now asynchronous. 

**Before:**
```tsx
import { headers } from 'next/headers';

export default function Page() {
  const headersList = headers();
  // ...
}
```

**After:**
```tsx
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers();
  // ...
}
```

**Action required:** Search your codebase for:
- `headers()` - now needs `await headers()`
- `cookies()` - now needs `await cookies()`
- `params` prop in pages/layouts - now needs to be awaited

#### Middleware
Your middleware is already async, so it should work fine. The cookie access pattern is compatible.

### 3. React 18.3 Features
You can now use:
- React Server Components (stable)
- Improved Suspense support
- Better concurrent rendering

## Testing After Migration

1. **Check API routes:**
   ```bash
   # Test your auth endpoints
   curl http://localhost:3000/api/auth/[...nextauth]
   ```

2. **Test dynamic pages:**
   - Visit `/menu/[restaurantId]`
   - Visit `/panel/dishes`
   - Check if all dynamic routes work

3. **Run tests:**
   ```bash
   pnpm run test
   ```

4. **Check for console warnings:**
   - Look for deprecation warnings
   - Check for hydration errors

## Common Issues and Solutions

### Issue: Type errors with params
**Solution:** Update route handlers to await params:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

### Issue: Headless UI components not working
**Solution:** Check the v2 migration guide and update component usage:
- `as` prop usage has changed
- Some component APIs are different

### Issue: Build errors with Turbopack
**Solution:** If you encounter issues, you can disable Turbopack:
```bash
# Use webpack instead
pnpm run dev -- --no-turbopack
```

## Performance Improvements

Next.js 15 brings:
- Faster dev server with stable Turbopack
- Improved caching mechanisms
- Better build performance
- Optimized image loading

## Rollback Plan

If you need to rollback:
```bash
git checkout HEAD -- apps/menu-go/package.json packages/config/package.json packages/config/next.config.js
pnpm install
```

## Resources

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [React 18 Upgrade Guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
- [Headless UI v2 Migration](https://github.com/tailwindlabs/headlessui/releases)

## Next Steps

After migration:
1. Monitor for any runtime errors
2. Update any deprecated patterns
3. Consider enabling React 19 (optional - requires Next.js 15+)
4. Test thoroughly in production-like environment
