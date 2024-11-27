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
  let placeholders = [];
  let counter = 0;

  // 코드블록과 인라인 코드를 모두 임시 치환
  let processedMarkdown = markdown
    // 코드블록 치환 (```)
    .replace(/```[\s\S]*?```/g, (match) => {
      placeholders.push(match);
      return `§§PLACEHOLDER_${counter++}§§`; // 특수 구분자 추가
    })
    // 인라인 코드 치환 (`)
    .replace(/`[^`\n]+`/g, (match) => {
      placeholders.push(match);
      return `§§PLACEHOLDER_${counter++}§§`; // 특수 구분자 추가
    });

  // 코드 외부의 pagebreak 치환
  processedMarkdown = processedMarkdown.replace(
    /---pagebreak---/g,
    '<div class="page-break"></div>'
  );

  // 코드블록과 인라인 코드 복원
  placeholders.forEach((code, index) => {
    processedMarkdown = processedMarkdown.replace(
      `§§PLACEHOLDER_${index}§§`, // 특수 구분자로 정확히 매칭
      code
    );
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
