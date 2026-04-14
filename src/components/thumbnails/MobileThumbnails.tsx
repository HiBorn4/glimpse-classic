'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Person, thumbnailUrl } from '@/lib/api';

const INITIAL_SHOW = 15;
const LOAD_MORE = 5;

function BlobRing({ size }: { size: number }) {
  const borderWidth = Math.round(size * 0.07);
  const outerSize = size + borderWidth * 2;

  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      width: outerSize,
      height: outerSize,
      marginTop: -outerSize / 2,
      marginLeft: -outerSize / 2,
      borderRadius: '50%',
      zIndex: 0,
      background: `conic-gradient(
        #fffbe0 0deg,
        #f5d040 30deg,
        #ffffff 60deg,
        #fce060 90deg,
        #fff5a0 120deg,
        #f0c020 150deg,
        #ffffff 180deg,
        #fce040 210deg,
        #fffbe0 240deg,
        #f5d040 270deg,
        #ffffff 300deg,
        #fce060 330deg,
        #fffbe0 360deg
      )`,
      animation: 'mobileBlobSpin 4s linear infinite',
      WebkitMaskImage: 'radial-gradient(circle, transparent ' + (size / 2 - 1) + 'px, black ' + (size / 2) + 'px)',
      maskImage: 'radial-gradient(circle, transparent ' + (size / 2 - 1) + 'px, black ' + (size / 2) + 'px)',
    }} />
  );
}

interface MobileThumbnailsProps {
  people: Person[];
  selected: number[];
  onSelect: (ids: number[]) => void;
  onFindMe: () => void;
}

export function MobileThumbnails({ people, selected, onSelect, onFindMe }: MobileThumbnailsProps) {
  const [visible, setVisible] = useState(INITIAL_SHOW);
  const shown = people.slice(0, visible);
  const hasMore = visible < people.length;
  const SIZE = 50;

  const toggle = (id: number) =>
    onSelect(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div style={{ padding: '10px 0 4px' }}>
      <style>{`
        @keyframes mobileBlobSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 14px', justifyContent: 'center' }}>
        {shown.map((person) => {
          const isSel = selected.includes(person.person_id);
          return (
            <div
              key={person.person_id}
              style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => toggle(person.person_id)}
            >
              {isSel && <BlobRing size={SIZE} />}

              <div style={{
                position: 'relative',
                zIndex: 1,
                width: SIZE,
                height: SIZE,
                borderRadius: '50%',
                overflow: 'hidden',
                border: isSel ? '2.5px solid #f5d040' : '2.5px solid #ffffff',
                boxShadow: isSel
                  ? '0 0 6px rgba(245,208,64,0.6)'
                  : '0 1px 4px rgba(0,0,0,0.1)',
                transform: isSel ? 'scale(1.07)' : 'scale(1)',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              }}>
                <img
                  src={thumbnailUrl(person.person_id)}
                  alt="Guest"
                  width={SIZE} height={SIZE}
                  loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    el.parentElement!.style.background = 'linear-gradient(135deg,#e8ddd0,#c8b99a)';
                    el.parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>';
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center" style={{ marginTop: 12 }}
          >
            <button
              onClick={() => setVisible((v) => Math.min(v + LOAD_MORE, people.length))}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 16px', borderRadius: 999,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid #e0e0e0', background: 'white', color: '#666',
                fontFamily: 'Inter,-apple-system,sans-serif',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Show {Math.min(LOAD_MORE, people.length - visible)} more
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center" style={{ marginTop: 10 }}>
        <button onClick={onFindMe} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 999,
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          border: '1px solid #e8e8e8', color: '#666', background: 'white',
          fontFamily: 'Inter,-apple-system,sans-serif',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Find photos of me
        </button>
      </div>
    </div>
  );
}
