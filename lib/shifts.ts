import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
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

function getDayOfWeek(dateStr: string): number {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return d.getDay();
}

export async function deleteShifts(
  startDate: string,
  endDate: string,
  userId?: string,
  selectedDays?: number[]
): Promise<number> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftsRef = collection(clientDb, "shifts");
  let q = query(
    shiftsRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  if (userId) {
    q = query(q, where("userId", "==", userId));
  }
  const snapshot = await getDocs(q);
  let docsToDelete = snapshot.docs;
  if (selectedDays && selectedDays.length > 0) {
    docsToDelete = docsToDelete.filter((d) => {
      const dateStr = d.data().date as string;
      const dayNum = getDayOfWeek(dateStr);
      return selectedDays.includes(dayNum);
    });
  }
  const batchSize = 500;
  let deleted = 0;
  for (let i = 0; i < docsToDelete.length; i += batchSize) {
    const batch = writeBatch(clientDb);
    const chunk = docsToDelete.slice(i, i + batchSize);
    for (const d of chunk) {
      batch.delete(d.ref);
      deleted++;
    }
    await batch.commit();
  }
  return deleted;
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
