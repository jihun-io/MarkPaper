// src/hooks/useFileOperations.js
import { useCallback } from "react";
import { useFileStore } from "../store/fileStore";
import { useDocumentStore } from "../store/documentStore";

export const useFileOperations = () => {
  const { setFilePath, setFileName, setIsModified } = useFileStore();
  const { markdown, updateDocument } = useDocumentStore();

  const handleSave = useCallback(async () => {
    if (filePath) {
      console.log("저장 경로:", filePath);
      try {
        await window.electronAPI.saveFile(filePath, markdown);
        setIsModified(false);
      } catch (error) {
        console.error("파일 저장 실패:", error);
      }
    } else {
      handleOutput();
    }
  }, [filePath, markdown]);

  const handleLoad = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const content = await window.electronAPI.readFile(filePath);

        setIsOpened(true);
        setFileName(filePath.split("/").pop());
        setFilePath(filePath);
        setMarkdown(content);
        setIsModified(false);

        const newHtml = await convertToHtml(content);
        setHtml(newHtml);
      }
    } catch (error) {
      console.error("파일 로드 실패:", error);
    }
  };

  return { handleSave, handleLoad };
};
