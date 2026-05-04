export default function InfoAlert({ path }) {
  return (
    <div className="flex items-start gap-3 border-3 border-ink bg-sky/40 p-4 shadow-brut-sm">
      <span className="grid h-7 w-7 flex-shrink-0 place-items-center border-3 border-ink bg-paper font-display text-sm font-extrabold">
        i
      </span>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-sm">
          Create a new catalog to start adding dishes.
        </p>
        <a
          href={`${path}/dishes`}
          className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest underline-offset-4 hover:underline"
        >
          Open catalog <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
