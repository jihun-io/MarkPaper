// src/components/Editor/index.jsx
import React, { forwardRef } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";

export const Editor = forwardRef(
  (
    { value, onChange, onSave, onSaveAs, fileName, isModified, ...props },
    ref
  ) => {
    return (
      <section className="print:hidden flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            defaultLanguage="markdown"
            value={value}
            onChange={onChange}
            theme="light"
            onMount={(editor) => {
              if (ref) ref.current = editor;
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: true,
              automaticLayout: true,
            }}
            {...props}
          />
        </div>
      </section>
    );
  }
);
