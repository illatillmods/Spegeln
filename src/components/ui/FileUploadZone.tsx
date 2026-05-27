"use client";

type FileUploadZoneProps = {
  accept?: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  helper?: string;
};

export function FileUploadZone({ accept, multiple, onChange, helper }: FileUploadZoneProps) {
  return (
    <label className="block cursor-pointer rounded-3xl border border-dashed border-[rgba(22,32,42,0.16)] bg-white/70 px-4 py-6 text-center transition hover:border-[rgba(15,118,110,0.28)]">
      <input
        accept={accept}
        className="sr-only"
        multiple={multiple}
        onChange={(event) => onChange(event.target.files)}
        type="file"
      />
      <p className="text-sm font-medium text-(--foreground)">Dra filer hit eller klicka för att välja</p>
      {helper ? <p className="mt-2 text-(--muted) text-xs leading-6">{helper}</p> : null}
    </label>
  );
}
