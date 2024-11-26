// src/utils/styles.js
export const updateFontFamily = (content, fontFamily) => {
  const styleRegex = /<style>\s*([\s\S]*?)\s*<\/style>/;
  const proseFontRegex = /\.prose\s*{[^}]*font-family:[^}]*}/;
  const newFontRule = `.prose {\n  font-family: ${fontFamily};\n}`;

  if (styleRegex.test(content)) {
    if (proseFontRegex.test(content)) {
      return content.replace(proseFontRegex, newFontRule);
    }
    return content.replace(styleRegex, (match, p1) => {
      return `<style>\n${p1}${p1 ? "\n" : ""}${newFontRule}\n</style>`;
    });
  }
  return `<style>\n${newFontRule}\n</style>\n\n${content}`;
};

export const updateFontSize = (content, fontSize) => {
  const styleRegex = /<style>\s*([\s\S]*?)\s*<\/style>/;
  const proseFontRegex = /\.prose\s*{[^}]*font-size:[^}]*}/;
  const newFontRule = `.prose {\n  font-size: ${fontSize}pt;\n}`;

  // style 태그가 있는 경우
  if (styleRegex.test(content)) {
    // .prose의 font-size 규칙이 있는 경우
    if (proseFontRegex.test(content)) {
      return content.replace(proseFontRegex, newFontRule);
    }
    // style 태그는 있지만 font-size 규칙이 없는 경우
    return content.replace(styleRegex, (match, p1) => {
      return `<style>\n${p1}${p1 ? "\n" : ""}${newFontRule}\n</style>`;
    });
  }

  // style 태그가 없는 경우 - 문서 최상단에 삽입
  return `<style>\n${newFontRule}\n</style>\n\n${content}`;
};
