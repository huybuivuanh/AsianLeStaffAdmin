"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/use-users";
import { useShifts } from "@/hooks/use-shifts";
import {
  getWeekKey,
  getMonthRange,
  getWeekRange,
  getMonthOptions,
  getWeekOptions,
} from "@/lib/periodUtils";
import { toDateKey, formatHours, getDaysInMonth } from "@/lib/utils";
import { getHoursWorked } from "@/lib/shifts";
import { MonthCalendarNav } from "@/components/calendar/month-calendar-nav";
import { HoursCalendarDayCell } from "@/components/calendar/hours-calendar-day-cell";
import { HoursSummaryCards } from "@/components/calendar/hours-summary-cards";
import { EditHoursModal } from "@/components/shifts/edit-hours-modal";

type ViewBy = "range" | "month" | "week";
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    return shifts.filter(
      (s) =>
        s.userId === effectiveUserId &&
        s.date >= effectiveStart &&
        s.date <= effectiveEnd,
    );
  }, [shifts, effectiveUserId, effectiveStart, effectiveEnd]);

  const totalHours = useMemo(
    () => filteredShifts.reduce((sum, s) => sum + getHoursWorked(s), 0),
    [filteredShifts],
  );

  const byWeek = useMemo((): readonly (readonly [string, number])[] => {
    const hoursMap: Record<string, number> = {};
    for (const s of filteredShifts) {
      const week = getWeekKey(s.date);
      hoursMap[week] = (hoursMap[week] ?? 0) + getHoursWorked(s);
    }
    return Object.entries(hoursMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, h]) => [week, h] as const);
  }, [filteredShifts]);

  const byMonth = useMemo((): readonly (readonly [string, number])[] => {
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

  function handleDaySelect(dateKey: string, shift: Shift | null) {
    setSelectedDate(dateKey);
    if (shift) {
      setEditingShiftId(shift.id);
      setEditHoursInput(getHoursWorked(shift).toFixed(2));
    }
  }

  const editingShift = editingShiftId
    ? shifts.find((s) => s.id === editingShiftId) ?? null
    : null;

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
                  const dayShifts = shiftsByDateCalendar[key] ?? [];
                  const shift = dayShifts[0] ?? null;
                  return (
                    <HoursCalendarDayCell
                      key={key}
                      date={d}
                      dateKey={key}
                      shift={shift}
                      isSelected={selectedDate === key}
                      isToday={key === todayKey}
                      todayKey={todayKey}
                      onSelect={handleDaySelect}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {filteredShifts.length > 0 && (
            <HoursSummaryCards
              effectiveStart={effectiveStart}
              effectiveEnd={effectiveEnd}
              totalHours={totalHours}
              selectedStaffName={selectedStaffName ?? null}
              byWeek={byWeek}
              byMonth={byMonth}
            />
          )}

          {editingShiftId && (
            <EditHoursModal
              shiftId={editingShiftId}
              shift={editingShift}
              hoursInput={editHoursInput}
              onHoursInputChange={setEditHoursInput}
              onSave={() => setEditingShiftId(null)}
              onClose={() => setEditingShiftId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
