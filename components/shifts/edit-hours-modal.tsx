"use client";

import { formatHours } from "@/lib/utils";
import {
  getHoursWorked,
  updateShiftActualHours,
  clearShiftActualHours,
} from "@/lib/shifts";

interface EditHoursModalProps {
  shiftId: string | null;
  shift: Shift | null;
  hoursInput: string;
  onHoursInputChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EditHoursModal({
  shiftId,
  shift,
  hoursInput,
  onHoursInputChange,
  onSave,
  onClose,
}: EditHoursModalProps) {
  if (!shiftId) return null;

  const handleSave = async () => {
    if (!shift) return;
    const val = parseFloat(hoursInput);
    if (!Number.isFinite(val) || val < 0) return;
    await updateShiftActualHours(shiftId, val);
    onSave();
  };

  const handleReset = async () => {
    if (!shift) return;
    await clearShiftActualHours(shiftId);
    onSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {shift ? (
          <>
            <h3 className="text-sm font-semibold text-zinc-900">
              Edit hours —{" "}
              {new Date(shift.date + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {shift.userName} · Computed: {formatHours(getHoursWorked(shift))}
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
                value={hoursInput}
                onChange={(e) => onHoursInputChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Save
              </button>
              <button
                type="button"
                disabled={shift.actualHours === undefined}
                onClick={handleReset}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset to calculated
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-600">Shift no longer in view.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
