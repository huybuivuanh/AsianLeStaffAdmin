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
          return {
            id: d.id,
            userId: data.userId as string,
            userName: data.userName as string,
            shiftStarts: data.shiftStarts?.toDate?.() ?? new Date(),
            shiftEnds: data.shiftEnds?.toDate?.() ?? new Date(),
            date: data.date as string,
            clockInTime: data.clockInTime?.toDate?.() ?? null,
            actualHours: data.actualHours as number | undefined,
            status: data.status as Shift["status"],
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
