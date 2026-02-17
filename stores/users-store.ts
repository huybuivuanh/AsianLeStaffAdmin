import { create } from "zustand";

interface UsersState {
  users: User[];
  setUsers: (users: User[]) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
}));
