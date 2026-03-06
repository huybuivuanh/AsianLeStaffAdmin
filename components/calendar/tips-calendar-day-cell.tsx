"use client";

interface TipsCalendarDayCellProps {
  date: Date;
  dateKey: string;
  tips: Tips | null;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}

export function TipsCalendarDayCell({
  date,
  tips,
  isSelected,
  isToday,
  onClick,
}: TipsCalendarDayCellProps) {
  const total = tips?.total ?? 0;
  const hasTips = total > 0;
  const amCash = tips?.morningCash ?? 0;
  const amCard = tips?.morningCard ?? 0;
  const pmCash = tips?.afternoonCash ?? 0;
  const pmCard = tips?.afternoonCard ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex aspect-[4/3] min-w-0 flex-col items-start justify-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-all ${
        isSelected
          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1"
          : isToday
            ? "bg-amber-50 text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
            : "bg-white text-zinc-800 hover:bg-zinc-50"
      }`}
    >
      <span className="text-lg font-semibold">{date.getDate()}</span>
      <div className="flex min-w-0 max-w-full flex-col gap-0.5">
        {hasTips ? (
          <>
            <span
              className={`truncate text-xs leading-tight ${
                isSelected ? "text-blue-200" : "text-zinc-600"
              }`}
            >
              AM cash ${amCash.toFixed(2)}
            </span>
            <span
              className={`truncate text-xs leading-tight ${
                isSelected ? "text-blue-200" : "text-zinc-600"
              }`}
            >
              AM card ${amCard.toFixed(2)}
            </span>
            <span
              className={`truncate text-xs leading-tight ${
                isSelected ? "text-blue-200" : "text-zinc-600"
              }`}
            >
              PM cash ${pmCash.toFixed(2)}
            </span>
            <span
              className={`truncate text-xs leading-tight ${
                isSelected ? "text-blue-200" : "text-zinc-600"
              }`}
            >
              PM card ${pmCard.toFixed(2)}
            </span>
            <span
              className={`truncate text-sm font-medium leading-tight ${
                isSelected ? "text-blue-100" : "text-zinc-800"
              }`}
            >
              Total ${total.toFixed(2)}
            </span>
          </>
        ) : (
          <span
            className={`truncate text-xs leading-tight ${
              isSelected ? "text-blue-200" : "text-zinc-400"
            }`}
          >
            No tips
          </span>
        )}
      </div>
    </button>
  );
}
