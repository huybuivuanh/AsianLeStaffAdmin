"use client";

import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { clientDb } from "@/lib/firebaseConfig";
import { useUsersStore } from "@/stores/users-store";
import { sortByAlphabet } from "@/lib/utils";

export function useUsers() {
  const { users, setUsers } = useUsersStore();

  useEffect(() => {
    if (!clientDb) return;

    const usersRef = collection(clientDb, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersList: User[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            pin: data.pin as string,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.(),
          };
        });
        setUsers(sortByAlphabet(usersList, (u) => u.name));
      },
      (error) => {
        console.error("Error fetching users:", error);
      },
    );

    return () => unsubscribe();
  }, [setUsers]);

  return users;
}
