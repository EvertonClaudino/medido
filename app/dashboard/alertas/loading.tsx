import { Skeleton } from "@/components/ui/skeleton";

export default function AlertasLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" aria-label="A carregar alertas" role="status">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
      <span className="sr-only">A carregar alertas</span>
    </div>
  );
}
