// src/components/Toolbar.jsx
import React from "react";
import { Save, FileOutput, Printer } from "lucide-react";
import { useStyleStore } from "../store/styleStore";
import { PAPER_SIZES, FONTS } from "../constants";

const buttonClass =
  "p-2 flex items-center gap-2 rounded hover:bg-arapawa-50 active:bg-arapawa-100 transition-colors";

export const Toolbar = ({
  onSave,
  onSaveAs,
  onPrint,
  fileName,
  isModified,
  onFontChange,
  onFontSizeChange,
  currentFont,
  currentFontSize,
}) => {
  const { paperSize, setPaperSize } = useStyleStore();

  const handleFontSizeChange = (e) => {
    // 문자열을 숫자로 변환
    const newSize = parseInt(e.target.value, 10);
    onFontSizeChange(newSize);
  };

  return (
    <header className="flex-none flex items-center px-4 py-2">
      {/* padding 분리 */}
      <div className="w-full flex flex-row items-center justify-between gap-4 flex-1">
        <div className="flex gap-2">
          <button onClick={onSave} className={buttonClass}>
            <Save className="w-4 h-4" />
            저장
          </button>
          <button onClick={onSaveAs} className={buttonClass}>
            <FileOutput className="w-4 h-4" />
            다른 이름으로 저장
          </button>
        </div>
        <div>
          {isModified ? (
            <p>
              <span>•</span>
              {fileName}
            </p>
          ) : (
            <p>{fileName}</p>
          )}
        </div>
        <div className="flex gap-4">
          <select
            value={currentFont} // 직접 key 사용
            onChange={onFontChange}
            className="px-2 border rounded"
          >
            {Object.entries(FONTS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <input
            className="p-2 border rounded w-[4rem]"
            type="number"
            min="8"
            max="72"
            name="fontSize"
            id="fontSize"
            value={currentFontSize}
            onChange={handleFontSizeChange}
          />
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
          <button onClick={onPrint} className={buttonClass}>
            <Printer className="w-4 h-4" />
            인쇄
          </button>
        </div>
      </div>
    </header>
  );
};
