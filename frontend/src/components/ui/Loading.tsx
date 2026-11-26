import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type LoadingProps = {
  children: ReactNode;
};

export function Loading({ children }: LoadingProps) {
  return (
    <p role="status" className="text-muted flex items-center gap-2 text-sm">
      <LoaderCircle
        aria-hidden="true"
        className="size-4 animate-spin motion-reduce:animate-none"
        strokeWidth={2}
      />
      {children}
    </p>
  );
}
