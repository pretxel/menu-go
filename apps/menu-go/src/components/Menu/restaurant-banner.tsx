export default function Banner({ restaurant }) {
  return (
    <header className="relative isolate overflow-hidden border-b-3 border-ink">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 stripe-bg opacity-[0.06]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rotate-12 border-3 border-ink shadow-brut-lg"
        style={{ background: 'var(--color-primary, #FF3B2E)' }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <span className="inline-flex w-fit items-center gap-2 border-3 border-ink bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] shadow-brut-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: 'var(--color-primary, #FF3B2E)' }}
          />
          Today&apos;s menu
        </span>
        <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] font-extrabold leading-[0.9] tracking-tight">
          {restaurant.name}
        </h1>
        {(restaurant.address || restaurant.phone) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-widest text-ink/80 sm:text-sm">
            {restaurant.address && <span>{restaurant.address}</span>}
            {restaurant.address && restaurant.phone && (
              <span aria-hidden className="text-ink/30">
                ◆
              </span>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="hover:underline">
                {restaurant.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
