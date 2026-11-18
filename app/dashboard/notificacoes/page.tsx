import { Role } from "@prisma/client";
import Link from "next/link";
import { NotificationList } from "@/components/dashboard/notification-list";
import { requireRole } from "@/lib/auth";
import { getDashboardNotifications } from "@/lib/dashboard-notifications";
import { texts } from "@/lib/texts";

export default async function NotificacoesPage() {
  const user = await requireRole([Role.OWNER]);
  const notifications = await getDashboardNotifications(user.companyId, { limit: 100 });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {texts.dashboard.notifications.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {texts.dashboard.notifications.pageDescription}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="w-fit rounded-sm text-sm font-semibold text-amber-800 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:text-amber-300"
        >
          ← {texts.dashboard.notifications.backToDashboard}
        </Link>
      </header>

      <section
        aria-label={texts.dashboard.notifications.title}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <NotificationList notifications={notifications} />
      </section>
    </div>
  );
}
