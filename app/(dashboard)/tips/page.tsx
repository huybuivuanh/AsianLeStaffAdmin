"use client";

import { useState, useEffect } from "react";
import { toDateKey } from "@/lib/utils";
import { getTipsForDate } from "@/lib/tips";
import { AddTipsModal } from "@/components/tips/add-tips-modal";

export default function TipsPage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateKey(new Date()),
  );
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

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Tips</h1>
        <p className="mt-2 text-zinc-600">
          View and manage daily tips (AM/PM, cash/card).
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setAddTipsModalOpen(true)}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Add Tips
        </button>
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
