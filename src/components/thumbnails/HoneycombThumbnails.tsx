'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Person, thumbnailUrl } from '@/lib/api';

const SIZE = 64;
const GAP = 6;
const CELL_W = SIZE + GAP;
const MIN_COLS = 10;

function buildHoneycombRows(items: Person[], cols: number): Person[][] {
  const rows: Person[][] = [];
  let idx = 0;
  for (let r = 0; idx < items.length; r++) {
    const size = r % 2 === 0 ? cols : cols + 1;
    rows.push(items.slice(idx, idx + size));
    idx += size;
  }
  return rows;
}

function BlobRing({ size }: { size: number }) {
  // Outer radius reduced 30% → border is 7% of size
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
      // Gold+white conic gradient ring — no black anywhere
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
      animation: 'hcBlobSpin 4s linear infinite',
      // Mask: show only the ring border, punch out the center
      WebkitMaskImage: 'radial-gradient(circle, transparent ' + (size / 2 - 1) + 'px, black ' + (size / 2) + 'px)',
      maskImage: 'radial-gradient(circle, transparent ' + (size / 2 - 1) + 'px, black ' + (size / 2) + 'px)',
    }} />
  );
}

function HoneycombCell({
  person, isSelected, onToggle,
}: { person: Person; isSelected: boolean; onToggle: () => void }) {
  const rawLabel = person.name?.trim() || '';
  const label = /^Person_\d+$/i.test(rawLabel) ? '' : rawLabel;

  return (
    <div
      className="hc-cell"
      style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div className="hc-bubble">
        {isSelected && <BlobRing size={SIZE} />}

        {/* Avatar */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          border: isSelected ? '2.5px solid #f5d040' : '2.5px solid #ffffff',
          boxShadow: isSelected
            ? '0 0 6px rgba(245,208,64,0.6)'
            : '0 2px 8px rgba(0,0,0,0.11)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          <img
            src={thumbnailUrl(person)}
            alt={label || 'Guest'}
            width={SIZE} height={SIZE}
            loading="lazy" decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement!.style.background = 'linear-gradient(135deg,#e8ddd0,#c8b99a)';
              el.parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px">👤</div>';
            }}
          />
        </div>

        {label && (
          <div className="hc-tooltip" aria-hidden>
            {label}
            <div className="hc-tooltip-arrow" />
          </div>
        )}
      </div>
    </div>
  );
}

interface HoneycombThumbnailsProps {
  people: Person[];
  selected: number[];
  onSelect: (ids: number[]) => void;
}

export function HoneycombThumbnails({ people, selected, onSelect }: HoneycombThumbnailsProps) {
  const [cols, setCols] = useState(MIN_COLS);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selectedSet = useRef(new Set(selected));
  selectedSet.current = new Set(selected);

  useEffect(() => {
    const calc = (w: number) => setCols(Math.max(MIN_COLS, Math.floor(w / CELL_W) - 1));
    if (wrapRef.current) calc(wrapRef.current.clientWidth);
    const ro = new ResizeObserver(([e]) => calc(e.contentRect.width));
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const toggle = useCallback((id: number) => {
    onSelect(
      selectedSet.current.has(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }, [selected, onSelect]);

  const rows = buildHoneycombRows(people, cols);

  return (
    <>
      <style>{`
        @keyframes hcBlobSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .hc-bubble {
          position: absolute;
          width: ${SIZE}px; height: ${SIZE}px;
          top: 50%; left: 50%;
          transform: translate(-50%,-50%) scale(1);
          transition: transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 50%;
          will-change: transform;
        }
        .hc-cell:hover .hc-bubble {
          transform: translate(-50%,-50%) scale(1.65);
          transition: transform 0.5s cubic-bezier(0.34, 1.9, 0.64, 1);
        }
        .hc-cell { z-index: 1; }
        .hc-cell:hover { z-index: 50; }
        .hc-tooltip {
          position: absolute; bottom: 122%; left: 50%;
          transform: translateX(-50%) translateY(10px) scale(0.72);
          background: rgba(12,12,12,0.93);
          color: white; font-size: 11px; font-weight: 600;
          padding: 4px 13px; border-radius: 20px;
          white-space: nowrap; pointer-events: none; z-index: 200;
          font-family: Inter,-apple-system,sans-serif;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .hc-cell:hover .hc-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
        .hc-tooltip-arrow {
          position: absolute; top: 100%; left: 50%;
          transform: translateX(-50%);
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid rgba(12,12,12,0.93);
        }
      `}</style>

      <div ref={wrapRef} className="honeycomb-wrap">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: GAP * 0.38 }}>
          {rows.map((rowPeople, rowIdx) => {
            const isOffset = rowIdx % 2 === 1;
            return (
              <div key={rowIdx} style={{ display: 'flex', gap: GAP, marginLeft: isOffset ? CELL_W / 2 : 0 }}>
                {rowPeople.map((person) => (
                  <HoneycombCell
                    key={person.person_id}
                    person={person}
                    isSelected={selectedSet.current.has(person.person_id)}
                    onToggle={() => toggle(person.person_id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
