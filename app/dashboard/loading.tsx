import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

export default function DashboardLoading() {
  return (
    <div className="space-y-5" role="status" aria-label={texts.dashboard.loading.dashboard}>
      <Skeleton className="motion-reduce:animate-none h-20 w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="motion-reduce:animate-none h-32 w-full" />
        ))}
      </div>
      <Skeleton className="motion-reduce:animate-none h-72 w-full" />
      <span className="sr-only">{texts.dashboard.loading.dashboard}</span>
    </div>
  );
}
