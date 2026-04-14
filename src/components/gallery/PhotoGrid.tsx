'use client';
import { useRef, useEffect, useState, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Photo, triggerDownload } from '@/lib/api';

// ── Download HD button — bottom-right on grid hover ───────────────────────────
function DownloadBtn({ photo }: { photo: Photo }) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status !== 'idle') return;

    setStatus('downloading');
    setProgress(0);

    try {
      await triggerDownload(photo.download_url, photo.filename, (pct) => {
        setProgress(pct);
      });
      setProgress(100);
      setStatus('done');
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 2500);
    } catch {
      setStatus('idle');
      setProgress(0);
    }
  };

  // Determine icon to show
  const isDownloading = status === 'downloading';
  const isDone = status === 'done';

  return (
    <button
      onClick={handleDownload}
      title="Download HD"
      className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100"
      style={{
        background: 'none',
        border: 'none',
        cursor: isDownloading || isDone ? 'default' : 'pointer',
        padding: 0,
        zIndex: 10,
        transition: 'opacity 0.22s ease, transform 0.18s ease',
        transform: 'translateY(3px)',
      }}
      onMouseEnter={(e) => {
        if (status === 'idle')
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(3px) scale(1)';
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        style={{ display: 'block', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.65))' }}
      >
        {/* Background circle — fills as progress bar */}
        <circle cx="17" cy="17" r="16" fill="rgba(0,0,0,0.45)" />

        {/* Progress arc ring when downloading */}
        {isDownloading && (
          <>
            {/* Track */}
            <circle
              cx="17" cy="17" r="14"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Fill arc — strokeDasharray trick */}
            <circle
              cx="17" cy="17" r="14"
              stroke="white"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
              transform="rotate(-90 17 17)"
              style={{ transition: 'stroke-dashoffset 0.2s ease' }}
            />
            {/* Percentage text */}
            <text
              x="17" y="21"
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="700"
              fontFamily="Inter, -apple-system, sans-serif"
            >
              {progress}%
            </text>
          </>
        )}

        {/* Done — green checkmark */}
        {isDone && (
          <>
            <circle cx="17" cy="17" r="16" fill="rgba(16,185,129,0.9)" />
            <polyline
              points="10,17 14.5,21.5 24,12"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Idle — download arrow */}
        {status === 'idle' && (
          <>
            <path
              d="M17 9v10M13 16l4 4.5L21 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 23h12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </button>
  );
}

// ── Spotlight effect ──────────────────────────────────────────────────────────
function SpotlightOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.background = `radial-gradient(circle 80px at ${x}% ${y}%, rgba(255,255,255,0.14) 0%, transparent 70%)`;
      el.style.opacity = '1';
    };
    const onLeave = () => { el.style.opacity = '0'; };

    parent.addEventListener('mousemove', onMove);
    parent.addEventListener('mouseleave', onLeave);
    return () => {
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{ borderRadius: 'inherit', opacity: 0, transition: 'opacity 0.25s ease', zIndex: 2 }}
    />
  );
}

// ── 3D tilt card ─────────────────────────────────────────────────────────────
function TiltCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 260, damping: 24 });
  const my = useSpring(y, { stiffness: 260, damping: 24 });
  const rotateX = useTransform(my, [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(mx, [-0.5, 0.5], ['-5deg', '5deg']);

  return (
    <motion.div
      ref={ref}
      style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileTap={{ scale: 0.975 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Stable lazy image ─────────────────────────────────────────────────────────
const StableImg = memo(function StableImg({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect(); } },
      { rootMargin: '600px' }
    );
    io.observe(img);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) { img.style.opacity = '1'; return; }
    const onLoad = () => { img.style.opacity = '1'; };
    img.addEventListener('load', onLoad);
    return () => img.removeEventListener('load', onLoad);
  }, [inView, src]);

  return (
    <img
      ref={imgRef}
      src={inView ? src : undefined}
      data-src={src}
      alt={alt}
      decoding="async"
      style={{
        display: 'block', width: '100%', opacity: 0,
        transition: 'opacity 0.3s ease',
        willChange: 'opacity', minHeight: 80, backgroundColor: '#f5f5f5',
      }}
    />
  );
});

// ── Masonry photo grid ────────────────────────────────────────────────────────
interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (idx: number) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  return (
    <div className="masonry-grid px-[1px]">
      {photos.map((photo, idx) => (
        <div key={photo.filename} className="masonry-item photo-entry">
          <TiltCard onClick={() => onPhotoClick(idx)}>
            <div className="relative overflow-hidden" style={{ borderRadius: 5 }}>
              <StableImg src={photo.viewing_url} alt={photo.filename} />

              {/* Gradient on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.42) 0%, transparent 45%)',
                  borderRadius: 5,
                  transition: 'opacity 0.22s ease',
                  zIndex: 1,
                }}
              />

              <SpotlightOverlay />
              <DownloadBtn photo={photo} />
            </div>
          </TiltCard>
        </div>
      ))}
    </div>
  );
}
