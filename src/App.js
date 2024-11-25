import React, { useState, useRef, useEffect } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
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
  const [fileName, setFileName] = useState("새 문서.md");
  const [filePath, setFilePath] = useState(""); // 파일 경로 상태 추가
  const [markdown, setMarkdown] = useState("");
  const [html, setHtml] = useState("");
  const [paperSize, setPaperSize] = useState("A4");
  const previewRef = useRef(null);
  const editorRef = useRef(null);

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
  };

  const handlePrint = () => {
    window.electronAPI.printToPDF();
  };

  const handleSave = async () => {
    if (filePath) {
      await window.electronAPI.saveFile(filePath, markdown);
    } else {
      handleOutput();
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
      }
    } catch (error) {
      console.error("파일 저장 실패:", error);
    }
  };

  const handleLoad = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        setMarkdown(text);
        const newHtml = await convertToHtml(text);
        setHtml(newHtml);
        setIsOpened(true);
        setFileName(file.name);
        setFilePath(file.path); // 파일 경로 저장
      };
      reader.readAsText(file);
    };
    input.click();
  };

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
              내보내기
            </button>
            <button onClick={handleLoad} className="flex items-center gap-2">
              <Import className="w-4 h-4" />
              불러오기
            </button>
          </div>
          <div>
            <p>{fileName}</p>
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
