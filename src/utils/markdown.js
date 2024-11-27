import { unified } from "unified";
import { visit } from "unist-util-visit";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

// 로컬 이미지 처리를 위한 정규식
const LOCAL_IMAGE_REGEX = /!\[(.*?)\]\(\$(.+?)\)/g;

// sanitizeImageSrc 함수는 그대로 유지
const sanitizeImageSrc = (src) => {
  if (src.startsWith("blob:")) {
    return src;
  }
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  return "";
};

// 새로운 rehype 플러그인 추가
const rehypeSanitizeImages = () => {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "img" && node.properties.src) {
        node.properties.src = sanitizeImageSrc(node.properties.src);
      }
    });
  };
};

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

  // 로컬 이미지 구문 처리 ($로 시작하는 이미지)
  processedMarkdown = processedMarkdown.replace(
    LOCAL_IMAGE_REGEX,
    (match, altText, imagePath) => {
      // documentStore의 images Map에서 이미지 URL을 찾을 수 있도록
      // 특별한 data 속성을 추가
      return `<img src="${sanitizeImageSrc(
        imagePath
      )}" alt="${altText}" data-local-image="true" />`;
    }
  );

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
    // .use(rehypeSanitizeImages) // 새로운 플러그인 추가
    .use(rehypeStringify)
    .process(processedMarkdown);

  return result.toString();
};
