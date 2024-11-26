import React, { useState, useRef, useEffect, useCallback } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { Save, Import, FileOutput, Printer, FileDown } from "lucide-react";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import Editor from "@monaco-editor/react";
import Preview from "./components/Preview";

// 용지 크기 정의 (mm 단위)
const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
};

// Tailwind 클래스들을 허용하도록 sanitize 스키마 확장
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes["*"] || []),
      "className",
      "class",
      "style",
      "width",
      "height",
      "display",
      "align",
      "valign",
      "for",
      // SVG 관련 속성 추가
      "viewBox",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "xmlns",
    ],
    // SVG 태그 명시적 허용
    svg: [
      "xmlns",
      "fill",
      "viewBox",
      "class",
      "stroke",
      "stroke-width",
      "class",
      "className",
    ],
    path: [
      "d",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
    ],
  },
  // 허용할 태그에 SVG 관련 태그 추가
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "span",
    "div",
    "p",
    "br",
    "svg",
    "path",
    "style",
  ],
};

const convertToHtml = async (markdown) => {
  const markdownWithBreaks = markdown.replace(
    /---pagebreak---/g,
    '<div class="page-break"></div>'
  );

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm) // GFM 지원 추가
    .use(remarkRehype, {
      // rehype 옵션 추가
      allowDangerousHtml: true, // raw HTML 허용
    })
    .use(rehypeRaw) // raw HTML 처리
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(markdownWithBreaks);

  return result.toString();
};

const App = () => {
  const [isOpened, setIsOpened] = useState(false);
  const [fileName, setFileName] = useState("새 문서");
  const [filePath, setFilePath] = useState(""); // 파일 경로 상태 추가
  const [isModified, setIsModified] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [html, setHtml] = useState("");
  const [paperSize, setPaperSize] = useState("A4");
  const previewRef = useRef(null);
  const editorRef = useRef(null);

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

  const handlePrint = useCallback(() => {
    window.electronAPI.printToPDF();
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
    setMarkdown(value);
    const newHtml = await convertToHtml(value);
    setHtml(newHtml);
    setIsModified(true);
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

  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (!isModified) return; // 수정사항 없으면 바로 종료

      e.preventDefault();
      e.stopImmediatePropagation(); // 이벤트 전파 중단

      const response = await window.electronAPI.showCloseConfirmation();

      if (response === 0) {
        // 저장 후 종료
        try {
          if (filePath) {
            await window.electronAPI.saveFile(filePath, markdown);
            setIsModified(false); // 저장 완료 후 상태 업데이트
            window.close();
          } else {
            const saveResult = await window.electronAPI.showSaveDialog({
              defaultPath: fileName,
              filters: [{ name: "Markdown", extensions: ["md"] }],
            });

            if (!saveResult.canceled && saveResult.filePath) {
              await window.electronAPI.saveFile(saveResult.filePath, markdown);
              setIsModified(false); // 저장 완료 후 상태 업데이트
              window.close();
            }
          }
        } catch (error) {
          console.error("저장 실패:", error);
        }
      } else if (response === 1) {
        // 저장하지 않고 종료
        setIsModified(false); // 강제로 수정 상태 해제
        window.close();
      }
      // 취소는 아무 동작 하지 않음
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isModified, filePath, fileName, markdown]);

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

  const currentPaperSize = PAPER_SIZES[paperSize];
  const paperWidth = currentPaperSize.width;
  const paperHeight = currentPaperSize.height;

  if (!isOpened) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button onClick={() => setIsOpened(true)} className="p-4 rounded">
          새 문서 작성하기
        </button>
        <button
          onClick={handleLoad}
          className="p-4 bg-blue-500 text-white rounded"
        >
          문서 로드하기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* 상단 컨트롤러바 */}
      <header className="flex-none mb-4 px-4 pt-4">
        {/* padding 분리 */}
        <div className="w-full mb-4 flex flex-row items-center justify-between gap-4 flex-1">
          <div className="flex gap-4">
            <button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              저장
            </button>
            <button onClick={handleOutput} className="flex items-center gap-2">
              <FileOutput className="w-4 h-4" />
              다른 이름으로 저장
            </button>
          </div>
          <div>
            {isModified ? (
              <p>
                <span>•</span>
                {fileName}
              </p>
            ) : (
              <p>{fileName}</p>
            )}
          </div>
          <div className="flex gap-4">
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="p-2 border rounded"
            >
              {Object.keys(PAPER_SIZES).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              인쇄
            </button>
          </div>
        </div>
      </header>
      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 min-h-0 flex flex-row gap-4 px-4 pb-4">
        {/* padding 분리, min-h-0 추가 */}
        {/* 편집기 */}
        <section className="print:hidden flex-1 min-w-0 flex flex-col">
          <h2 className="flex-none text-lg font-bold mb-2">Markdown</h2>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={markdown}
              onChange={handleEditorChange}
              theme="light"
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: true,
                automaticLayout: true,
              }}
            />
          </div>
        </section>
        {/* 미리보기 */}
        <section
          className="print:p-0 print:shadow-none print:w-full flex-none flex flex-col min-w-0"
          style={{ width: `${paperWidth * 0.6}mm` }}
        >
          <h2 className="flex-none text-lg font-bold mb-2 print:hidden">
            미리 보기
          </h2>
          <div className="flex-1 min-h-0 overflow-auto">
            <Preview
              ref={previewRef}
              paperWidth={paperWidth}
              paperHeight={paperHeight}
              html={html}
            />
          </div>
        </section>
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
