"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/use-users";
import { useShifts } from "@/hooks/use-shifts";
import { AddShiftModal } from "@/components/shifts/add-shift-modal";
import { DeleteShiftModal } from "@/components/shifts/delete-shift-modal";
import { EditShiftModal } from "@/components/shifts/edit-shift-modal";
import { MonthCalendarNav } from "@/components/calendar/month-calendar-nav";
import { ScheduleCalendarDayCell } from "@/components/calendar/schedule-calendar-day-cell";
import { ScheduleDayDetailPanel } from "@/components/calendar/schedule-day-detail-panel";
import { toDateKey, getDaysInMonth } from "@/lib/utils";
import { getHoursWorked } from "@/lib/shifts";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StaffSchedulePage() {
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
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
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
                const dayShifts = shiftsByDate[key] ?? [];
                const shift = dayShifts[0] ?? null;
                return (
                  <ScheduleCalendarDayCell
                    key={key}
                    date={d}
                    dateKey={key}
                    shift={shift}
                    isSelected={selectedDate === key}
                    isToday={key === todayKey}
                    todayKey={todayKey}
                    onSelect={setSelectedDate}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <ScheduleDayDetailPanel
          selectedDate={selectedDate}
          shifts={selectedDayShifts}
          totalHours={selectedDayHours}
          todayKey={todayKey}
          onAddShifts={() => setAddShiftModalOpen(true)}
          onEditShifts={() => setEditShiftModalOpen(true)}
          onDeleteShifts={() => setDeleteShiftModalOpen(true)}
        />
      </div>

      <AddShiftModal
        isOpen={addShiftModalOpen}
        users={users}
        initialDate={selectedDate}
        selectedUserId={effectiveUserId}
        onClose={() => setAddShiftModalOpen(false)}
        onSuccess={() => {}}
      />
      <EditShiftModal
        isOpen={editShiftModalOpen}
        users={users}
        initialDate={selectedDate}
        initialShifts={
          selectedDate && effectiveUserId
            ? shifts.filter(
                (s) => s.date === selectedDate && s.userId === effectiveUserId,
              )
            : []
        }
        selectedUserId={effectiveUserId}
        onClose={() => setEditShiftModalOpen(false)}
        onSuccess={() => {}}
      />
      <DeleteShiftModal
        isOpen={deleteShiftModalOpen}
        users={users}
        initialDate={selectedDate}
        selectedUserId={effectiveUserId}
        onClose={() => setDeleteShiftModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
