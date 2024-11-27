import { create } from "zustand";
import JSZip from "jszip";

const fileUtils = {
  async createMPFile(content, images) {
    const zip = new JSZip();

    // 메인 콘텐츠 저장
    zip.file("content.md", content);

    // 이미지 저장
    if (images.length > 0) {
      const imageFolder = zip.folder("images");
      for (const { filename, file } of images) {
        // File 객체를 ArrayBuffer로 변환하여 저장
        const buffer = await file.arrayBuffer();
        imageFolder.file(filename, buffer);
      }
    }

    // 메타데이터 저장
    const metadata = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      images: images.map(({ filename }) => ({
        name: filename,
      })),
    };
    zip.file("metadata.json", JSON.stringify(metadata));

    // Uint8Array로 생성
    const result = await zip.generateAsync({ type: "uint8array" });
    return result;
  },

  async loadMPFile(buffer) {
    const zip = await JSZip.loadAsync(buffer);
    const content = await zip.file("content.md").async("string");
    const metadata = JSON.parse(
      await zip.file("metadata.json").async("string")
    );

    const images = [];
    if (metadata.images.length > 0) {
      for (const imageInfo of metadata.images) {
        const imageFile = zip.file(`images/${imageInfo.name}`);
        if (imageFile) {
          const arrayBuffer = await imageFile.async("arraybuffer");
          const blob = new Blob([arrayBuffer]);
          const file = new File([blob], imageInfo.name, {
            type: blob.type || "image/png", // 기본값 설정
          });
          images.push({
            filename: imageInfo.name,
            file,
          });
        }
      }
    }

    return { content, images, metadata };
  },
};

export const useFileStore = create((set, get) => ({
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

  prepareFileData: async (markdown, images) => {
    const filePath = get().filePath;
    if (filePath.toLowerCase().endsWith(".mp")) {
      return await fileUtils.createMPFile(markdown, images);
    }
    return markdown;
  },

  loadFileData: async (buffer, filePath) => {
    if (filePath.toLowerCase().endsWith(".mp")) {
      return await fileUtils.loadMPFile(buffer);
    }
    return {
      content: new TextDecoder().decode(buffer),
      images: [],
      metadata: null,
    };
  },
}));
