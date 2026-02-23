import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { clientDb } from "./firebaseConfig";

export async function addUser(
  name: string,
  pin: string,
  server: boolean,
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  await addDoc(collection(clientDb, "users"), {
    name: name.trim(),
    pin: pin.trim(),
    server,
    createdAt: serverTimestamp(),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const userRef = doc(clientDb, "users", userId);
  await deleteDoc(userRef);
}

export async function updateUser(
  userId: string,
  name: string,
  pin: string,
  server: boolean,
): Promise<void> {
  if (!clientDb) throw new Error("Database not configured");
  const userRef = doc(clientDb, "users", userId);
  await updateDoc(userRef, {
    name: name.trim(),
    pin: pin.trim(),
    server,
    updatedAt: serverTimestamp(),
  });
}
