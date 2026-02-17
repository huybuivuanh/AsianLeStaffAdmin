"use client";

import { useState, useEffect, type SubmitEvent } from "react";
import { createShift, createShiftsBatch } from "@/lib/shifts";
import { toDateKey } from "@/lib/utils";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

function parseLocalDate(dateStr: string): Date {
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, day);
}

interface AddShiftModalProps {
  isOpen: boolean;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddShiftModal({
  isOpen,
  users,
  onClose,
  onSuccess,
}: AddShiftModalProps) {
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [startDate, setStartDate] = useState(() => toDateKey(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return toDateKey(d);
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setUserId(users[0]?.id ?? "");
      setDate(toDateKey(new Date()));
      setStartDate(toDateKey(new Date()));
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setEndDate(toDateKey(nextMonth));
      setError("");
    }
  }, [isOpen, users]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) {
      setError("Select a staff member");
      return;
    }
    const user = users.find((u) => u.id === userId);
    if (!user) {
      setError("Invalid staff selection");
      return;
    }

    setError("");
    setSaving(true);

    try {
      if (mode === "single") {
        const shiftStarts = new Date(`${date}T${startTime}:00`);
        const shiftEnds = new Date(`${date}T${endTime}:00`);
        await createShift(user.id, user.name, shiftStarts, shiftEnds, date);
      } else {
        if (selectedDays.length === 0) {
          setError("Select at least one day of the week");
          setSaving(false);
          return;
        }
        const start = parseLocalDate(startDate);
        const end = parseLocalDate(endDate);
        if (end < start) {
          setError("End date must be after start date");
          setSaving(false);
          return;
        }
        const shifts: Array<{
          userId: string;
          userName: string;
          shiftStarts: Date;
          shiftEnds: Date;
          date: string;
        }> = [];
        const d = new Date(start);
        while (d <= end) {
          const dayOfWeek = d.getDay();
          const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
          if (selectedDays.includes(dayNum)) {
            const dateStr = toDateKey(d);
            shifts.push({
              userId: user.id,
              userName: user.name,
              shiftStarts: new Date(`${dateStr}T${startTime}:00`),
              shiftEnds: new Date(`${dateStr}T${endTime}:00`),
              date: dateStr,
            });
          }
          d.setDate(d.getDate() + 1);
        }
        if (shifts.length === 0) {
          setError("No matching weekdays in date range");
          setSaving(false);
          return;
        }
        await createShiftsBatch(shifts);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create shifts");
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
        <h2 className="text-lg font-semibold text-zinc-900">Add shift</h2>

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
                checked={mode === "recurring"}
                onChange={() => setMode("recurring")}
                className="text-zinc-900"
              />
              <span className="text-sm text-zinc-700">Recurring</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
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
              <label className="block text-sm font-medium text-zinc-700">
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
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
              {saving ? "Creating..." : "Add shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
