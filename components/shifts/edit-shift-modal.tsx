"use client";

import { useState, useEffect, type FormEvent } from "react";
import { updateShiftsInRange } from "@/lib/shifts";
import { toDateKey } from "@/lib/utils";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

interface EditShiftModalProps {
  isOpen: boolean;
  users: User[];
  initialDate?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditShiftModal({
  isOpen,
  users,
  initialDate = null,
  onClose,
  onSuccess,
}: EditShiftModalProps) {
  const [mode, setMode] = useState<"single" | "range">("single");
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [startDate, setStartDate] = useState(() => toDateKey(new Date()));
  const [endDate, setEndDate] = useState(() => toDateKey(new Date()));
  const [selectedDays, setSelectedDays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [actualHoursOverride, setActualHoursOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setUserId(users[0]?.id ?? "");
      const defaultDate = initialDate ?? toDateKey(new Date());
      setDate(defaultDate);
      setStartDate(defaultDate);
      setEndDate(defaultDate);
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setStartTime("08:00");
      setEndTime("16:00");
      setActualHoursOverride("");
      setError("");
    }
  }, [isOpen, users, initialDate]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const start = mode === "single" ? date : startDate;
      const end = mode === "single" ? date : endDate;
      if (end < start) {
        setError("End date must be on or after start date");
        setSaving(false);
        return;
      }
      if (!userId) {
        setError("Please select a staff member");
        setSaving(false);
        return;
      }
      if (mode === "range" && selectedDays.length === 0) {
        setError("Select at least one day of the week");
        setSaving(false);
        return;
      }
      const shiftStarts = new Date(`${start}T${startTime}:00`);
      const shiftEnds = new Date(`${start}T${endTime}:00`);
      if (shiftEnds <= shiftStarts) {
        setError("End time must be after start time");
        setSaving(false);
        return;
      }
      const daysFilter =
        mode === "range" && selectedDays.length > 0 ? selectedDays : undefined;
      const actualHours =
        actualHoursOverride !== ""
          ? parseFloat(actualHoursOverride)
          : undefined;
      if (
        actualHours !== undefined &&
        (Number.isNaN(actualHours) || actualHours < 0)
      ) {
        setError("Actual hours must be a non-negative number");
        setSaving(false);
        return;
      }
      const count = await updateShiftsInRange(
        start,
        end,
        shiftStarts,
        shiftEnds,
        userId,
        daysFilter,
        actualHours
      );
      onSuccess();
      onClose();
      if (count === 0) {
        alert("No shifts found in the selected range.");
      } else {
        alert(`Updated ${count} shift(s).`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update shifts");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900">Edit shifts</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Update shift times for matching shifts.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Staff
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {users.length === 0 ? (
                <option value="" disabled>No staff</option>
              ) : null}
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "single"}
                onChange={() => setMode("single")}
                className="text-zinc-900"
              />
              <span className="text-sm text-zinc-700">Single day</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "range"}
                onChange={() => setMode("range")}
                className="text-zinc-900"
              />
              <span className="text-sm text-zinc-700">Date range</span>
            </label>
          </div>

          {mode === "single" ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
                    required
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Days of week
                </label>
                <p className="mt-1 text-xs text-zinc-500">
                  Only edit shifts on selected days
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEKDAYS.map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(value)}
                        onChange={() => toggleDay(value)}
                        className="rounded text-zinc-900"
                      />
                      <span className="text-sm text-zinc-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              New shift times
            </label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500">End time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Actual hours (optional)
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              Override recorded hours for matching shifts (e.g. 8 or 8.5). Leave
              empty to keep existing values.
            </p>
            <input
              type="number"
              min="0"
              step="0.25"
              placeholder="Leave empty"
              value={actualHoursOverride}
              onChange={(e) => setActualHoursOverride(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update shifts"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
