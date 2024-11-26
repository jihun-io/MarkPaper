// src/store/fileStore.js
import { create } from "zustand";

export const useFileStore = create((set) => ({
  isOpened: false,
  fileName: "새 문서",
  filePath: "",
  isModified: false,
  setIsOpened: (isOpened) => set({ isOpened }),
  setFileName: (fileName) => set({ fileName }),
  setFilePath: (filePath) => set({ filePath }),
  setIsModified: (isModified) => set({ isModified }),
  resetFile: () =>
    set({
      isOpened: false,
      fileName: "새 문서",
      filePath: "",
      isModified: false,
    }),
}));
