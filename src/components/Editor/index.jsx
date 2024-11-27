import React, { forwardRef, useCallback } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useDocumentStore } from "../../store/documentStore";

export const Editor = forwardRef(
  (
    { value, onChange, onSave, onSaveAs, fileName, isModified, ...props },
    ref
  ) => {
    const { addImage } = useDocumentStore();
    const editorRef = React.useRef(null);

    const handleEditorMount = (editor) => {
      editorRef.current = editor;
      if (ref) ref.current = editor;
    };

    const handleDrop = useCallback(
      async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // 드롭된 위치의 에디터 position 계산
        const target = event.target;
        const editor = editorRef.current;
        if (!editor) return;

        const files = Array.from(event.dataTransfer.files);
        const imageFiles = files.filter((file) =>
          file.type.startsWith("image/")
        );

        if (imageFiles.length === 0) return;

        // 마우스 위치를 에디터 position으로 변환
        const mousePosition = editor.getTargetAtClientPoint(
          event.clientX,
          event.clientY
        );
        const position = mousePosition?.position || editor.getPosition();

        // 여러 이미지 처리
        for (const file of imageFiles) {
          try {
            const { markdownText } = await addImage(file);

            // 현재 위치의 라인 컨텐츠 확인
            const lineContent = editor
              .getModel()
              .getLineContent(position.lineNumber);
            const isEmptyLine = lineContent.trim() === "";

            // 마크다운 텍스트 삽입
            const textToInsert = isEmptyLine
              ? markdownText
              : "\n" + markdownText + "\n";

            editor.executeEdits("drag-drop", [
              {
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: isEmptyLine ? 1 : lineContent.length + 1,
                  endLineNumber: position.lineNumber,
                  endColumn: isEmptyLine ? 1 : lineContent.length + 1,
                },
                text: textToInsert,
              },
            ]);

            // 커서 위치 업데이트
            position.lineNumber += textToInsert.split("\n").length - 1;

            // 변경 사항을 onChange로 전파
            onChange(editor.getValue());
          } catch (error) {
            console.error("이미지 추가 실패:", error);
          }
        }
      },
      [addImage, onChange]
    );

    return (
      <section
        className="print:hidden flex-1 min-w-0 flex flex-col"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            defaultLanguage="markdown"
            value={value}
            onChange={onChange}
            theme="light"
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: true,
              automaticLayout: true,
              dropIntoEditor: { enabled: true },
            }}
            {...props}
          />
        </div>
      </section>
    );
  }
);
