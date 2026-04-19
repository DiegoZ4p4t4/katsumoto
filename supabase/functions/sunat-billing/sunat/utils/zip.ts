import { unzipSync, zipSync } from "npm:fflate@0.8.2";

export function zipXml(filename: string, xml: string): Uint8Array {
  const encoded = new TextEncoder().encode(xml);
  return zipSync({
    [filename]: encoded,
  });
}

export function unzipFirstFile(
  zipBytes: Uint8Array,
): { name: string; content: string } {
  const files = unzipSync(zipBytes);
  const [name, content] = Object.entries(files)[0] || [];
  if (!name || !content) {
    throw new Error("El ZIP no contiene archivos.");
  }

  return {
    name,
    content: new TextDecoder().decode(content),
  };
}
