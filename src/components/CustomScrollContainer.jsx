import React, { useEffect, useRef, useState } from "react";

const CustomScrollContainer = ({ children, className = "" }) => {
  const contentRef = useRef(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScroll, setStartScroll] = useState(0);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateScrollbar = () => {
      const { scrollTop, scrollHeight, clientHeight } = content;
      setShowScrollbar(scrollHeight > clientHeight);
      setScrollRatio(scrollTop / (scrollHeight - clientHeight));
    };

    content.addEventListener("scroll", updateScrollbar);
    window.addEventListener("resize", updateScrollbar);
    updateScrollbar();

    return () => {
      content.removeEventListener("scroll", updateScrollbar);
      window.removeEventListener("resize", updateScrollbar);
    };
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartScroll(contentRef.current.scrollTop);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !contentRef.current) return;

    const deltaY = e.clientY - startY;
    const { scrollHeight, clientHeight } = contentRef.current;
    const scrollbarHeight = (clientHeight * clientHeight) / scrollHeight;
    const scrollableHeight = clientHeight - scrollbarHeight;
    const scrollDelta =
      (deltaY * (scrollHeight - clientHeight)) / scrollableHeight;

    contentRef.current.scrollTop = startScroll + scrollDelta;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={`relative print:static ${className}`}>
      <div
        ref={contentRef}
        className="h-full overflow-auto scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      {showScrollbar && (
        <div
          className="absolute top-0 right-0 w-2 h-full bg-transparent print:hidden"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute right-0 w-2 rounded-full bg-gray-400 opacity-50 hover:opacity-80 transition-opacity"
            style={{
              height: `${
                (contentRef.current?.clientHeight * 100) /
                contentRef.current?.scrollHeight
              }%`,
              transform: `translateY(${
                scrollRatio *
                (contentRef.current?.clientHeight -
                  (contentRef.current?.clientHeight *
                    contentRef.current?.clientHeight) /
                    contentRef.current?.scrollHeight)
              }px)`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomScrollContainer;
