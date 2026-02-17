"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/use-users";
import { useShifts } from "@/hooks/use-shifts";
import { AddShiftModal } from "@/components/shifts/add-shift-modal";
import { DeleteShiftModal } from "@/components/shifts/delete-shift-modal";

function getHoursWorked(shift: Shift): number {
  if (shift.actualHours !== undefined) return shift.actualHours;
  if (!shift.clockInTime) return 0;
  const start = shift.clockInTime.getTime();
  const end = shift.shiftEnds.getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function StaffHoursPage() {
  const users = useUsers();
  const shifts = useShifts();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [deleteShiftModalOpen, setDeleteShiftModalOpen] = useState(false);

  const filteredShifts = useMemo(() => {
    if (!selectedUserId) return shifts;
    return shifts.filter((s) => s.userId === selectedUserId);
  }, [shifts, selectedUserId]);

  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const s of filteredShifts) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [filteredShifts]);

  const selectedDayShifts = selectedDate
    ? (shiftsByDate[selectedDate] ?? [])
    : [];
  const selectedDayHours = selectedDayShifts.reduce(
    (sum, s) => sum + getHoursWorked(s),
    0,
  );

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const periodShifts = filteredShifts.filter((s) => {
    return s.date >= toDateKey(monthStart) && s.date <= toDateKey(monthEnd);
  });
  const periodHours = periodShifts.reduce(
    (sum, s) => sum + getHoursWorked(s),
    0,
  );
  const daysWorked = new Set(periodShifts.map((s) => s.date)).size;

  const calendarDays = getDaysInMonth(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );
  const weekStart = (monthStart.getDay() + 6) % 7;
  const padding = Array(weekStart).fill(null);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Staff Hours</h1>
          <p className="mt-2 text-zinc-600">
            View shifts and hours by staff member.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAddShiftModalOpen(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Add shift
          </button>
          <button
            type="button"
            onClick={() => setDeleteShiftModalOpen(true)}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            Delete shifts
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Staff
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="">All staff</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded px-2 py-1 text-zinc-600 hover:bg-zinc-100"
              >
                ←
              </button>
              <span className="font-medium text-zinc-900">
                {viewDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded px-2 py-1 text-zinc-600 hover:bg-zinc-100"
              >
                →
              </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-1 font-medium text-zinc-500">
                  {d}
                </div>
              ))}
              {padding.map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {calendarDays.map((d) => {
                const key = toDateKey(d);
                const hasShifts = (shiftsByDate[key]?.length ?? 0) > 0;
                const isSelected = selectedDate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={`rounded py-2 text-zinc-900 hover:bg-zinc-100 ${
                      isSelected
                        ? "bg-zinc-900 text-white hover:bg-zinc-800"
                        : ""
                    } ${hasShifts ? "font-medium" : ""}`}
                  >
                    {d.getDate()}
                    {hasShifts && (
                      <span
                        className={`ml-0.5 inline-block h-1 w-1 rounded-full ${
                          isSelected ? "bg-white" : "bg-zinc-500"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h3 className="font-medium text-zinc-900">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString(
                    undefined,
                    { weekday: "long", month: "short", day: "numeric" },
                  )
                : "Select a day"}
            </h3>
            {selectedDate ? (
              selectedDayShifts.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {selectedDayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="rounded border border-zinc-100 bg-zinc-50 p-2 text-sm"
                    >
                      <div className="font-medium text-zinc-900">
                        {shift.userName}
                      </div>
                      <div className="text-zinc-600">
                        {shift.shiftStarts.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {shift.shiftEnds.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {shift.clockInTime ? (
                        <div className="mt-1 text-xs text-zinc-500">
                          Clocked in:{" "}
                          {shift.clockInTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • {formatHours(getHoursWorked(shift))}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-amber-600">
                          Not clocked in
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-t border-zinc-200 pt-2 font-medium text-zinc-900">
                    Total: {formatHours(selectedDayHours)}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">
                  No shifts this day.
                </p>
              )
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                Click a date to view shifts.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h3 className="font-medium text-zinc-900">Summary</h3>
            <p className="mt-2 text-sm text-zinc-600">
              {viewDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="mt-2 flex gap-4">
              <div>
                <span className="text-2xl font-semibold text-zinc-900">
                  {formatHours(periodHours)}
                </span>
                <span className="ml-1 text-sm text-zinc-500">total hours</span>
              </div>
              <div>
                <span className="text-2xl font-semibold text-zinc-900">
                  {daysWorked}
                </span>
                <span className="ml-1 text-sm text-zinc-500">days worked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddShiftModal
        isOpen={addShiftModalOpen}
        users={users}
        onClose={() => setAddShiftModalOpen(false)}
        onSuccess={() => {}}
      />
      <DeleteShiftModal
        isOpen={deleteShiftModalOpen}
        users={users}
        onClose={() => setDeleteShiftModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
