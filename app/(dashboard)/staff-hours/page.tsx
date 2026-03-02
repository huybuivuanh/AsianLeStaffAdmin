"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/use-users";
import { useShifts } from "@/hooks/use-shifts";
import { toDateKey, formatHours, formatTimeShort, getDaysInMonth } from "@/lib/utils";
import {
  getHoursWorked,
  updateShiftActualHours,
  clearShiftActualHours,
} from "@/lib/shifts";

function isClockInLate(shift: Shift): boolean {
  if (!shift.clockInTime) return false;
  return (
    shift.clockInTime.getTime() > shift.shift.start.getTime() + 5 * 60 * 1000
  );
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return toDateKey(start);
}

function getMonthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  const start = toDateKey(new Date(y, m - 1, 1));
  const lastDay = new Date(y, m, 0);
  const end = toDateKey(lastDay);
  return { start, end };
}

function getWeekRange(sundayKey: string): { start: string; end: string } {
  const d = new Date(sundayKey + "T12:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return { start: sundayKey, end: toDateKey(end) };
}

function getMonthOptions(count = 12): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    return { value, label };
  });
}

function getWeekOptions(count = 12): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - i * 7);
    const value = toDateKey(d);
    const label = `Week of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    return { value, label };
  });
}

export default function StaffHoursPage() {
  const users = useUsers();
  const shifts = useShifts();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toDateKey(d);
  });
  const [endDate, setEndDate] = useState(() => toDateKey(new Date()));
  const [selectedUserId, setSelectedUserId] = useState("");
  type ViewBy = "range" | "month" | "week";
  const [viewBy, setViewBy] = useState<ViewBy>("range");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return toDateKey(d);
  });
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editHoursInput, setEditHoursInput] = useState("");

  const { start: effectiveStart, end: effectiveEnd } = useMemo(() => {
    if (viewBy === "month") return getMonthRange(selectedMonth);
    if (viewBy === "week") return getWeekRange(selectedWeek);
    return { start: startDate, end: endDate };
  }, [viewBy, selectedMonth, selectedWeek, startDate, endDate]);

  const effectiveUserId =
    selectedUserId && users.some((u) => u.id === selectedUserId)
      ? selectedUserId
      : (users[0]?.id ?? "");

  const filteredShifts = useMemo(() => {
    if (!effectiveUserId) return [];
    return shifts
      .filter(
        (s) =>
          s.userId === effectiveUserId &&
          s.date >= effectiveStart &&
          s.date <= effectiveEnd,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, effectiveUserId, effectiveStart, effectiveEnd]);

  const totalHours = useMemo(
    () => filteredShifts.reduce((sum, s) => sum + getHoursWorked(s), 0),
    [filteredShifts],
  );

  const byWeek = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    for (const s of filteredShifts) {
      const week = getWeekKey(s.date);
      hoursMap[week] = (hoursMap[week] ?? 0) + getHoursWorked(s);
    }
    return Object.entries(hoursMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, h]) => [week, h] as const);
  }, [filteredShifts]);

  const byMonth = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    for (const s of filteredShifts) {
      const month = s.date.slice(0, 7);
      hoursMap[month] = (hoursMap[month] ?? 0) + getHoursWorked(s);
    }
    return Object.entries(hoursMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, h]) => [month, h] as const);
  }, [filteredShifts]);

  const selectedStaffName = users.find((u) => u.id === effectiveUserId)?.name;

  const viewMonthStart = useMemo(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    return toDateKey(d);
  }, [viewDate]);
  const viewMonthEnd = useMemo(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    return toDateKey(d);
  }, [viewDate]);

  const calendarShifts = useMemo(() => {
    if (!effectiveUserId) return [];
    return shifts
      .filter(
        (s) =>
          s.userId === effectiveUserId &&
          s.date >= viewMonthStart &&
          s.date <= viewMonthEnd,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, effectiveUserId, viewMonthStart, viewMonthEnd]);

  const shiftsByDateCalendar = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const s of calendarShifts) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [calendarShifts]);

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
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Staff Hours</h1>
        <p className="mt-2 text-zinc-600">
          Summary of hours and payroll export.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Staff
          </label>
          <select
            value={effectiveUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {users.length === 0 ? (
              <option value="" disabled>
                No staff
              </option>
            ) : null}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Period
          </label>
          <select
            value={viewBy}
            onChange={(e) => setViewBy(e.target.value as ViewBy)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="range">Date range</option>
            <option value="month">Month</option>
            <option value="week">Week</option>
          </select>
        </div>
        {viewBy === "month" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {getMonthOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        {viewBy === "week" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Week
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {getWeekOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        {viewBy === "range" && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          </>
        )}
      </div>

      {!effectiveUserId ? (
        <p className="mt-6 text-sm text-zinc-500">Add staff to see hours.</p>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
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
                  const dayShifts = shiftsByDateCalendar[key] ?? [];
                  const shift = dayShifts[0];
                  const isSelected = selectedDate === key;
                  const isToday = key === todayKey;
                  const isPast = key < todayKey;
                  const clockedInLate =
                    shift?.clockInTime &&
                    shift.clockInTime.getTime() >
                      shift.shift.start.getTime() + 5 * 60 * 1000;
                  const notClockedIn = shift && !shift.clockInTime && isPast;
                  const shiftTime = shift
                    ? `${formatTimeShort(shift.shift.start)}–${formatTimeShort(shift.shift.end)}`
                    : null;
                  const clockInText = shift?.clockInTime
                    ? formatTimeShort(shift.clockInTime)
                    : "";
                  const statusText = shift
                    ? notClockedIn
                      ? "Not clocked in"
                      : shiftTime
                    : null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDate(key);
                        if (shift) {
                          setEditingShiftId(shift.id);
                          setEditHoursInput(
                            getHoursWorked(shift).toFixed(2),
                          );
                        }
                      }}
                      className={`relative flex aspect-[4/3] min-w-0 flex-col items-start justify-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1"
                          : clockedInLate
                            ? "bg-red-50 text-red-900 hover:bg-red-100"
                            : isToday
                              ? "bg-amber-50 text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
                              : "bg-white text-zinc-800 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="text-lg font-semibold">
                        {d.getDate()}
                      </span>
                      {shift && (
                        <div className="flex min-w-0 max-w-full flex-col gap-0.5">
                          {statusText && (
                            <span
                              className={`truncate text-sm leading-tight ${
                                isSelected
                                  ? "text-blue-100"
                                  : notClockedIn
                                    ? "text-zinc-600 font-medium"
                                    : clockedInLate
                                      ? "text-red-700"
                                      : "text-zinc-600"
                              }`}
                            >
                              {shiftTime}
                            </span>
                          )}
                          <div
                            className={`truncate text-sm leading-tight ${
                              isSelected
                                ? "text-blue-100"
                                : notClockedIn
                                  ? "text-zinc-600 font-medium"
                                  : clockedInLate
                                    ? "text-red-700"
                                    : "text-zinc-600"
                            }`}
                          >
                            Br:{" "}
                            {shift.break
                              ? `${formatTimeShort(shift.break.start)} – ${formatTimeShort(shift.break.end)}`
                              : "None"}
                          </div>
                          {notClockedIn ? (
                            <span
                              className={`truncate text-sm font-medium ${
                                isSelected
                                  ? "text-blue-200"
                                  : "text-red-600"
                              }`}
                            >
                              Not Clocked In
                            </span>
                          ) : (
                            <span
                              className={`truncate text-sm font-medium ${
                                isSelected
                                  ? "text-blue-200"
                                  : "text-zinc-600"
                              }`}
                            >
                              Clocked In: {clockInText}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredShifts.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-700">
                  Total ({effectiveStart} – {effectiveEnd})
                </h3>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {formatHours(totalHours)}
                </p>
                {selectedStaffName && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedStaffName}
                  </p>
                )}
              </div>
              {byWeek.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-700">
                    By week
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {byWeek.map(([week, h]) => (
                      <li
                        key={week}
                        className="flex justify-between text-zinc-700"
                      >
                        <span>
                          Week of{" "}
                          {new Date(week + "T12:00:00").toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                        <span>{formatHours(h)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {byMonth.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:col-span-2">
                  <h3 className="text-sm font-semibold text-zinc-700">
                    By month
                  </h3>
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
          )}
          {editingShiftId &&
            (() => {
              const shift = shifts.find((s) => s.id === editingShiftId);
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                  onClick={() => setEditingShiftId(null)}
                >
                  <div
                    className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {shift ? (
                      <>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          Edit hours —{" "}
                          {new Date(
                            shift.date + "T12:00:00",
                          ).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          {shift.userName} · Computed:{" "}
                          {formatHours(getHoursWorked(shift))}
                          {shift.actualHours !== undefined && " (overridden)"}
                        </p>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-zinc-700">
                            Hours
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={0.25}
                            value={editHoursInput}
                            onChange={(e) => setEditHoursInput(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                          />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const val = parseFloat(editHoursInput);
                              if (!Number.isFinite(val) || val < 0) return;
                              await updateShiftActualHours(editingShiftId, val);
                              setEditingShiftId(null);
                            }}
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={shift.actualHours === undefined}
                            onClick={async () => {
                              await clearShiftActualHours(editingShiftId);
                              setEditingShiftId(null);
                            }}
                            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reset to calculated
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingShiftId(null)}
                            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-zinc-600">
                          Shift no longer in view.
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditingShiftId(null)}
                          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                        >
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
        </>
      )}
    </div>
  );
}
