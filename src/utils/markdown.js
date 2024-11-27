// src/utils/markdown.js
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { schema } from "./schema";

export const convertToHtml = async (markdown) => {
  // 코드블록 부분을 임시로 치환
  let codeBlocks = [];
  let codeBlockCounter = 0;
  let processedMarkdown = markdown.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `CODE_BLOCK_${codeBlockCounter++}`;
  });

  // 코드블록 외부의 pagebreak 치환
  processedMarkdown = processedMarkdown.replace(
    "---pagebreak---\n",
    '<div class="page-break"></div>'
  );

  // 코드블록 복원
  codeBlocks.forEach((block, index) => {
    processedMarkdown = processedMarkdown.replace(`CODE_BLOCK_${index}`, block);
  });

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(processedMarkdown);

  return result.toString();
};
