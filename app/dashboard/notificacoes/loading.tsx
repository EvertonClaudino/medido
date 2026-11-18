import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" role="status" aria-label={texts.dashboard.loading.dashboard}>
      <Skeleton className="motion-reduce:animate-none h-16 w-full" />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="motion-reduce:animate-none h-16 w-full" />
        ))}
      </div>
      <span className="sr-only">{texts.dashboard.loading.dashboard}</span>
    </div>
  );
}
