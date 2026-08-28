// Isolated from pdf-render.ts on purpose: pdf-parse pulls in a heavy PDF.js
// dependency chain that is only actually needed when extracting text from an
// uploaded master CV. Every other route (CV tailoring, cover letters, ATS
// score, prep brief, discover) only needs the CvContent type / renderCvPdf
// from pdf-render.ts and must not transitively load this module, since a
// broken/oversized bundle here has previously taken down unrelated routes.

// pdf-parse's package entry runs a debug script when required directly in
// some bundlers; importing the internal lib path avoids that.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text as string;
}
