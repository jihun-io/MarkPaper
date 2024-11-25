import React, { useState, useRef } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import { Printer, FileDown } from "lucide-react";
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
    <div className="w-full max-w-full mx-auto p-4">
      <div className="mb-4 flex items-center gap-4">
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
        <button onClick={handleSave}>저장</button>
        <button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          인쇄
        </button>
      </div>

      <div className="flex flex-row gap-4">
        {/* 편집기 */}
        <div className="p-4 print:hidden flex-1 min-w-0">
          {" "}
          {/* min-w-0 추가 */}
          <h2 className="text-lg font-bold mb-2">마크다운 입력</h2>
          <Editor
            height="800px"
            defaultLanguage="markdown"
            value={markdown}
            onChange={handleEditorChange}
            theme="light"
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: true,
            }}
          />
        </div>

        {/* 미리보기 */}
        <div className="print:p-0 print:shadow-none print:w-full">
          <h2 className="text-lg font-bold mb-2 print:hidden">미리 보기</h2>
          <div
            ref={previewRef}
            className="printable print:p-0 rounded-md overflow-auto print:border-0 print:overflow-visible"
            style={{
              width: `${paperWidth}mm`,
              height: `${paperHeight}mm`,
              backgroundColor: "white",
              zoom: 0.6,
            }}
          >
            <div
              className={`h-full print:m-0 text-[12pt] prose max-w-none
                prose-headings:font-bold
                prose-h1:text-2xl prose-h1:my-4 prose-h1:leading-[1.3]
                prose-h2:text-xl prose-h2:mt-4 prose-h2:mb-0
                prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-4
                prose-p:leading-[1.7] prose-p:my-2
                prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 
                prose-blockquote:pl-4 prose-blockquote:py-1 
                prose-ul:list-disc prose-ul:pl-4 prose-ul:mt-0 prose-ul:mb-2
                prose-li:my-[0.2rem]
                prose-strong:font-[700]
                prose-table:w-fit prose-table:mt-4 prose-table:mb-0 prose-table:text-[12pt]
                prose-thead:border-none
                prose-th:py-0
                prose-td:py-0`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>

      <div className="hidden text-xl"></div>

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
            margin: 2rem 0;
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
