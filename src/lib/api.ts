// All /api/* calls go through same-origin relative URLs.
// Next.js rewrites() in next.config.js proxies them to the per-deployment
// BACKEND_URL (server-side env, set individually per Vercel project).
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

export function thumbnailUrl(person: Person | number): string {
  if (typeof person === 'object' && person !== null) {
    if (person.thumbnail_url) return person.thumbnail_url;
    return `${API_BASE}/api/images/thumbnail/${person.person_id}?t=${Date.now()}`;
  }
  return `${API_BASE}/api/images/thumbnail/${person}?t=${Date.now()}`;
}

/**
 * Ultra-fast download.
 *
 * We no longer fetch the file into a Blob before saving.  The old flow was:
 *     fetch() → read chunks → build Blob → URL.createObjectURL → <a> click
 * which meant the "Save As" dialog only opened AFTER the entire file was
 * buffered in memory.  For a 5 MB wedding photo on a typical connection
 * that's 1–3 seconds of apparent dead time.
 *
 * The new flow is a single native <a download> click.  The browser:
 *   1. Fires the navigation instantly (<50 ms perceptible).
 *   2. Follows our same-origin /api/images/download/... path.
 *   3. Backend returns a 302 to R2 — Railway never touches the bytes.
 *   4. Browser streams from Cloudflare's nearest edge POP straight to disk
 *      at full HTTP/2 or HTTP/3 speed, showing its own progress bar.
 *
 * Because the initial <a> click is same-origin, the `download="filename"`
 * attribute reliably renames the saved file (this is a browser
 * same-origin security rule; it would be ignored for cross-origin URLs).
 *
 * No progress percentage is reported — the browser's built-in download
 * UI shows progress already.  For local-dev fallback where you explicitly
 * want an in-UI progress bar, pass `onProgress`; that path buffers via
 * Blob as before and is measurably slower.
 */
export async function triggerDownload(
  downloadUrl: string,
  filename: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const url = downloadUrl.startsWith('http')
    ? downloadUrl
    : `${API_BASE}${downloadUrl}`;

  // Fast path — native <a download> click.
  // Used whenever no progress callback is requested (production default).
  if (!onProgress) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; // same-origin URL → this reliably sets the filename
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Slow fallback — buffer via Blob so we can compute a real progress %.
  // Kept for local development and debugging only.
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

  const contentLength = res.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = res.body!.getReader();
  const chunks: BlobPart[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0) onProgress(Math.min(99, Math.round((received / total) * 100)));
  }

  const blob = new Blob(chunks);
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
