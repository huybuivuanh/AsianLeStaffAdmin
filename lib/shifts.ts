import {
  doc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { clientDb } from "./firebaseConfig";

function toFirestoreTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export async function createShiftsBatch(
  shifts: Array<{
    userId: string;
    userName: string;
    shiftStarts: Date;
    shiftEnds: Date;
    date: string;
  }>
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const firestoreBatch = writeBatch(clientDb);
  const shiftsRef = collection(clientDb, "shifts");
  for (const s of shifts) {
    const ref = doc(shiftsRef);
    firestoreBatch.set(ref, {
      userId: s.userId,
      userName: s.userName,
      shiftStarts: toFirestoreTimestamp(s.shiftStarts),
      shiftEnds: toFirestoreTimestamp(s.shiftEnds),
      date: s.date,
    });
  }
  await firestoreBatch.commit();
}

export async function createShift(
  userId: string,
  userName: string,
  shiftStarts: Date,
  shiftEnds: Date,
  date: string
): Promise<string> {
  if (!clientDb) throw new Error("Database not configured");
  const ref = await addDoc(collection(clientDb, "shifts"), {
    userId,
    userName,
    shiftStarts: toFirestoreTimestamp(shiftStarts),
    shiftEnds: toFirestoreTimestamp(shiftEnds),
    date,
  });
  return ref.id;
}

export async function recordClockIn(shiftId: string): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftRef = doc(clientDb, "shifts", shiftId);
  await updateDoc(shiftRef, {
    clockInTime: serverTimestamp(),
  });
}

export async function updateShiftActualHours(
  shiftId: string,
  actualHours: number
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftRef = doc(clientDb, "shifts", shiftId);
  await updateDoc(shiftRef, { actualHours });
}

export async function updateShift(
  shiftId: string,
  data: {
    shiftStarts?: Date;
    shiftEnds?: Date;
    actualHours?: number;
    status?: "scheduled" | "completed" | "cancelled";
  }
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftRef = doc(clientDb, "shifts", shiftId);
  const updates: Record<string, unknown> = {};
  if (data.shiftStarts) updates.shiftStarts = toFirestoreTimestamp(data.shiftStarts);
  if (data.shiftEnds) updates.shiftEnds = toFirestoreTimestamp(data.shiftEnds);
  if (data.actualHours !== undefined) updates.actualHours = data.actualHours;
  if (data.status) updates.status = data.status;
  await updateDoc(shiftRef, updates);
}
