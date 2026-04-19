import type { VercelRequest, VercelResponse } from "@vercel/node";

const GITHUB_REPO = "DiegoZ4p4t4/katsumoto";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

interface PlatformAsset {
  signature: string;
  url: string;
}

interface UpdateResponse {
  version: string;
  date: string;
  body: string;
  platforms: Record<string, PlatformAsset>;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { target, arch, current_version } = req.query as {
    target?: string;
    arch?: string;
    current_version?: string;
  };

  if (!target || !arch || !current_version) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const ghRes = await fetch(GITHUB_API, {
      headers: { "User-Agent": "katsumoto-updater" },
    });

    if (!ghRes.ok) {
      return res.status(502).json({ error: "GitHub API error" });
    }

    const release = await ghRes.json();
    const remoteVersion = release.tag_name.replace(/^v/, "");

    if (!isNewerVersion(remoteVersion, current_version)) {
      return res.status(204).end();
    }

    const platforms: Record<string, PlatformAsset> = {};

    for (const asset of release.assets || []) {
      const name: string = asset.name;
      const platformKey = extractPlatformKey(name);
      if (platformKey && name.endsWith(".tar.gz")) {
        const sigAsset = release.assets.find(
          (a: { name: string }) => a.name === `${name}.sig`,
        );
        if (sigAsset) {
          const sigRes = await fetch(sigAsset.browser_download_url);
          const signature = await sigRes.text();
          platforms[platformKey] = {
            signature: signature.trim(),
            url: asset.browser_download_url,
          };
        }
      }
    }

    const body: UpdateResponse = {
      version: remoteVersion,
      date: release.published_at || "",
      body: (release.body || "").substring(0, 1000),
      platforms,
    };

    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json(body);
  } catch (err) {
    console.error("Update check error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

function isNewerVersion(remote: string, current: string): boolean {
  const r = remote.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true;
    if ((r[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

function extractPlatformKey(filename: string): string | null {
  const match = filename.match(
    /katsumoto-pos_([a-z0-9_]+)\.(app\.tar\.gz|tar\.gz)$/,
  );
  if (!match) return null;
  const archPart = match[1];
  const ext = match[2];

  if (ext === "app.tar.gz") {
    const macArchMap: Record<string, string> = {
      aarch64: "darwin-aarch64",
      x64: "darwin-x86_64",
      x86_64: "darwin-x86_64",
    };
    return macArchMap[archPart] || `darwin-${archPart}`;
  }

  if (filename.includes("linux") || filename.includes("ubuntu")) {
    return `linux-${archPart}`;
  }

  const winArchMap: Record<string, string> = {
    x64: "windows-x86_64",
    x86_64: "windows-x86_64",
  };
  return winArchMap[archPart] || `windows-${archPart}`;
}
