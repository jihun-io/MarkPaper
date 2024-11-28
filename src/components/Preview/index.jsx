// src/components/Preview/index.jsx
import React, { forwardRef } from "react";
import PreviewStyles from "./PreviewStyles";
import CustomScrollContainer from "../CustomScrollContainer";

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
        <CustomScrollContainer className="flex-1 min-h-0">
          <PreviewStyles paperSize={paperSize} html={html} />
        </CustomScrollContainer>
      </section>
    );
  }
);
