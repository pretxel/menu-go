/* eslint-disable react/self-closing-comp */
'use client';

import { PutBlobResult } from '@vercel/blob';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { updateDish } from '../../app/actions';
import LoadingDots from './loading-dots';

export default function Uploader({ dishId }) {
  const [data, setData] = useState<{ image: string | null }>({ image: null });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const onChangePicture = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files && event.currentTarget.files[0];
      if (file && file.size / 1024 / 1024 <= 50) {
        setFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setData((prev) => ({ ...prev, image: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    },
    [setData]
  );

  const saveDisabled = useMemo(() => !data.image || saving, [data.image, saving]);

  return (
    <form
      className="card-brut p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        fetch('/api/upload', {
          method: 'POST',
          headers: { 'content-type': file?.type || 'application/octet-stream' },
          body: file,
        }).then(async (res) => {
          if (res.status === 200) {
            const { url } = (await res.json()) as PutBlobResult;
            await updateDish(dishId, url);
            toast.success('Image uploaded');
          } else {
            toast.error("Upload failed");
          }
          setSaving(false);
        });
      }}
    >
      <div className="border-b-3 border-ink pb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-tomato">
          Asset / image
        </span>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
          Dish photo
        </h2>
        <p className="mt-1 font-mono text-xs text-ink/60">
          .png · .jpg · max 50MB
        </p>
      </div>

      <label
        htmlFor="image-upload"
        className={`relative mt-6 block aspect-video cursor-pointer overflow-hidden border-3 transition-all ${
          dragActive ? 'border-tomato shadow-brut-tomato' : 'border-ink'
        } bg-bone`}
      >
        <div
          className="absolute inset-0 z-5"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file && file.size / 1024 / 1024 <= 50) {
              setFile(file);
              const reader = new FileReader();
              reader.onload = (e) => {
                setData((prev) => ({ ...prev, image: e.target?.result as string }));
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        <div
          className={`absolute inset-0 z-3 flex flex-col items-center justify-center gap-2 px-10 transition-all ${
            data.image ? 'bg-paper/0 opacity-0 hover:bg-paper/85 hover:opacity-100' : 'opacity-100'
          }`}
        >
          <div className="grid h-12 w-12 place-items-center border-3 border-ink bg-mustard shadow-brut-sm">
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
          </div>
          <p className="font-display text-base font-extrabold tracking-tight">
            Drop file or click
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
            Max 50MB
          </p>
        </div>
        {data.image && (
          // Preview is a FileReader base64 data URL — next/image cannot optimize
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image}
            alt="Preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </label>
      <input
        id="image-upload"
        name="image"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChangePicture}
      />

      <button
        disabled={saveDisabled}
        className={`mt-6 flex h-12 w-full items-center justify-center border-3 border-ink font-display text-sm font-bold uppercase tracking-tight transition-all ${
          saveDisabled
            ? 'cursor-not-allowed bg-bone text-ink/40'
            : 'bg-tomato text-paper shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg'
        }`}
      >
        {saving ? <LoadingDots color="#FAFAF5" /> : 'Confirm upload →'}
      </button>
    </form>
  );
}
