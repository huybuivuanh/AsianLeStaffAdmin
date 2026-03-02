"use client";

import { useState, useEffect, type SubmitEvent } from "react";
import { deleteShifts } from "@/lib/shifts";
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

interface DeleteShiftModalProps {
  isOpen: boolean;
  users: User[];
  initialDate?: string | null;
  /** When set, use this staff and hide the staff selector (e.g. from staff schedule). */
  selectedUserId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteShiftModal({
  isOpen,
  users,
  initialDate = null,
  selectedUserId: selectedUserIdProp = null,
  onClose,
  onSuccess,
}: DeleteShiftModalProps) {
  const [mode, setMode] = useState<"single" | "range">("single");
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [startDate, setStartDate] = useState(() => toDateKey(new Date()));
  const [endDate, setEndDate] = useState(() => toDateKey(new Date()));
  const [selectedDays, setSelectedDays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setUserId(
        selectedUserIdProp && users.some((u) => u.id === selectedUserIdProp)
          ? selectedUserIdProp
          : (users[0]?.id ?? ""),
      );
      const defaultDate = initialDate ?? toDateKey(new Date());
      setDate(defaultDate);
      setStartDate(defaultDate);
      setEndDate(defaultDate);
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setError("");
    }
  }, [isOpen, users, initialDate, selectedUserIdProp]);

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
    setError("");
    setDeleting(true);

    try {
      const start = mode === "single" ? date : startDate;
      const end = mode === "single" ? date : endDate;
      if (end < start) {
        setError("End date must be on or after start date");
        setDeleting(false);
        return;
      }
      if (mode === "range" && selectedDays.length === 0) {
        setError("Select at least one day of the week");
        setDeleting(false);
        return;
      }
      const daysFilter =
        mode === "range" && selectedDays.length > 0 ? selectedDays : undefined;
      if (!userId) {
        setError("Please select a staff member");
        setDeleting(false);
        return;
      }
      const count = await deleteShifts(start, end, userId, daysFilter);
      onSuccess();
      onClose();
      if (count === 0) {
        alert("No shifts found in the selected range.");
      } else {
        alert(`Deleted ${count} shift(s).`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete shifts");
    } finally {
      setDeleting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900">Delete shifts</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Remove shifts by date. This cannot be undone.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {selectedUserIdProp == null ? (
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
          ) : (
            <div>
              <p className="mt-1 text-zinc-900">
                {users.find((u) => u.id === userId)?.name ?? "—"}
              </p>
            </div>
          )}

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
          )}

          {mode === "range" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Days of week
              </label>
              <p className="mt-1 text-xs text-zinc-500">
                Only delete shifts on selected days
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
          )}

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
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete shifts"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
