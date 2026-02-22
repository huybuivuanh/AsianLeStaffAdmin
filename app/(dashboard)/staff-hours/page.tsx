"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/use-users";
import { useShifts } from "@/hooks/use-shifts";
import { toDateKey, formatHours } from "@/lib/utils";
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
    const map: Record<string, number> = {};
    for (const s of filteredShifts) {
      const week = getWeekKey(s.date);
      map[week] = (map[week] ?? 0) + getHoursWorked(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredShifts]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of filteredShifts) {
      const month = s.date.slice(0, 7);
      map[month] = (map[month] ?? 0) + getHoursWorked(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredShifts]);

  const selectedStaffName = users.find((u) => u.id === effectiveUserId)?.name;

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
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Staff
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Shift
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Clock-in
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Break
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Hours
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-zinc-500"
                      >
                        No shifts in this range.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map((s) => {
                      const late = isClockInLate(s);
                      return (
                        <tr
                          key={s.id}
                          className={
                            late
                              ? "bg-red-50 hover:bg-red-100/80"
                              : "hover:bg-zinc-50/50"
                          }
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900">
                            {new Date(s.date + "T12:00:00").toLocaleDateString(
                              undefined,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                            {s.userName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                            {s.shift.start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {s.shift.end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td
                            className={
                              late
                                ? "whitespace-nowrap px-4 py-3 text-sm font-medium text-red-700"
                                : "whitespace-nowrap px-4 py-3 text-sm text-zinc-600"
                            }
                          >
                            {s.clockInTime
                              ? s.clockInTime.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "–"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                            {s.break
                              ? `${s.break.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${s.break.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                              : "–"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-zinc-900">
                            {formatHours(getHoursWorked(s))}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingShiftId(s.id);
                                setEditHoursInput(getHoursWorked(s).toFixed(2));
                              }}
                              className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900"
                            >
                              Edit hours
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
                        <span className="font-medium">{formatHours(h)}</span>
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
              const shift = filteredShifts.find((s) => s.id === editingShiftId);
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
