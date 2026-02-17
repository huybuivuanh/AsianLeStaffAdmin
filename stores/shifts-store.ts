import { create } from "zustand";

interface ShiftsState {
  shifts: Shift[];
  setShifts: (shifts: Shift[]) => void;
}

export const useShiftsStore = create<ShiftsState>((set) => ({
  shifts: [],
  setShifts: (shifts) => set({ shifts }),
}));
