export default function EmptyList() {
  return (
    <div className="mt-6 grid place-items-center border-3 border-dashed border-ink/40 bg-bone p-12 text-center">
      <span className="font-display text-4xl">∅</span>
      <p className="mt-2 font-display text-lg font-extrabold">No dishes yet</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink/60">
        Add a dish from the catalog above
      </p>
    </div>
  );
}
