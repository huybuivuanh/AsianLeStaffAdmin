import { create } from "zustand";

interface TipsState {
  tips: Tips[];
  setTips: (tips: Tips[]) => void;
}

export const useTipsStore = create<TipsState>((set) => ({
  tips: [],
  setTips: (tips) => set({ tips }),
}));
