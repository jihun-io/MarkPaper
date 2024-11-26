import React, { useRef, useEffect, useCallback } from "react";
import { Editor } from "./components/Editor";
import { Preview } from "./components/Preview";
import { useDocumentStore } from "./store/documentStore";
import { useStyleStore } from "./store/styleStore";
import { useFileStore } from "./store/fileStore";
import { updateFontFamily, updateFontSize } from "./utils/styles";
import { PAPER_SIZES } from "./constants";
import { Toolbar } from "./components/Toolbar";

const parseStyleTag = (content, setFont, setFontSize) => {
  const styleTagMatch = content.match(/<style>([\s\S]*?)<\/style>/);
  if (styleTagMatch) {
    const styleContent = styleTagMatch[1];
    const fontFamilyMatch = styleContent.match(/font-family:\s*([^;]+);/);
    const fontSizeMatch = styleContent.match(/font-size:\s*([^;]+);/);

    if (fontFamilyMatch) {
      setFont(fontFamilyMatch[1].trim());
    }
    if (fontSizeMatch) {
      setFontSize(parseInt(fontSizeMatch[1].trim()));
    }
  }
};

const App = () => {
  const { markdown, html, setMarkdown, setHtml, updateDocument } =
    useDocumentStore();

  const { paperSize, currentFont, currentFontSize, setFont, setFontSize } =
    useStyleStore();

  const {
    isOpened,
    fileName,
    filePath,
    isModified,
    setIsOpened,
    setFileName,
    setFilePath,
    setIsModified,
  } = useFileStore();

  const previewRef = useRef(null);
  const editorRef = useRef(null);

  // 저장 후 종료 처리를 위한 새로운 함수
  const handleSaveAndClose = async () => {
    let saved = false;

    if (filePath) {
      // 기존 파일이 있는 경우
      saved = await handleSave();
    } else {
      // 새 문서인 경우
      const saveResult = await window.electronAPI.showSaveDialog({
        defaultPath: fileName,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (!saveResult.canceled && saveResult.filePath) {
        try {
          await window.electronAPI.saveFile(saveResult.filePath, markdown);
          setFilePath(saveResult.filePath);
          setFileName(saveResult.filePath.split("/").pop());
          setIsModified(false);
          saved = true;
        } catch (error) {
          console.error("저장 실패:", error);
          saved = false;
        }
      }
    }

    if (saved) {
      window.electronAPI.closeWindow();
    }
  };

  const handleOutput = async () => {
    try {
      // electronAPI를 통해 저장 경로 선택
      const { filePath, canceled } = await window.electronAPI.showSaveDialog({
        defaultPath: fileName,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (!canceled && filePath) {
        // 선택된 경로 저장
        setFilePath(filePath);

        // 파일 저장
        await window.electronAPI.saveFile(filePath, markdown);

        // 파일 이름 업데이트
        const newFileName = filePath.split("/").pop();
        setFileName(newFileName);
        setIsModified(false);
      }
    } catch (error) {
      console.error("파일 저장 실패:", error);
    }
  };

  // 파일 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!filePath) {
      return handleOutput();
    }
    try {
      await window.electronAPI.saveFile(filePath, markdown);
      setIsModified(false);
      return true; // 저장 성공 시 true 반환
    } catch (error) {
      console.error("파일 저장 실패:", error);
      return false; // 저장 실패 시 false 반환
    }
  }, [filePath, markdown, handleOutput]);

  // 창에서 파일 불러오기 핸들러
  const handleLoad = useCallback(async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const content = await window.electronAPI.readFile(result.filePaths[0]);
        setFilePath(result.filePaths[0]);
        setFileName(result.filePaths[0].split("/").pop());
        updateDocument(content);
        setIsOpened(true);
        setIsModified(false);

        // 스타일 태그 파싱
        parseStyleTag(content, setFont, setFontSize);
      }
    } catch (error) {
      console.error("파일 로드 실패:", error);
    }
  }, []);

  // 메뉴 바에서 파일 로드 핸들러
  const handleLoadFile = async (filePath) => {
    try {
      const content = await window.electronAPI.readFile(filePath);
      setFilePath(filePath);
      setFileName(filePath.split("/").pop());
      updateDocument(content);
      setIsOpened(true);
      setIsModified(false);

      // 스타일 태그 파싱
      parseStyleTag(content, setFont, setFontSize);
    } catch (error) {
      console.error("파일 로드 실패:", error);
    }
  };

  const handlePrint = useCallback(() => {
    window.electronAPI.printToPDF();
  }, []);

  // 메뉴 바에서 파일 열기 이벤트 처리
  useEffect(() => {
    window.electronAPI.onMenuOpen((filePath) => {
      handleLoadFile(filePath);
    });

    return () => {
      window.electronAPI.removeMenuOpenListener();
    };
  }, []);

  // 단축 키 관련 코드
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpened) return; // 문서가 열려있지 않으면 무시

      const isMac = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);

      // Save 단축키
      if (
        (isMac && event.metaKey && event.key === "s") ||
        (!isMac && event.ctrlKey && event.key === "s")
      ) {
        event.preventDefault();
        handleSave();
      }

      // Print 단축키
      if (
        (isMac && event.metaKey && event.key === "p") ||
        (!isMac && event.ctrlKey && event.key === "p")
      ) {
        event.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave, handlePrint, isOpened]); // isOpened 추가

  useEffect(() => {
    if (isOpened) {
      // isOpened가 true일 때만 실행될 코드
    }
  }, [isOpened]);

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleEditorChange = async (value) => {
    const success = await updateDocument(value);
    if (success) {
      setIsModified(true);
    }
  };

  // beforeunload 이벤트 핸들러 수정
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (!isModified) {
        window.electronAPI.closeWindow();
        return;
      }

      e.preventDefault();
      e.returnValue = false;

      const response = await window.electronAPI.showCloseConfirmation();

      if (response === 0) {
        // 저장 후 종료
        const saved = await handleSaveAndClose();
        if (!saved) {
          // 저장이 실패하거나 취소된 경우 종료하지 않음
          return;
        }
      } else if (response === 1) {
        // 저장하지 않고 종료
        setIsModified(false);
        window.electronAPI.closeWindow();
      }
      // response === 2 (취소)인 경우 아무것도 하지 않음
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isModified, handleSaveAndClose, setIsModified]);

  // 상태 변화 모니터링을 위한 useEffect 추가
  useEffect(() => {
    console.log("fileName updated:", fileName);
    console.log("filePath updated:", filePath);
  }, [fileName, filePath]);

  useEffect(() => {
    // 메뉴 이벤트 리스너 등록
    window.electronAPI.onMenuSave(() => {
      handleSave();
    });

    window.electronAPI.onMenuSaveAs(() => {
      handleOutput();
    });

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.electronAPI.removeMenuSaveListener();
      window.electronAPI.removeMenuSaveAsListener();
    };
  }, [handleSave, handleOutput]);

  useEffect(() => {
    // 메뉴 인쇄 이벤트 리스너 등록
    window.electronAPI.onMenuPrint(() => {
      handlePrint();
    });

    return () => {
      window.electronAPI.removeMenuPrintListener();
    };
  }, [handlePrint]);

  const handleFontChange = (e) => {
    const fontKey = e.target.value;
    setFont(fontKey);

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      const content = model.getValue();
      const updatedContent = updateFontFamily(content, fontKey);
      model.setValue(updatedContent);
    }
  };

  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      const content = model.getValue();
      const updatedContent = updateFontSize(content, newSize);
      model.setValue(updatedContent);
    }
  };

  const currentPaperSize = PAPER_SIZES[paperSize];
  const paperWidth = currentPaperSize.width;
  const paperHeight = currentPaperSize.height;

  if (!isOpened) {
    return (
      <div className="flex items-center justify-center h-screen gap-x-4">
        <button
          onClick={() => setIsOpened(true)}
          className="p-4 rounded hover:bg-arapawa-50 transition-colors active:bg-arapawa-100"
        >
          새 문서 작성하기
        </button>
        <button
          onClick={handleLoad}
          className="p-4 bg-arapawa-500 text-white rounded transition-colors hover:bg-arapawa-800 active:bg-arapawa-900"
        >
          문서 불러오기
        </button>
      </div>
    );
  }
  return (
    <div className="text-sm w-full h-screen flex flex-col overflow-hidden">
      <Toolbar
        onSave={handleSave}
        onSaveAs={handleOutput}
        fileName={fileName}
        isModified={isModified}
        onPrint={handlePrint}
        onFontChange={handleFontChange}
        onFontSizeChange={handleFontSizeChange}
        currentFont={currentFont}
        currentFontSize={currentFontSize}
      />
      <main className="flex-1 min-h-0 flex flex-row gap-4 px-4 pb-4 bg-gray-100">
        <Editor
          ref={editorRef}
          value={markdown}
          onChange={handleEditorChange}
          onSave={handleSave}
          onSaveAs={handleOutput}
          fileName={fileName}
          isModified={isModified}
        />
        <Preview
          ref={previewRef}
          html={html}
          paperWidth={paperWidth}
          paperHeight={paperHeight}
          paperSize={paperSize}
        />
      </main>
      {/* 인쇄용 스타일 */}
      <style jsx global>{`
        .prose * {
          color: var(--foreground);
        }

        .prose .full-height {
          min-height: 100%;
        }

        .prose p + h2 {
          margin-top: 1.5rem;
        }

        .prose p + p {
          margin-top: 1rem;
        }

        .prose svg {
          display: inline-block;
        }

        .prose *:has(svg) {
          display: inline-flex;
          column-gap: 0.5rem;
        }

        @media screen {
          .page-break {
            height: 0;
            page-break-after: always;
            margin: 1rem 0;
            border-top: 1px dashed #999;
          }
        }

        @media print {
          @page {
            size: ${paperSize.toLowerCase()};
            margin: 2cm;
            font-size: 12pt;
            counter-increment: page;
          }

          @page {
            @bottom-center {
              content: counter(page);
              font-size: 8pt;
            }
          }

          body * {
            visibility: hidden;
          }

          .printable,
          .printable * {
            visibility: visible;
          }

          .printable {
            position: absolute;
            left: 0;
            top: 0;
            zoom: 1 !important;
          }

          .page-break {
            height: 0;
            page-break-after: always;
            margin: 0;
            border: none;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
