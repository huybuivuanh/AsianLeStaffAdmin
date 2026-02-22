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

export function getHoursWorked(shift: Shift): number {
  if (shift.actualHours !== undefined) return shift.actualHours;
  if (!shift.clockInTime) return 0;
  const start = shift.clockInTime.getTime();
  const end = shift.shift.end.getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

export async function createShiftsBatch(
  shifts: Array<{
    userId: string;
    userName: string;
    shift: TimeRange;
    date: string;
  }>,
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const firestoreBatch = writeBatch(clientDb);
  const shiftsRef = collection(clientDb, "shifts");
  for (const s of shifts) {
    const ref = doc(shiftsRef);
    firestoreBatch.set(ref, {
      userId: s.userId,
      userName: s.userName,
      shift: {
        start: toFirestoreTimestamp(s.shift.start),
        end: toFirestoreTimestamp(s.shift.end),
      },
      date: s.date,
    });
  }
  await firestoreBatch.commit();
}

export async function createShift(
  userId: string,
  userName: string,
  shift: TimeRange,
  date: string,
): Promise<string> {
  if (!clientDb) throw new Error("Database not configured");
  const ref = await addDoc(collection(clientDb, "shifts"), {
    userId,
    userName,
    shift: {
      start: toFirestoreTimestamp(shift.start),
      end: toFirestoreTimestamp(shift.end),
    },
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
  actualHours: number,
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

/** Returns the set of dates that already have a shift for this user in the range. */
export async function getExistingShiftDatesForUser(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Set<string>> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftsRef = collection(clientDb, "shifts");
  const q = query(
    shiftsRef,
    where("userId", "==", userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snapshot = await getDocs(q);
  const dates = new Set<string>();
  for (const d of snapshot.docs) {
    dates.add(d.data().date as string);
  }
  return dates;
}

export async function deleteShifts(
  startDate: string,
  endDate: string,
  userId?: string,
  selectedDays?: number[],
): Promise<number> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftsRef = collection(clientDb, "shifts");
  let q = query(
    shiftsRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
  );
  if (userId) {
    q = query(q, where("userId", "==", userId));
  }
  let snapshot;
  try {
    snapshot = await getDocs(q);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to query shifts: ${msg}`);
  }
  const docs = snapshot?.docs ?? [];
  let docsToDelete = docs;
  if (selectedDays && selectedDays.length > 0) {
    docsToDelete = docsToDelete.filter((d) => {
      const dateStr = d.data().date as string;
      const dayNum = getDayOfWeek(dateStr);
      return selectedDays.includes(dayNum);
    });
  }
  if (docsToDelete.length === 0) return 0;
  const batchSize = 500;
  let deleted = 0;
  for (let i = 0; i < docsToDelete.length; i += batchSize) {
    const chunk = docsToDelete.slice(i, i + batchSize);
    const batch = writeBatch(clientDb);
    for (const d of chunk) {
      batch.delete(d.ref);
    }
    try {
      await batch.commit();
      deleted += chunk.length;
    } catch {
      for (const d of chunk) {
        try {
          await deleteDoc(d.ref);
          deleted++;
        } catch {
          // Doc may have been deleted - skip
        }
      }
    }
  }
  return deleted;
}

export async function updateShiftsInRange(
  startDate: string,
  endDate: string,
  shiftStarts: Date,
  shiftEnds: Date,
  userId?: string,
  selectedDays?: number[],
  actualHours?: number,
): Promise<number> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftsRef = collection(clientDb, "shifts");
  let q = query(
    shiftsRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
  );
  if (userId) {
    q = query(q, where("userId", "==", userId));
  }
  let snapshot;
  try {
    snapshot = await getDocs(q);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to query shifts: ${msg}`);
  }
  const docs = snapshot?.docs ?? [];
  let docsToUpdate = docs;
  if (selectedDays && selectedDays.length > 0) {
    docsToUpdate = docsToUpdate.filter((d) => {
      const dateStr = d.data().date as string;
      return selectedDays.includes(getDayOfWeek(dateStr));
    });
  }
  if (docsToUpdate.length === 0) return 0;
  let updated = 0;
  for (const d of docsToUpdate) {
    const dateStr = d.data().date as string;
    const [y, m, day] = dateStr.split("-").map(Number);
    const baseDate = new Date(y, m - 1, day);
    const startHours = shiftStarts.getHours();
    const startMins = shiftStarts.getMinutes();
    const endHours = shiftEnds.getHours();
    const endMins = shiftEnds.getMinutes();
    const newStarts = new Date(baseDate);
    newStarts.setHours(startHours, startMins, 0, 0);
    const newEnds = new Date(baseDate);
    newEnds.setHours(endHours, endMins, 0, 0);
    const shiftRef = doc(clientDb, "shifts", d.id);
    const updates: Record<string, unknown> = {
      shift: {
        start: toFirestoreTimestamp(newStarts),
        end: toFirestoreTimestamp(newEnds),
      },
      updatedAt: serverTimestamp(),
    };
    if (actualHours !== undefined) updates.actualHours = actualHours;
    try {
      await updateDoc(shiftRef, updates);
      updated++;
    } catch {
      // Doc may have been deleted - skip
    }
  }
  return updated;
}

export async function updateShift(
  shiftId: string,
  data: {
    shift?: TimeRange;
    actualHours?: number;
  },
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const shiftRef = doc(clientDb, "shifts", shiftId);
  const updates: Record<string, unknown> = {};
  if (data.shift) {
    updates.shift = {
      start: toFirestoreTimestamp(data.shift.start),
      end: toFirestoreTimestamp(data.shift.end),
    };
  }
  if (data.actualHours !== undefined) updates.actualHours = data.actualHours;
  await updateDoc(shiftRef, updates);
}
