// src/store/documentStore.js
import { create } from "zustand";
import { convertToHtml } from "../utils/markdown";

export const useDocumentStore = create((set) => ({
  markdown: "",
  html: "",
  setMarkdown: (markdown) => set({ markdown }),
  setHtml: (html) => set({ html }),
  updateDocument: async (markdown) => {
    try {
      set({ markdown });
      const newHtml = await convertToHtml(markdown);
      set({ html: newHtml });
      return true;
    } catch (error) {
      console.error("문서 업데이트 실패:", error);
      return false;
    }
  },
}));
