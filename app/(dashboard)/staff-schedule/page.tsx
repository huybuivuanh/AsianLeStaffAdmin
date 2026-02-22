"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/use-users";
import { useShifts } from "@/hooks/use-shifts";
import { AddShiftModal } from "@/components/shifts/add-shift-modal";
import { DeleteShiftModal } from "@/components/shifts/delete-shift-modal";
import { EditShiftModal } from "@/components/shifts/edit-shift-modal";
import { toDateKey, getDaysInMonth, formatHours } from "@/lib/utils";
import { getHoursWorked } from "@/lib/shifts";

export default function StaffHoursPage() {
  const users = useUsers();
  const shifts = useShifts();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [deleteShiftModalOpen, setDeleteShiftModalOpen] = useState(false);
  const [editShiftModalOpen, setEditShiftModalOpen] = useState(false);

  const effectiveUserId =
    selectedUserId && users.some((u) => u.id === selectedUserId)
      ? selectedUserId
      : (users[0]?.id ?? "");

  const filteredShifts = useMemo(() => {
    if (!effectiveUserId) return [];
    return shifts.filter((s) => s.userId === effectiveUserId);
  }, [shifts, effectiveUserId]);

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
  const todayKey = toDateKey(new Date());
  const calendarDays = getDaysInMonth(
    viewDate.getFullYear(),
    viewDate.getMonth(),
  );
  const weekStart = monthStart.getDay(); // 0=Sun, 1=Mon, ...
  const padding = Array(weekStart).fill(null);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  }

  const hasShiftsOnSelectedDate = selectedDayShifts.length > 0;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Staff Schedule</h1>
        <p className="mt-2 text-zinc-600">View schedule by staff member.</p>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-4">
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
                const dayShifts = shiftsByDate[key] ?? [];
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
                  ? `${shift.shift.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–${shift.shift.end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                  : null;
                const clockInText = shift?.clockInTime
                  ? shift.clockInTime.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
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
                    onClick={() => setSelectedDate(key)}
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
                    <span className="text-lg font-semibold">{d.getDate()}</span>
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
                        {notClockedIn ? (
                          <span
                            className={`truncate text-sm font-medium ${
                              isSelected ? "text-blue-200" : "text-red-600"
                            }`}
                          >
                            Not Clocked In
                          </span>
                        ) : (
                          <span
                            className={`truncate text-sm font-medium ${
                              isSelected ? "text-blue-200" : "text-zinc-600"
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

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-medium text-zinc-900">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString(
                    undefined,
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )
                : "Select a day"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAddShiftModalOpen(true)}
                disabled={hasShiftsOnSelectedDate}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add shifts
              </button>
              <button
                type="button"
                onClick={() => setEditShiftModalOpen(true)}
                disabled={!hasShiftsOnSelectedDate}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Edit shifts
              </button>
              <button
                type="button"
                onClick={() => setDeleteShiftModalOpen(true)}
                disabled={!hasShiftsOnSelectedDate}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete shifts
              </button>
            </div>
          </div>
          {selectedDate ? (
            selectedDayShifts.length > 0 ? (
              <div className="mt-4 space-y-2">
                {selectedDayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="rounded border border-zinc-100 bg-zinc-50 p-3 text-sm"
                  >
                    <div className="font-medium text-zinc-900">
                      {shift.userName}
                    </div>
                    <div className="text-zinc-600">
                      {shift.shift.start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {shift.shift.end.toLocaleTimeString([], {
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
                    ) : selectedDate && selectedDate < todayKey ? (
                      <div className="mt-1 text-xs text-amber-600">
                        Not clocked in
                      </div>
                    ) : null}
                  </div>
                ))}
                <div className="border-t border-zinc-200 pt-3 font-medium text-zinc-900">
                  Total: {formatHours(selectedDayHours)}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No shifts this day. Click Add shift to add one.
              </p>
            )
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              Click a date to view shifts and actions.
            </p>
          )}
        </div>
      </div>

      <AddShiftModal
        isOpen={addShiftModalOpen}
        users={users}
        initialDate={selectedDate}
        onClose={() => setAddShiftModalOpen(false)}
        onSuccess={() => {}}
      />
      <EditShiftModal
        isOpen={editShiftModalOpen}
        users={users}
        initialDate={selectedDate}
        initialShifts={
          selectedDate ? shifts.filter((s) => s.date === selectedDate) : []
        }
        onClose={() => setEditShiftModalOpen(false)}
        onSuccess={() => {}}
      />
      <DeleteShiftModal
        isOpen={deleteShiftModalOpen}
        users={users}
        initialDate={selectedDate}
        onClose={() => setDeleteShiftModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
