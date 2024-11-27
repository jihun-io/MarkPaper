import { create } from "zustand";
import JSZip from "jszip";

const fileUtils = {
  // 마크다운에서 실제 참조된 이미지 파일명 추출
  getReferencedImages(markdown) {
    const images = new Set();

    // 마크다운 이미지 패턴
    const mdRegex = /!\[.*?\]\(\$(.+?)\)/g;
    let match;
    while ((match = mdRegex.exec(markdown)) !== null) {
      images.add(match[1]);
    }

    // HTML img 태그 패턴 (간단히)
    const htmlRegex = /src=["']\$([^"']+)["']/g;
    while ((match = htmlRegex.exec(markdown)) !== null) {
      images.add(match[1]);
    }

    return images;
  },

  async createMPFile(content, images) {
    const zip = new JSZip();

    // 메인 콘텐츠 저장
    zip.file("content.md", content);

    // 실제 참조된 이미지만 필터링
    const referencedImages = this.getReferencedImages(content);
    const usedImages = images.filter(({ filename }) =>
      referencedImages.has(filename)
    );

    // 이미지 저장
    if (usedImages.length > 0) {
      const imageFolder = zip.folder("images");
      for (const { filename, file } of usedImages) {
        const buffer = await file.arrayBuffer();
        imageFolder.file(filename, buffer);
      }
    }

    // 메타데이터 저장 (실제 사용된 이미지만 포함)
    const metadata = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      images: usedImages.map(({ filename }) => ({
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
