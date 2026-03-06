"use client";

interface MonthCalendarNavProps {
  viewDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthCalendarNav({
  viewDate,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarNavProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
      <button
        type="button"
        onClick={onPrevMonth}
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
        onClick={onNextMonth}
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
  );
}
