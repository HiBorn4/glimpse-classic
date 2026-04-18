// All /api/* calls go through same-origin relative URLs.
// Next.js rewrites() in next.config.js proxies them to the per-deployment
// BACKEND_URL (server-side env, set individually per Vercel project).
//
// Do NOT use NEXT_PUBLIC_API_URL here: it's baked into the bundle at build
// time, which in a multi-client setup causes every client's browser to hit
// the same hardcoded backend.
const API_BASE = '';

export type Photo = {
  filename: string;
  relative_path: string;
  ceremony: string;
  people: number[];
  photo_type: string;
  face_count: number;
  viewing_url: string;
  download_url: string;
  orientation?: string;
};

export type Person = {
  person_id: number;
  name: string;
  total_photos: number;
  ceremonies: Record<string, number>;
  // Backend now sends a direct-to-R2 thumbnail URL with a per-boot cache
  // buster. When present, use it verbatim — it's already client-specific
  // and cache-safe.
  thumbnail_url?: string;
};

export type EventInfo = {
  total_photos: number;
  total_people: number;
  ceremonies: string[];
};

export type PhotosResponse = {
  photos: Photo[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
};

export async function apiFetch<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail: string }).detail || 'API error');
  }
  return res.json() as Promise<T>;
}

export async function apiUpload(path: string, file: File) {
  const form = new FormData();
  form.append('selfie', file);
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail: string }).detail || 'Upload failed');
  }
  return res.json();
}

/**
 * Resolve a thumbnail URL for a Person.
 *
 * Preference order:
 *   1. `person.thumbnail_url` if the backend sent one. This is a direct R2
 *      URL that already contains the client's r2.dev subdomain — so two
 *      different clients produce two different <img src> strings and the
 *      browser memory cache cannot collide them.
 *   2. Fallback: the old proxy endpoint with a fresh per-call cache buster.
 *      Only used if an older backend without thumbnail_url is running.
 *
 * Either way, there is NO persistent client-side cache of thumbnails:
 * the URL always varies when the backend restarts (new nonce) or when
 * Person data is re-fetched (new fallback timestamp).
 */
export function thumbnailUrl(person: Person | number): string {
  // Object form: backend-provided URL wins.
  if (typeof person === 'object' && person !== null) {
    if (person.thumbnail_url) return person.thumbnail_url;
    return `${API_BASE}/api/images/thumbnail/${person.person_id}?t=${Date.now()}`;
  }
  // Number form (legacy callsites): no Person context, just bust with time.
  return `${API_BASE}/api/images/thumbnail/${person}?t=${Date.now()}`;
}

/**
 * Downloads a photo directly to the user's system.
 */
export async function triggerDownload(
  downloadUrl: string,
  filename: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const url = `${API_BASE}${downloadUrl}`;

  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

  const contentLength = res.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (onProgress && total > 0) {
      onProgress(Math.min(99, Math.round((received / total) * 100)));
    }
  }

  const blob = new Blob(chunks.map((c) => c.buffer as ArrayBuffer));
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

export function prefetchImages(urls: string[], max = 12): void {
  urls.slice(0, max).forEach((url) => {
    const img = new Image();
    img.src = `${API_BASE}${url}`;
  });
}
