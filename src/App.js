import React, { useState, useRef } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import { Save, Import, Printer, FileDown } from "lucide-react";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify"; // 추가
import remarkRehype from "remark-rehype"; // 추가
import Editor from "@monaco-editor/react";

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
  const [markdown, setMarkdown] = useState("");
  const [html, setHtml] = useState("");
  const [paperSize, setPaperSize] = useState("A4");
  const previewRef = useRef(null);

  const handleEditorChange = async (value) => {
    setMarkdown(value);
    const newHtml = await convertToHtml(value);
    setHtml(newHtml);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const result = markdown;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getDpi = () => {
    return 96 * window.devicePixelRatio;
  };

  // mm를 px로 변환 (실제 디바이스 DPI 기준)
  const mmToPx = (mm) => {
    const dpi = getDpi();
    // 1mm = 1/25.4 inch
    // 1inch = dpi pixels
    return Math.round((mm * dpi) / 25.4);
  };

  const currentPaperSize = PAPER_SIZES[paperSize];
  const paperWidth = currentPaperSize.width;
  const paperHeight = currentPaperSize.height;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {" "}
      {/* h-screen으로 변경 */}
      {/* 상단 컨트롤러바 */}
      <div className="flex-none mb-4 px-4 pt-4">
        {" "}
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
            <p>파일 명.md</p>
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
      </div>

      <div className="flex flex-row gap-4">
        {/* 편집기 */}
        <div className="print:hidden flex-1 min-w-0 flex flex-col">
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
        </div>

        {/* 미리보기 */}
        <div className="print:p-0 print:shadow-none print:w-full flex-1 flex flex-col min-w-0">
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
        </div>
      </div>
    </div>
  );
};

export default App;
