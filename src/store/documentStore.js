import { create } from "zustand";
import { convertToHtml } from "../utils/markdown";

export const useDocumentStore = create((set, get) => ({
  // 기존 상태
  markdown: "",
  html: "",
  images: new Map(), // Map<filename, { file: File, url: string }>

  // 기존 액션
  setMarkdown: (markdown) => set({ markdown }),
  setHtml: (html) => set({ html }),

  // 수정된 이미지 관련 액션
  addImage: async (file) => {
    const images = get().images;

    // URL 생성 및 이미지 저장 (파일명을 키로 사용)
    const url = URL.createObjectURL(file);
    images.set(file.name, {
      file,
      url,
      name: file.name,
    });

    set({ images: new Map(images) });

    // 에디터에 삽입할 마크다운 텍스트 반환
    return {
      markdownText: `![${file.name}]($${file.name})`,
    };
  },

  removeImage: (filename) => {
    const images = get().images;
    const image = images.get(filename);

    if (image) {
      URL.revokeObjectURL(image.url);
      images.delete(filename);
      set({ images: new Map(images) });
    }
  },

  // 수정된 문서 업데이트
  updateDocument: async (markdown) => {
    try {
      set({ markdown });

      // 이미지 URL을 실제 데이터 URL로 대체하여 HTML 변환
      const images = get().images;
      let processedMarkdown = markdown;

      // $filename 패턴을 실제 이미지 URL로 대체
      for (const [filename, image] of images.entries()) {
        processedMarkdown = processedMarkdown.replace(
          new RegExp(`\\$${filename}`, "g"),
          image.url
        );
      }

      const newHtml = await convertToHtml(processedMarkdown);
      set({ html: newHtml });
      return true;
    } catch (error) {
      console.error("문서 업데이트 실패:", error);
      return false;
    }
  },

  // 문서 초기화 시 이미지 정리
  resetDocument: () => {
    const images = get().images;
    // 모든 이미지 URL 해제
    for (const [_, image] of images.entries()) {
      URL.revokeObjectURL(image.url);
    }

    set({
      markdown: "",
      html: "",
      images: new Map(),
    });
  },

  // 파일 저장을 위한 이미지 데이터 준비
  getImagesData: () => {
    const images = get().images;
    return Array.from(images.entries()).map(([filename, image]) => ({
      filename,
      file: image.file,
    }));
  },
}));
