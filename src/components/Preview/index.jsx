// src/components/Preview/index.jsx
import React, { forwardRef } from "react";
import PreviewStyles from "./PreviewStyles";

export const Preview = forwardRef(
  ({ html, paperWidth, paperHeight, paperSize }, ref) => {
    return (
      <section
        className="print:p-0 print:shadow-none print:w-full flex-none flex flex-col min-w-0"
        style={{ width: `${paperWidth * 0.6}mm` }}
        ref={ref}
      >
        <h2 className="text-sm flex-none font-bold my-2 print:hidden">
          미리 보기
        </h2>
        <div className="flex-1 min-h-0 overflow-auto">
          <PreviewStyles paperSize={paperSize} html={html} />
        </div>
      </section>
    );
  }
);
