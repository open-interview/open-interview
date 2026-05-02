/**
 * Triggers browser print-to-PDF for the current blog post.
 *
 * Call this from the "Download as PDF" button. The browser's print
 * dialog will open with styles optimised for a clean, readable PDF
 * via the `@media print` rules in blog-layout.css and facelift.css.
 */
export function exportBlogPdf() {
  window.print();
}

/**
 * Sets a temporary document title that appears in the PDF header
 * (browser print header). Call before exportBlogPdf() and restore
 * the original title afterward.
 *
 * @param title  Article title
 * @param author Author display name
 * @param date   Formatted publication date
 */
export function setPdfHeader(title: string, author: string, date: string) {
  const original = document.title;
  document.title = `${title} — ${author} (${date})`;
  return original;
}

/**
 * Restore the document title after printing.
 */
export function restorePdfHeader(original: string) {
  document.title = original;
}
