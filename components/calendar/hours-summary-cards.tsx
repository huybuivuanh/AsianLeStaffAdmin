"use client";

import { formatHours } from "@/lib/utils";

interface HoursSummaryCardsProps {
  effectiveStart: string;
  effectiveEnd: string;
  totalHours: number;
  selectedStaffName: string | null;
  byWeek: readonly (readonly [string, number])[];
  byMonth: readonly (readonly [string, number])[];
}

export function HoursSummaryCards({
  effectiveStart,
  effectiveEnd,
  totalHours,
  selectedStaffName,
  byWeek,
  byMonth,
}: HoursSummaryCardsProps) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-700">
          Total ({effectiveStart} – {effectiveEnd})
        </h3>
        <p className="mt-2 text-2xl font-semibold text-zinc-900">
          {formatHours(totalHours)}
        </p>
        {selectedStaffName && (
          <p className="mt-1 text-xs text-zinc-500">{selectedStaffName}</p>
        )}
      </div>
      {byWeek.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-700">By week</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {byWeek.map(([week, h]) => (
              <li
                key={week}
                className="flex justify-between text-zinc-700"
              >
                <span>
                  Week of{" "}
                  {new Date(week + "T12:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>{formatHours(h)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {byMonth.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-700">By month</h3>
          <ul className="mt-2 flex flex-wrap gap-4 text-sm">
            {byMonth.map(([month, h]) => (
              <li
                key={month}
                className="flex justify-between gap-2 text-zinc-700"
              >
                <span>
                  {new Date(month + "-01").toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="font-medium">{formatHours(h)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
