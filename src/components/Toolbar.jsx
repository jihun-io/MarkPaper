import React, { useRef } from "react";
import Save from "lucide-react/dist/esm/icons/save";
import FileOutput from "lucide-react/dist/esm/icons/file-output";
import Printer from "lucide-react/dist/esm/icons/printer";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import { useStyleStore } from "../store/styleStore";
import { PAPER_SIZES, FONTS } from "../constants";

const buttonClass =
  "px-4 py-2 flex flex-col items-center gap-y-1 rounded hover:bg-arapawa-50 active:bg-arapawa-100 transition-colors";

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
  onImageUpload, // 새로운 prop 추가
}) => {
  const { paperSize, setPaperSize } = useStyleStore();
  const fileInputRef = useRef(null);

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    onFontSizeChange(newSize);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 타입 검사
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    await onImageUpload?.(file);

    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = "";
  };

  return (
    <header className="flex-none flex items-center px-4 py-2 text-[12px]">
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
          <button onClick={handleImageClick} className={buttonClass}>
            <ImagePlus className="w-4 h-4" />
            사진 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
        <div className="text-[1.25em] truncate">
          {isModified ? (
            <p>
              <span>•</span>
              {fileName}
            </p>
          ) : (
            <p>{fileName}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <select
            value={currentFont}
            onChange={onFontChange}
            className="p-2 h-8 flex items-center border rounded"
          >
            {Object.entries(FONTS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <input
            className="p-2 h-8 flex items-center border rounded w-[4.5em]"
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
            className="p-2 h-8 flex items-center border rounded"
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
