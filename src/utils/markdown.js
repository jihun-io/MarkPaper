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
  const markdownWithBreaks = markdown.replace(
    /---pagebreak---/g,
    '<div class="page-break"></div>'
  );

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(markdownWithBreaks);

  return result.toString();
};
