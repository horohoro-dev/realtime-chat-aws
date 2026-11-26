type SkeletonProps = {
  label: string;
  rows?: number;
};

const widths = ["w-3/5", "w-2/5", "w-4/5", "w-1/2", "w-2/3"] as const;

// 読み込み中は、行の形だけを薄く出し、読み上げには label を伝える
export function Skeleton({ label, rows = 3 }: SkeletonProps) {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{label}</span>
      {widths.slice(0, rows).map((width) => (
        <div key={width} aria-hidden="true" className="flex items-center gap-3">
          <span className="bg-kamenozoki size-8 shrink-0 animate-pulse rounded-full motion-reduce:animate-none" />
          <span
            className={`bg-kamenozoki h-3 animate-pulse rounded-full motion-reduce:animate-none ${width}`}
          />
        </div>
      ))}
    </div>
  );
}
