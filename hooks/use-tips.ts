"use client";

import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { clientDb } from "@/lib/firebaseConfig";
import { useTipsStore } from "@/stores/tips-store";

export function useTips() {
  const { tips, setTips } = useTipsStore();

  useEffect(() => {
    if (!clientDb) return;

    const tipsRef = collection(clientDb, "tips");
    const unsubscribe = onSnapshot(
      tipsRef,
      (snapshot) => {
        const list: Tips[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            date: (data.date as string) ?? d.id,
            morningCash: (data.morningCash as number) ?? 0,
            morningCard: (data.morningCard as number) ?? 0,
            afternoonCash: (data.afternoonCash as number) ?? 0,
            afternoonCard: (data.afternoonCard as number) ?? 0,
            total: (data.total as number) ?? 0,
          };
        });
        setTips(list);
      },
      (error) => console.error("Error fetching tips:", error),
    );
    return () => unsubscribe();
  }, [setTips]);

  return tips;
}
