"use client";

import { formatTimeShort, formatHours } from "@/lib/utils";
import { getHoursWorked } from "@/lib/shifts";

interface ScheduleDayDetailPanelProps {
  selectedDate: string | null;
  shifts: Shift[];
  totalHours: number;
  todayKey: string;
  onAddShifts: () => void;
  onEditShifts: () => void;
  onDeleteShifts: () => void;
}

export function ScheduleDayDetailPanel({
  selectedDate,
  shifts,
  totalHours,
  todayKey,
  onAddShifts,
  onEditShifts,
  onDeleteShifts,
}: ScheduleDayDetailPanelProps) {
  const hasShifts = shifts.length > 0;

  return (
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
            onClick={onAddShifts}
            disabled={hasShifts}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add shifts
          </button>
          <button
            type="button"
            onClick={onEditShifts}
            disabled={!hasShifts}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit shifts
          </button>
          <button
            type="button"
            onClick={onDeleteShifts}
            disabled={!hasShifts}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete shifts
          </button>
        </div>
      </div>
      {selectedDate ? (
        hasShifts ? (
          <div className="mt-4 space-y-2">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="rounded border border-zinc-100 bg-zinc-50 p-3 text-sm"
              >
                <div className="font-medium text-zinc-900">{shift.userName}</div>
                <div className="text-zinc-600">
                  {shift.noShift
                    ? "No Shift"
                    : `${formatTimeShort(shift.shift.start)} – ${formatTimeShort(shift.shift.end)}`}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  Br:{" "}
                  {shift.break
                    ? `${formatTimeShort(shift.break.start)} – ${formatTimeShort(shift.break.end)}`
                    : "None"}
                </div>
                {shift.clockInTime ? (
                  <div className="mt-1 text-xs text-zinc-500">
                    Clocked in: {formatTimeShort(shift.clockInTime)} •{" "}
                    {formatHours(getHoursWorked(shift))}
                  </div>
                ) : selectedDate < todayKey ? (
                  <div className="mt-1 text-xs text-amber-600">
                    Not clocked in
                  </div>
                ) : null}
              </div>
            ))}
            <div className="border-t border-zinc-200 pt-3 font-medium text-zinc-900">
              Total: {formatHours(totalHours)}
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
  );
}
