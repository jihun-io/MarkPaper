// src/store/styleStore.js
import { create } from "zustand";

export const useStyleStore = create((set) => ({
  paperSize: "A4",
  currentFont: "Pretendard",
  currentFontSize: 12,
  setPaperSize: (size) => set({ paperSize: size }),
  setFont: (font) => set({ currentFont: font }),
  setFontSize: (size) => set({ currentFontSize: size }),
}));
