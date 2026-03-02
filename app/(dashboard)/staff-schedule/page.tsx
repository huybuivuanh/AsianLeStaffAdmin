"use client";

import { useState, useMemo, useEffect } from "react";
import { useUsers } from "@/hooks/use-users";
import { useShifts } from "@/hooks/use-shifts";
import { AddShiftModal } from "@/components/shifts/add-shift-modal";
import { DeleteShiftModal } from "@/components/shifts/delete-shift-modal";
import { EditShiftModal } from "@/components/shifts/edit-shift-modal";
import { AddTipsModal } from "@/components/tips/add-tips-modal";
import { toDateKey, getDaysInMonth, formatHours, formatTimeShort } from "@/lib/utils";
import { getHoursWorked } from "@/lib/shifts";
import { getTipsForDate } from "@/lib/tips";

export default function StaffHoursPage() {
  const users = useUsers();
  const shifts = useShifts();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [deleteShiftModalOpen, setDeleteShiftModalOpen] = useState(false);
  const [editShiftModalOpen, setEditShiftModalOpen] = useState(false);
  const [addTipsModalOpen, setAddTipsModalOpen] = useState(false);
  const [tipsByDate, setTipsByDate] = useState<Record<string, Tips | null>>({});

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    getTipsForDate(selectedDate).then((tips) => {
      if (!cancelled)
        setTipsByDate((prev) => ({ ...prev, [selectedDate]: tips }));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const tipsForSelectedDate = selectedDate
    ? (tipsByDate[selectedDate] ?? null)
    : null;

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
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
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
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setAddTipsModalOpen(true)}
              disabled={!selectedDate}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Tips
            </button>
          </div>
          {selectedDate && (
            <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-zinc-500">Tips:</span>
              <span className="text-zinc-700">
                AM cash ${(tipsForSelectedDate?.morningCash ?? 0).toFixed(2)}
              </span>
              <span className="text-zinc-700">
                AM card ${(tipsForSelectedDate?.morningCard ?? 0).toFixed(2)}
              </span>
              <span className="text-zinc-700">
                PM cash ${(tipsForSelectedDate?.afternoonCash ?? 0).toFixed(2)}
              </span>
              <span className="text-zinc-700">
                PM card ${(tipsForSelectedDate?.afternoonCard ?? 0).toFixed(2)}
              </span>
              <span className="font-semibold text-zinc-900">
                Total ${(tipsForSelectedDate?.total ?? 0).toFixed(2)}
              </span>
            </div>
          )}
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
                      {formatTimeShort(shift.shift.start)} –{" "}
                      {formatTimeShort(shift.shift.end)}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      Br:{" "}
                      {shift.break
                        ? `${formatTimeShort(shift.break.start)} – ${formatTimeShort(shift.break.end)}`
                        : "None"}
                    </div>
                    {shift.clockInTime ? (
                      <div className="mt-1 text-xs text-zinc-500">
                        Clocked in: {formatTimeShort(shift.clockInTime)}{" "}
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
