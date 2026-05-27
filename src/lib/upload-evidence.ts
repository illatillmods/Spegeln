import type { EvidenceManifest } from "@/lib/ai-worker";

export async function uploadEvidenceFiles(files: FileList | null): Promise<EvidenceManifest[]> {
  const entries = Array.from(files || []);
  const results: EvidenceManifest[] = [];

  for (const file of entries) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/evidence", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as {
      storageKey?: string;
      fileName?: string;
      mimeType?: string;
      byteSize?: number;
      error?: string;
    };

    if (!response.ok || !data.storageKey) {
      throw new Error(data.error || `Kunde inte ladda upp ${file.name}.`);
    }

    results.push({
      fileName: data.fileName || file.name,
      mimeType: data.mimeType || file.type || "application/octet-stream",
      byteSize: data.byteSize ?? file.size,
      assetKind: file.type.startsWith("video/")
        ? "VIDEO"
        : file.type.startsWith("image/")
          ? "IMAGE"
          : file.type.startsWith("text/")
            ? "TEXT"
            : "DOCUMENT",
      storageKey: data.storageKey,
    });
  }

  return results;
}

export async function readTextFromFiles(files: FileList | null) {
  const chunks: string[] = [];

  for (const file of Array.from(files || [])) {
    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      chunks.push(await file.text());
      continue;
    }

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      chunks.push(`[PDF: ${file.name} — text extraheras i produktion via OCR.]`);
    }
  }

  return chunks.join("\n\n").trim();
}
