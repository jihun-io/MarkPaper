export default function PreviewStyles({
  previewRef,
  paperWidth,
  paperHeight,
  html,
}) {
  return (
    <div
      ref={previewRef}
      className="printable print:p-0 rounded-md overflow-auto print:border-0 print:overflow-visible"
      style={{
        width: `${paperWidth}mm`,
        minHeight: "100%",
        backgroundColor: "white",
        zoom: 0.6,
      }}
    >
      <div
        className={`h-full max-h-full print:m-0 text-[12pt] prose max-w-none
                prose-headings:font-bold
                prose-h1:text-[1.5em] prose-h1:my-4 prose-h1:leading-[1.3]
                prose-h2:text-[1.25em] prose-h2:mt-4 prose-h2:mb-0
                prose-h3:text-[1.125em] prose-h3:mt-4 prose-h3:mb-4
                prose-p:leading-[1.7] prose-p:my-2
                prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 
                prose-blockquote:pl-4 prose-blockquote:py-1 
                prose-li:marker:text-black
                prose-li:my-[0.2rem]
                prose-strong:font-[700]
                prose-table:w-fit prose-table:mt-4 prose-table:mb-0 prose-table:text-[12pt]
                prose-thead:border-none
                prose-th:py-0
                prose-td:py-0
                prose-pre:!bg-gray-100
                prose-code:!text-black
                prose-code:before:content-[''] prose-code:after:content-['']
                after:content-[''] after:block after:opacity-0 after:w-full after:h-[100vh] after:print:hidden
                `}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
