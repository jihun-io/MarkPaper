import { useCallback } from "react";
import { useFileStore } from "../store/fileStore";
import { useDocumentStore } from "../store/documentStore";

export const useFileOperations = () => {
  const {
    filePath,
    setFilePath,
    setFileName,
    setIsOpened,
    setIsModified,
    prepareFileData,
    loadFileData,
  } = useFileStore();

  const { markdown, setMarkdown, setHtml, convertToHtml } = useDocumentStore();

  const handleSave = useCallback(async () => {
    if (filePath) {
      console.log("저장 경로:", filePath);
      try {
        // prepareFileData로 저장할 데이터 준비
        const fileData = await prepareFileData(markdown);
        await window.electronAPI.saveFile(filePath, fileData);
        setIsModified(false);
      } catch (error) {
        console.error("파일 저장 실패:", error);
      }
    } else {
      // 새 파일 저장 다이얼로그
      const result = await window.electronAPI.showSaveDialog({
        filters: [
          { name: "MarkPaper", extensions: ["mp"] },
          { name: "Markdown", extensions: ["md"] },
        ],
      });

      if (!result.canceled && result.filePath) {
        setFilePath(result.filePath);
        setFileName(result.filePath.split("/").pop());
        // 재귀적으로 저장 처리
        handleSave();
      }
    }
  }, [filePath, markdown]);

  const handleLoad = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "MarkPaper & Markdown", extensions: ["mp", "md"] }],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileBuffer = await window.electronAPI.readFile(filePath, true); // 바이너리 데이터로 읽기

        // loadFileData로 파일 내용 파싱
        const { content, metadata } = await loadFileData(fileBuffer, filePath);

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

  const handleNew = useCallback(() => {
    setIsOpened(true);
    setFileName("새 문서");
    setFilePath("");
    setMarkdown("");
    setHtml("");
    setIsModified(false);
  }, []);

  return { handleSave, handleLoad, handleNew };
};
