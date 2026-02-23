"use client";

import { useState, useEffect, type FormEvent } from "react";
import { getTipsForDate, saveTips } from "@/lib/tips";

interface AddTipsModalProps {
  isOpen: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTipsModal({
  isOpen,
  selectedDate,
  onClose,
  onSuccess,
}: AddTipsModalProps) {
  const [morningCash, setMorningCash] = useState(0);
  const [morningCard, setMorningCard] = useState(0);
  const [afternoonCash, setAfternoonCash] = useState(0);
  const [afternoonCard, setAfternoonCard] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && selectedDate) {
      setError("");
      setLoading(true);
      getTipsForDate(selectedDate)
        .then((tips) => {
          if (tips) {
            setMorningCash(tips.morningCash);
            setMorningCard(tips.morningCard);
            setAfternoonCash(tips.afternoonCash);
            setAfternoonCard(tips.afternoonCard);
          } else {
            setMorningCash(0);
            setMorningCard(0);
            setAfternoonCash(0);
            setAfternoonCard(0);
          }
        })
        .catch(() => setError("Failed to load tips"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedDate) return;
    setError("");
    setSaving(true);
    try {
      await saveTips(selectedDate, {
        morningCash,
        morningCard,
        afternoonCash,
        afternoonCard,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tips");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const dateLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900">Add Tips</h2>
        {selectedDate && (
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Morning Cash
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={morningCash || ""}
                    onChange={(e) =>
                      setMorningCash(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Morning Card
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={morningCard || ""}
                    onChange={(e) =>
                      setMorningCard(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Afternoon Cash
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={afternoonCash || ""}
                    onChange={(e) =>
                      setAfternoonCash(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Afternoon Card
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={afternoonCard || ""}
                    onChange={(e) =>
                      setAfternoonCard(parseFloat(e.target.value) || 0)
                    }
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
                  disabled={saving || !selectedDate}
                  className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
