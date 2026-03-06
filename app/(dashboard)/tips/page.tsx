"use client";

import { useState, useMemo } from "react";
import { useTips } from "@/hooks/use-tips";
import { toDateKey, getDaysInMonth } from "@/lib/utils";
import { MonthCalendarNav } from "@/components/calendar/month-calendar-nav";
import { TipsCalendarDayCell } from "@/components/calendar/tips-calendar-day-cell";
import { AddTipsModal } from "@/components/tips/add-tips-modal";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TipsPage() {
  const tips = useTips();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addTipsModalOpen, setAddTipsModalOpen] = useState(false);

  const tipsByDate = useMemo(() => {
    const map: Record<string, Tips | null> = {};
    for (const t of tips) {
      map[t.date] = t;
    }
    return map;
  }, [tips]);

  const viewMonthPrefix = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;
  const monthlySummary = useMemo(() => {
    const inMonth = tips.filter((t) => t.date.startsWith(viewMonthPrefix));
    return inMonth.reduce(
      (acc, t) => ({
        morningCash: acc.morningCash + (t.morningCash ?? 0),
        morningCard: acc.morningCard + (t.morningCard ?? 0),
        afternoonCash: acc.afternoonCash + (t.afternoonCash ?? 0),
        afternoonCard: acc.afternoonCard + (t.afternoonCard ?? 0),
        total: acc.total + (t.total ?? 0),
      }),
      { morningCash: 0, morningCard: 0, afternoonCash: 0, afternoonCard: 0, total: 0 },
    );
  }, [tips, viewMonthPrefix]);

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const todayKey = toDateKey(new Date());
  const calendarDays = getDaysInMonth(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );
  const weekStart = monthStart.getDay();
  const padding = Array(weekStart).fill(null);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  }

  return (
    <div>
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
        <MonthCalendarNav
          viewDate={viewDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px rounded-lg bg-zinc-100 p-px">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="rounded-sm bg-zinc-50 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {d}
              </div>
            ))}
            {padding.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-[4/3]" />
            ))}
            {calendarDays.map((d) => {
              const key = toDateKey(d);
              const dayTips = tipsByDate[key] ?? null;
              return (
                <TipsCalendarDayCell
                  key={key}
                  date={d}
                  dateKey={key}
                  tips={dayTips}
                  isSelected={selectedDate === key}
                  isToday={key === todayKey}
                  onClick={() => {
                    setSelectedDate(key);
                    setAddTipsModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-700">
            {viewDate.toLocaleString("default", { month: "long", year: "numeric" })} summary
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-zinc-600">
              AM cash: ${monthlySummary.morningCash.toFixed(2)}
            </span>
            <span className="text-zinc-600">
              AM card: ${monthlySummary.morningCard.toFixed(2)}
            </span>
            <span className="text-zinc-600">
              PM cash: ${monthlySummary.afternoonCash.toFixed(2)}
            </span>
            <span className="text-zinc-600">
              PM card: ${monthlySummary.afternoonCard.toFixed(2)}
            </span>
            <span className="font-semibold text-zinc-900">
              Total: ${monthlySummary.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <AddTipsModal
        isOpen={addTipsModalOpen}
        selectedDate={selectedDate}
        onClose={() => setAddTipsModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
