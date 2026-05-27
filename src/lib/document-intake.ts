export async function extractDocumentText(buffer: Buffer, mimeType: string, fileName: string) {
  const loweredName = fileName.toLowerCase();

  if (mimeType.startsWith("text/") || loweredName.endsWith(".txt") || loweredName.endsWith(".md")) {
    return buffer.toString("utf8").trim();
  }

  if (mimeType === "application/pdf" || loweredName.endsWith(".pdf")) {
    try {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = "default" in pdfParseModule
        ? (pdfParseModule as { default: (buffer: Buffer) => Promise<{ text: string }> }).default
        : (pdfParseModule as unknown as (buffer: Buffer) => Promise<{ text: string }>);
      const parsed = await pdfParse(buffer);
      return parsed.text.trim();
    } catch {
      return "";
    }
  }

  if (mimeType.startsWith("image/")) {
    return "";
  }

  return "";
}
