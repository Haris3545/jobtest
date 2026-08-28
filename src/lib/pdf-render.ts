import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Builds a clean, consistently formatted CV PDF from structured sections.
 *
 * Note on layout fidelity: true in-place editing of an arbitrary uploaded
 * PDF (preserving its exact original visual design while changing wording)
 * is not reliably possible without the source document (Word/LaTeX) — PDF
 * text is laid out in fixed positions per font/glyph, so reworded or
 * reordered bullets would overflow or misalign. Instead we regenerate a
 * clean single-column template from the tailored content, which stays
 * consistent for every job and is fully editable in the in-app editor
 * before download.
 */
export interface CvSection {
  heading: string;
  bullets: string[];
}

export interface CvContent {
  name: string;
  contactLine: string;
  summary?: string;
  sections: CvSection[];
}

export async function renderCvPdf(content: CvContent): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPageIfNeeded(lineHeight: number) {
    if (y - lineHeight < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function wrapText(text: string, useFont: typeof font, size: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (useFont.widthOfTextAtSize(trial, size) > maxWidth) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = trial;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawLine(text: string, useFont: typeof font, size: number, indent = 0, color = rgb(0.1, 0.1, 0.1)) {
    newPageIfNeeded(size + 4);
    page.drawText(text, { x: margin + indent, y, size, font: useFont, color });
    y -= size + 6;
  }

  drawLine(content.name, boldFont, 20);
  drawLine(content.contactLine, font, 10, 0, rgb(0.35, 0.35, 0.35));
  y -= 6;

  if (content.summary) {
    for (const line of wrapText(content.summary, font, 10.5)) drawLine(line, font, 10.5);
    y -= 6;
  }

  for (const section of content.sections) {
    y -= 4;
    drawLine(section.heading.toUpperCase(), boldFont, 12);
    page.drawLine({
      start: { x: margin, y: y + 12 },
      end: { x: pageWidth - margin, y: y + 12 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    for (const bullet of section.bullets) {
      const lines = wrapText(`•  ${bullet}`, font, 10.5);
      for (const line of lines) drawLine(line, font, 10.5, 4);
    }
  }

  return doc.save();
}
