"use client";

import { useState, useEffect } from "react";
import { useUsers } from "@/hooks/use-users";
import { toDateKey, getDaysInMonth } from "@/lib/utils";
import { getTipsForDate } from "@/lib/tips";
import { AddTipsModal } from "@/components/tips/add-tips-modal";

const ALL_STAFF_ID = "";

export default function TipsPage() {
  const users = useUsers();
  const [selectedUserId, setSelectedUserId] = useState(ALL_STAFF_ID);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addTipsModalOpen, setAddTipsModalOpen] = useState(false);
  const [tipsByDate, setTipsByDate] = useState<Record<string, Tips | null>>({});

  const effectiveUserId = selectedUserId || ALL_STAFF_ID;

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const todayKey = toDateKey(new Date());
  const calendarDays = getDaysInMonth(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );
  const weekStart = monthStart.getDay();
  const padding = Array(weekStart).fill(null);

  useEffect(() => {
    const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const dateKeys = days.map((d) => toDateKey(d));
    let cancelled = false;
    Promise.all(dateKeys.map((key) => getTipsForDate(key)))
      .then((results) => {
        if (cancelled) return;
        setTipsByDate((prev) => {
          const next = { ...prev };
          dateKeys.forEach((key, i) => {
            next[key] = results[i];
          });
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [viewDate]);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <select
            value={effectiveUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value={ALL_STAFF_ID}>All staff</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
            aria-label="Previous month"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-lg font-semibold tracking-tight text-zinc-800">
            {viewDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
            aria-label="Next month"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px rounded-lg bg-zinc-100 p-px">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
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
              const tips = tipsByDate[key] ?? null;
              const isSelected = selectedDate === key;
              const isToday = key === todayKey;
              const total = tips?.total ?? 0;
              const hasTips = total > 0;
              const amCash = tips?.morningCash ?? 0;
              const amCard = tips?.morningCard ?? 0;
              const pmCash = tips?.afternoonCash ?? 0;
              const pmCard = tips?.afternoonCard ?? 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedDate(key);
                    setAddTipsModalOpen(true);
                  }}
                  className={`relative flex aspect-[4/3] min-w-0 flex-col items-start justify-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1"
                      : isToday
                        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
                        : "bg-white text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-lg font-semibold">{d.getDate()}</span>
                  <div className="flex min-w-0 max-w-full flex-col gap-0.5">
                    {hasTips && (
                      <>
                        <span
                          className={`truncate text-xs leading-tight ${
                            isSelected ? "text-blue-200" : "text-zinc-600"
                          }`}
                        >
                          AM Cash: ${amCash.toFixed(2)}
                        </span>
                        <span
                          className={`truncate text-xs leading-tight ${
                            isSelected ? "text-blue-200" : "text-zinc-600"
                          }`}
                        >
                          AM Card: ${amCard.toFixed(2)}
                        </span>
                        <span
                          className={`truncate text-xs leading-tight ${
                            isSelected ? "text-blue-200" : "text-zinc-600"
                          }`}
                        >
                          PM Cash: ${pmCash.toFixed(2)}
                        </span>
                        <span
                          className={`truncate text-xs leading-tight ${
                            isSelected ? "text-blue-200" : "text-zinc-600"
                          }`}
                        >
                          PM Card: ${pmCard.toFixed(2)}
                        </span>
                        <span
                          className={`truncate text-sm font-medium leading-tight ${
                            isSelected ? "text-blue-100" : "text-zinc-800"
                          }`}
                        >
                          Total: ${total.toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AddTipsModal
        isOpen={addTipsModalOpen}
        selectedDate={selectedDate}
        onClose={() => setAddTipsModalOpen(false)}
        onSuccess={() => {
          if (selectedDate) {
            getTipsForDate(selectedDate).then((tips) =>
              setTipsByDate((prev) => ({ ...prev, [selectedDate]: tips })),
            );
          }
        }}
      />
    </div>
  );
}
