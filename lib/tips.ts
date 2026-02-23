import { doc, getDoc, setDoc } from "firebase/firestore";
import { clientDb } from "./firebaseConfig";

export async function getTipsForDate(date: string): Promise<Tips | null> {
  if (!clientDb) return null;
  const ref = doc(clientDb, "tips", date);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    date: data.date as string,
    morningCash: (data.morningCash as number) ?? 0,
    morningCard: (data.morningCard as number) ?? 0,
    afternoonCash: (data.afternoonCash as number) ?? 0,
    afternoonCard: (data.afternoonCard as number) ?? 0,
    total: (data.total as number) ?? 0,
  };
}

export async function saveTips(
  date: string,
  data: {
    morningCash: number;
    morningCard: number;
    afternoonCash: number;
    afternoonCard: number;
  },
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const total =
    data.morningCash +
    data.morningCard +
    data.afternoonCash +
    data.afternoonCard;
  const ref = doc(clientDb, "tips", date);
  await setDoc(ref, {
    date,
    morningCash: data.morningCash,
    morningCard: data.morningCard,
    afternoonCash: data.afternoonCash,
    afternoonCard: data.afternoonCard,
    total,
  });
}
