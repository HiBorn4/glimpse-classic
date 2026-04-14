const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

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

export function thumbnailUrl(personId: number): string {
  return `${API_BASE}/api/images/thumbnail/${personId}`;
}

/**
 * Downloads a photo directly to the user's system without any navigation,
 * new tabs, or redirects.
 *
 * How it works:
 *   1. fetch() the backend /api/images/download/... endpoint.
 *      The backend PROXIES the file from R2 and returns it as a same-origin
 *      response with Content-Disposition: attachment — so fetch() has no
 *      CORS issues and the browser never navigates away.
 *   2. Stream the response body, tracking progress via Content-Length.
 *   3. Convert accumulated chunks to a Blob, create an object URL,
 *      and trigger a programmatic <a download> click.
 *   4. Revoke the object URL after a short delay.
 *
 * @param downloadUrl  - relative path like /api/images/download/ceremony/file.jpg
 * @param filename     - the name to save the file as on disk
 * @param onProgress   - optional callback(0–100) for progress bar updates
 */
export async function triggerDownload(
  downloadUrl: string,
  filename: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const url = `${API_BASE}${downloadUrl}`;

  const res = await fetch(url, {
    // same-origin credentials not needed but keeps cookies if any auth added later
    credentials: 'same-origin',
  });

  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }

  // Stream with progress
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

  // All bytes received — build blob and trigger save
  const blob = new Blob(chunks);
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke after browser has had time to start the download
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

export function prefetchImages(urls: string[], max = 12): void {
  urls.slice(0, max).forEach((url) => {
    const img = new Image();
    img.src = `${API_BASE}${url}`;
  });
}
