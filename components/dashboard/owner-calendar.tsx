"use client"

import { pt } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { getLisbonDateKey } from "@/lib/dashboard-utils"
import { texts } from "@/lib/texts"

function getMonthKey(date: Date): string {
  return getLisbonDateKey(date).slice(0, 7)
}

function dateFromKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00Z`)
}

export function OwnerCalendar({
  monthKey,
  selectedDateKey,
  taskCounts,
}: {
  monthKey: string
  selectedDateKey?: string
  taskCounts: Record<string, number>
}) {
  const router = useRouter()
  const month = dateFromKey(`${monthKey}-01`)
  const selected = selectedDateKey ? dateFromKey(selectedDateKey) : undefined

  function navigate(monthKey: string, dateKey?: string) {
    const params = new URLSearchParams({ mes: monthKey })
    if (dateKey) params.set("dia", dateKey)
    router.push(`/dashboard?${params.toString()}`, { scroll: false })
  }

  return (
    <Calendar
      mode="single"
      month={month}
      selected={selected}
      onSelect={(date) => {
        navigate(date ? getMonthKey(date) : monthKey, date ? getLisbonDateKey(date) : undefined)
      }}
      onMonthChange={(date) => {
        const nextMonthKey = getMonthKey(date)
        if (nextMonthKey !== monthKey) navigate(nextMonthKey)
      }}
      locale={pt}
      timeZone="Europe/Lisbon"
      fixedWeeks
      className="mx-auto w-full max-w-full"
      components={{
        DayButton: (props) => {
          const dateKey = getLisbonDateKey(props.day.date)
          const count = taskCounts[dateKey] ?? 0
          const dateLabel = new Intl.DateTimeFormat("pt-PT", {
            timeZone: "Europe/Lisbon",
            dateStyle: "full",
          }).format(new Date(`${dateKey}T12:00:00Z`))

          return (
            <CalendarDayButton
              {...props}
              className="gap-0.5"
              aria-label={`${dateLabel}, ${texts.dashboard.calendar.tasksOnDate(count)}`}
            >
              {props.children}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className="h-3 px-1 text-[8px] leading-none"
                  aria-hidden="true"
                >
                  {count}
                </Badge>
              )}
            </CalendarDayButton>
          )
        },
      }}
    />
  )
}
