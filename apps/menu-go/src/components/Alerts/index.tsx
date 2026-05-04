export default function SuccessMessage({ message }) {
  return (
    <div className="flex items-start gap-3 border-3 border-ink bg-lime p-4 shadow-brut-sm">
      <span className="grid h-7 w-7 shrink-0 place-items-center border-3 border-ink bg-paper font-display text-sm font-extrabold">
        ✓
      </span>
      <p className="font-mono text-sm font-bold">{message}</p>
    </div>
  );
}
