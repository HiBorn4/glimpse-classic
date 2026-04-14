'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Photo, triggerDownload } from '@/lib/api';

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function Lightbox({ photo, onClose, onPrev, onNext }: LightboxProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 600);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

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

  const isDownloading = status === 'downloading';
  const isDone = status === 'done';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: isMobile ? 'black' : 'rgba(255,255,255,0.9)',
        backdropFilter: isMobile ? 'none' : 'blur(28px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.img
        src={photo.viewing_url}
        alt=""
        style={{
          maxHeight: isMobile ? '88vh' : '90vh',
          maxWidth: isMobile ? '100vw' : '88vw',
          objectFit: 'contain',
          borderRadius: isMobile ? 0 : 14,
          boxShadow: isMobile ? 'none' : '0 28px 72px rgba(0,0,0,0.17)',
        }}
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* ── Download HD — TOP RIGHT ── */}
      <button
        onClick={handleDownload}
        title="Download HD"
        style={{
          position: 'absolute',
          top: isMobile ? 12 : 14,
          right: isMobile ? 56 : 66,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: isMobile ? '7px 14px' : '9px 20px',
          borderRadius: 999,
          background: isDone
            ? 'rgba(16,185,129,0.88)'
            : isDownloading
              ? 'rgba(0,0,0,0.75)'
              : isMobile
                ? 'rgba(255,255,255,0.13)'
                : 'rgba(15,15,15,0.84)',
          backdropFilter: 'blur(14px)',
          color: 'white',
          fontSize: isMobile ? 12 : 13,
          fontWeight: 600,
          border: isMobile ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 22px rgba(0,0,0,0.24)',
          cursor: isDownloading || isDone ? 'default' : 'pointer',
          fontFamily: 'Inter,-apple-system,sans-serif',
          whiteSpace: 'nowrap',
          transition: 'background 0.28s, transform 0.15s',
          zIndex: 60,
          minWidth: 140,
        }}
        onMouseEnter={(e) => {
          if (status === 'idle')
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        {/* Icon */}
        {isDone ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : isDownloading ? (
          /* Circular progress ring */
          <svg width="16" height="16" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 15}`}
              strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
              transform="rotate(-90 18 18)"
              style={{ transition: 'stroke-dashoffset 0.2s ease' }}
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}

        {/* Label */}
        {isDone
          ? 'Saved!'
          : isDownloading
            ? `${progress}%`
            : 'Download HD'
        }
      </button>

      {/* ── Close — top right corner ── */}
      <button
        style={{
          position: 'absolute', top: 14, right: 14,
          width: isMobile ? 36 : 40, height: isMobile ? 36 : 40,
          borderRadius: '50%',
          background: isMobile ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)',
          border: `1px solid ${isMobile ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.07)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 60,
        }}
        onClick={onClose}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={isMobile ? 'white' : '#333'} strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* ── Prev / Next (desktop) ── */}
      {!isMobile && onPrev && (
        <button style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} onClick={(e) => { e.stopPropagation(); onPrev(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      {!isMobile && onNext && (
        <button style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} onClick={(e) => { e.stopPropagation(); onNext(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}

      {/* ── Prev / Next (mobile) ── */}
      {isMobile && onPrev && (
        <button style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} onClick={(e) => { e.stopPropagation(); onPrev(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      {isMobile && onNext && (
        <button style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} onClick={(e) => { e.stopPropagation(); onNext(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}
    </motion.div>
  );
}
