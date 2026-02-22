"use client";

import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { clientDb } from "@/lib/firebaseConfig";
import { useShiftsStore } from "@/stores/shifts-store";

export function useShifts() {
  const { shifts, setShifts } = useShiftsStore();

  useEffect(() => {
    if (!clientDb) return;

    const shiftsRef = collection(clientDb, "shifts");
    const unsubscribe = onSnapshot(
      shiftsRef,
      (snapshot) => {
        const list: Shift[] = snapshot.docs.map((d) => {
          const data = d.data();
          const breakData = data.break;
          const breakRange: TimeRange | null =
            breakData?.start && breakData?.end
              ? {
                  start: breakData.start.toDate(),
                  end: breakData.end.toDate(),
                }
              : null;
          return {
            id: d.id,
            userId: data.userId as string,
            userName: data.userName as string,
            shift: {
              start: data.shift?.start?.toDate?.() ?? new Date(),
              end: data.shift?.end?.toDate?.() ?? new Date(),
            },
            break: breakRange,
            date: data.date as string,
            clockInTime: data.clockInTime?.toDate?.() ?? null,
            actualHours: data.actualHours as number | undefined,
          };
        });
        setShifts(list);
      },
      (error) => console.error("Error fetching shifts:", error)
    );
    return () => unsubscribe();
  }, [setShifts]);

  return shifts;
}
