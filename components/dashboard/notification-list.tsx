import Link from "next/link";
import { Bell } from "lucide-react";
import type { DashboardNotification } from "@/lib/dashboard-notifications";
import { texts } from "@/lib/texts";

function formatRelativeTime(date: Date): string {
  const difference = date.getTime() - Date.now();
  const absoluteDifference = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });

  if (absoluteDifference < 60_000) return texts.dashboard.notifications.justNow;
  if (absoluteDifference < 3_600_000) {
    return formatter.format(Math.round(difference / 60_000), "minute");
  }
  if (absoluteDifference < 86_400_000) {
    return formatter.format(Math.round(difference / 3_600_000), "hour");
  }
  return formatter.format(Math.round(difference / 86_400_000), "day");
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function NotificationList({
  notifications,
}: {
  notifications: DashboardNotification[];
}) {
  if (notifications.length === 0) {
    return <p className="p-5 text-sm text-slate-600 dark:text-slate-400">{texts.dashboard.notifications.empty}</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {notifications.map((notification) => {
        const label = texts.dashboard.notifications.types[notification.type];
        const dateTitle = formatDateTime(notification.occurredAt);
        return (
          <li key={notification.id}>
            <Link
              href={notification.href}
              className="flex items-start gap-3 p-4 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-700 dark:hover:bg-slate-800"
            >
              <span className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300" aria-hidden="true">
                <Bell className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-900 dark:text-white">
                  {notification.title}
                </span>
                <time
                  dateTime={notification.occurredAt.toISOString()}
                  title={dateTitle}
                  className="mt-1 block text-[11px] text-slate-600 dark:text-slate-400"
                >
                  {formatRelativeTime(notification.occurredAt)}
                </time>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
