'use client';
import { useState, useEffect, useRef } from 'react';


interface HeroSectionProps {
  onScrollDown: () => void;
}

export function HeroSection({ onScrollDown }: HeroSectionProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) return; // no parallax on phone — saves battery + prevents jitter
    const onMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setMouse({
        x: (e.clientX - r.left) / r.width - 0.5,
        y: (e.clientY - r.top) / r.height - 0.5,
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMobile]);

  const HERO_IMAGE    = process.env.NEXT_PUBLIC_HERO_IMAGE ?? '';
  const COUPLE_NAME_1 = process.env.NEXT_PUBLIC_COUPLE_NAME_1 ?? 'Name 1';
  const COUPLE_NAME_2 = process.env.NEXT_PUBLIC_COUPLE_NAME_2 ?? 'Name 2';
  const EVENT_DATE    = process.env.NEXT_PUBLIC_EVENT_DATE ?? '';
  const EVENT_LOCATION = process.env.NEXT_PUBLIC_EVENT_LOCATION ?? '';

  return (
    <div
      ref={heroRef}
      className="relative w-full overflow-hidden flex flex-col items-center justify-center"
      style={{
        height: isMobile ? '72vh' : '100vh',
        minHeight: isMobile ? 420 : 600,
        perspective: isMobile ? 'none' : '1200px',
      }}
    >
      {/* ── Background ── */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          transform: isMobile
            ? 'none'
            : `rotateX(${mouse.y * -4}deg) rotateY(${mouse.x * 4}deg) scale(1.12)`,
          transition: 'transform 0.12s cubic-bezier(0.23,1,0.32,1)',
          willChange: 'transform',
        }}
      >
        <img
          src={HERO_IMAGE}
          alt={`${COUPLE_NAME_1} & ${COUPLE_NAME_2}`}
          className="w-full h-full object-cover object-top"
          fetchPriority="high"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=2400&auto=format&fit=crop&q=80';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isMobile
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 35%, rgba(0,0,0,0.75) 100%)',
          }}
        />
      </div>

      {/* ── Title ── */}
      <div
        className="relative z-10 text-center px-6 select-none"
        style={{
          transform: isMobile
            ? 'none'
            : `translateX(${mouse.x * -22}px) translateY(${mouse.y * -12}px)`,
          transition: 'transform 0.18s cubic-bezier(0.23,1,0.32,1)',
          willChange: 'transform',
        }}
      >
        {/* Together Forever */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px" style={{ width: isMobile ? 32 : 64, background: 'rgba(255,255,255,0.38)' }} />
          <span
            style={{
              fontSize: isMobile ? 9 : 10,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Together Forever
          </span>
          <div className="h-px" style={{ width: isMobile ? 32 : 64, background: 'rgba(255,255,255,0.38)' }} />
        </div>

        {/* Names */}
        <h1
          className="text-white leading-none"
          style={{
            fontFamily: "'Georgia','Times New Roman',serif",
            fontSize: isMobile ? 'clamp(2.6rem,11vw,3.8rem)' : 'clamp(3.5rem,9vw,7.5rem)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            textShadow: '0 4px 48px rgba(0,0,0,0.55)',
            marginBottom: isMobile ? 12 : 16,
          }}
        >
          {COUPLE_NAME_1}
          <span style={{ fontStyle: 'italic', fontWeight: 300, opacity: 0.52, margin: isMobile ? '0 12px' : '0 32px' }}>
            &amp;
          </span>
          {COUPLE_NAME_2}
        </h1>

        {/* Ornament */}
        <div className="flex justify-center" style={{ margin: isMobile ? '10px 0' : '20px 0' }}>
          <svg width={isMobile ? 56 : 80} height={isMobile ? 18 : 24} viewBox="0 0 80 24" fill="none">
            <path d="M0 12 Q20 2 40 12 Q60 22 80 12" stroke="rgba(255,255,255,0.28)" strokeWidth="1" fill="none" />
            <circle cx="40" cy="12" r="3" fill="rgba(255,255,255,0.52)" />
            <circle cx="14" cy="12" r="2" fill="rgba(255,255,255,0.26)" />
            <circle cx="66" cy="12" r="2" fill="rgba(255,255,255,0.26)" />
          </svg>
        </div>

        {/* Date */}
        <p style={{
          letterSpacing: '0.32em', fontSize: isMobile ? 11 : 14,
          textTransform: 'uppercase', fontWeight: 300,
          color: 'rgba(255,255,255,0.75)', textShadow: '0 2px 20px rgba(0,0,0,0.45)',
        }}>
          {EVENT_DATE}
        </p>
        {EVENT_LOCATION && (
        <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginTop: 6 }}>
          {EVENT_LOCATION}
        </p>
        )}
      </div>

      {/* ── Scroll CTA ── */}
      <button
        onClick={onScrollDown}
        className="absolute group"
        style={{ bottom: isMobile ? 20 : 32, left: '50%', transform: 'translateX(-50%)' }}
        aria-label="Scroll to gallery"
      >
        <div className="flex flex-col items-center gap-2">
          <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)' }}>
            {isMobile ? '' : 'Explore Gallery'}
          </span>
          <div
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'heroBounce 2s infinite',
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </div>
      </button>

      <style>{`@keyframes heroBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}`}</style>
    </div>
  );
}
