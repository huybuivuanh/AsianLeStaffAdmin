"use client";

import { formatTimeShort, formatHours } from "@/lib/utils";
import { getHoursWorked } from "@/lib/shifts";

interface HoursCalendarDayCellProps {
  date: Date;
  dateKey: string;
  shift: Shift | null;
  isSelected: boolean;
  isToday: boolean;
  todayKey: string;
  onSelect: (dateKey: string, shift: Shift | null) => void;
}

export function HoursCalendarDayCell({
  date,
  dateKey,
  shift,
  isSelected,
  isToday,
  todayKey,
  onSelect,
}: HoursCalendarDayCellProps) {
  const isPast = dateKey < todayKey;
  const clockedInLate =
    shift?.clockInTime &&
    shift.clockInTime.getTime() >
      shift.shift.start.getTime() + 5 * 60 * 1000;
  const notClockedIn = shift && !shift.clockInTime && isPast;
  const shiftTime = shift
    ? shift.noShift
      ? "No Shift"
      : `${formatTimeShort(shift.shift.start)}–${formatTimeShort(shift.shift.end)}`
    : null;
  const clockInText = shift?.clockInTime
    ? formatTimeShort(shift.clockInTime)
    : "";
  const statusText = shift
    ? shift.noShift
      ? "No Shift"
      : notClockedIn
        ? "Not clocked in"
        : shiftTime
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(dateKey, shift)}
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
      <span className="text-lg font-semibold">{date.getDate()}</span>
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
              {statusText}
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
          {!shift.noShift &&
            (notClockedIn ? (
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
            ))}
          {!shift.noShift && shift.clockInTime && (
            <span
              className={`truncate text-sm font-medium ${
                isSelected ? "text-blue-200" : "text-zinc-700"
              }`}
            >
              {formatHours(getHoursWorked(shift))} hrs
            </span>
          )}
        </div>
      )}
    </button>
  );
}
