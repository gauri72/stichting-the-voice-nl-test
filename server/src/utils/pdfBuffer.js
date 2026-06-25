/**
 * Collects a PDFKit document's streamed output into a single Buffer.
 * If `populate` is given, it's called with `doc` (then `doc.end()`) from
 * inside the executor so a synchronous throw during population correctly
 * rejects this same promise, rather than the caller having to call
 * doc.end() (and catch population errors) separately.
 */
export function collectPdfBuffer(doc, populate) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    if (populate) {
      try {
        populate(doc);
        doc.end();
      } catch (e) {
        reject(e);
      }
    }
  });
}
