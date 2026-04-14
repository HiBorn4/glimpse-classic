'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Person } from '@/lib/api';
import { HoneycombThumbnails } from './HoneycombThumbnails';
import { MobileThumbnails } from './MobileThumbnails';

interface ThumbnailPanelProps {
  show: boolean;
  onToggle: () => void;
  people: Person[];
  selected: number[];
  onSelect: (ids: number[]) => void;
  onFindMe: () => void;
}

export function ThumbnailPanel({
  show, onToggle, people, selected, onSelect, onFindMe,
}: ThumbnailPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="thumbpanel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
          className="border-b border-gray-100"
        >
          <div style={{ position: 'relative' }}>
            {/* ── Close button top-right ── */}
            <button
              onClick={onToggle}
              title="Hide people"
              style={{
                position: 'absolute', top: 10, right: 14, zIndex: 20,
                width: 28, height: 28, borderRadius: '50%',
                background: '#f5f5f5', border: '1px solid #e8e8e8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>

            {/* ── Device-specific thumbnail layout ── */}
            {/* paddingTop/Bottom increased by 30%: 12→16, 16→21 */}
            <div style={{ paddingTop: 16, paddingBottom: 21 }}>
              {isMobile ? (
                <MobileThumbnails
                  people={people}
                  selected={selected}
                  onSelect={onSelect}
                  onFindMe={onFindMe}
                />
              ) : (
                <>
                  <HoneycombThumbnails
                    people={people}
                    selected={selected}
                    onSelect={onSelect}
                  />
                  <div className="text-center" style={{ marginTop: 21 }}>
                    <button
                      onClick={onFindMe}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 20px', borderRadius: 999,
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        border: '1px solid #e8e8e8', color: '#555',
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        fontFamily: 'Inter,-apple-system,sans-serif',
                        transition: 'transform 0.18s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      Find photos of me
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
