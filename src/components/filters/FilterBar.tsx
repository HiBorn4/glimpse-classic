'use client';
import { useState, useEffect, useRef } from 'react';
import { EventPill } from './EventPill';
import { OrientationSelector, SmoothSwitch } from './FilterControls';

interface FilterBarProps {
  ceremonies: string[];
  activeCeremony: string;
  onCeremony: (c: string) => void;
  orientation: string;
  onOrientation: (v: string) => void;
  selectedPeople: number[];
  exactOnly: boolean;
  setExactOnly: (v: boolean) => void;
  onlyMe: boolean;
  setOnlyMe: (v: boolean) => void;
  totalPhotos: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  showThumbnails: boolean;
  onToggleThumbnails: () => void;
  onClear: () => void;
}

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 32 32" fill="none"
      stroke={active ? 'white' : '#666'} strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: active ? 'rotate(-45deg)' : 'none' }}
    >
      <path
        style={{
          transition: 'stroke-dasharray 0.2s, stroke-dashoffset 0.2s',
          strokeDasharray: active ? '20 300' : '12 63',
          strokeDashoffset: active ? '-32.42px' : '0',
        }}
        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
      />
      <path d="M7 16 27 16" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <circle cx="18" cy="8" r="3"/>
      <path d="M21 21v-1.5a3 3 0 0 0-2-2.8"/>
    </svg>
  );
}

const BAR_STYLES = `
  .fb-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    background: white;
    border-bottom: 1px solid #f0f0f0;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    /* single row, never wrap */
    flex-wrap: nowrap;
    min-height: 48px;
  }
  .fb-row::-webkit-scrollbar { display: none; }

  /* Mobile: stack rows vertically */
  @media (max-width: 600px) {
    .fb-row {
      flex-wrap: wrap;
      min-height: unset;
      gap: 6px;
      padding: 8px 10px;
    }
    .fb-row > * {
      flex-shrink: 0;
    }
    .fb-mobile-break {
      width: 100%;
      height: 0;
      order: 10;
    }
    .fb-right-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      width: 100%;
      padding: 2px 0 4px;
    }
  }

  /* Collapsible filter section — pure CSS height transition */
  .fb-filters-wrap {
    overflow: hidden;
    transition: max-height 0.18s cubic-bezier(0.4,0,0.2,1),
                opacity 0.15s ease;
    max-height: 0;
    opacity: 0;
  }
  .fb-filters-wrap.open {
    max-height: 120px;
    opacity: 1;
  }
  .fb-filters-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px 8px;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .fb-filters-inner::-webkit-scrollbar { display: none; }

  @media (max-width: 600px) {
    .fb-filters-inner {
      flex-wrap: wrap;
      overflow-x: hidden;
      gap: 6px;
      padding: 0 10px 10px;
    }
  }

  .fb-divider {
    width: 1px;
    height: 18px;
    background: #ececec;
    flex-shrink: 0;
  }

  .fb-icon-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid #e4e4e4;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.13s ease, border-color 0.13s ease, transform 0.1s ease;
    will-change: transform;
  }
  .fb-icon-btn:active { transform: scale(0.92); }

  .fb-count {
    font-size: 11px;
    color: #ccc;
    font-family: Inter,-apple-system,sans-serif;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .fb-people-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid #e8e0ff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    background: #faf8ff;
    color: #7B2FF7;
    font-family: Inter,-apple-system,sans-serif;
    flex-shrink: 0;
    white-space: nowrap;
    transition: background 0.13s ease, color 0.13s ease, border-color 0.13s ease;
  }
  .fb-people-btn:hover {
    background: linear-gradient(135deg,#7B2FF7,#E040FB);
    color: white;
    border-color: transparent;
  }

  .fb-clear-btn {
    font-size: 11px;
    color: #bbb;
    font-family: Inter,-apple-system,sans-serif;
    text-decoration: underline;
    text-underline-offset: 3px;
    background: none;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    white-space: nowrap;
    transition: color 0.13s ease;
  }
  .fb-clear-btn:hover { color: #7B2FF7; }

  .fb-mode-label {
    font-size: 10px;
    color: #ccc;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: Inter,-apple-system,sans-serif;
    flex-shrink: 0;
    white-space: nowrap;
  }
`;

export function FilterBar({
  ceremonies, activeCeremony, onCeremony,
  orientation, onOrientation,
  selectedPeople, exactOnly, setExactOnly, onlyMe, setOnlyMe,
  totalPhotos,
  showFilters, onToggleFilters,
  showThumbnails, onToggleThumbnails,
  onClear,
}: FilterBarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const hasActiveFilters = selectedPeople.length > 0 || activeCeremony || orientation;

  return (
    <>
      <style>{BAR_STYLES}</style>
      <div style={{ background: 'white' }}>

        {/* ── ROW 1: Ceremony pills ── */}
        <div className="fb-row" style={{ borderBottom: isMobile ? '1px solid #f5f5f5' : '1px solid #f0f0f0' }}>
          {/* Ceremony pills */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <EventPill ceremonies={ceremonies} active={activeCeremony} onSelect={onCeremony} />
          </div>

          {/* On desktop: all controls inline */}
          {!isMobile && (
            <>
              {/* Photo count */}
              <span className="fb-count">{totalPhotos.toLocaleString()} photos</span>

              <div className="fb-divider" />
              <OrientationSelector value={orientation} onChange={onOrientation} />

              {selectedPeople.length === 1 && (
                <>
                  <div className="fb-divider" />
                  <span className="fb-mode-label">MODE</span>
                  <SmoothSwitch checked={onlyMe} onChange={setOnlyMe} labelLeft="Group" labelRight="Solo" selectedCount={1} />
                </>
              )}
              {selectedPeople.length >= 2 && (
                <>
                  <div className="fb-divider" />
                  <span className="fb-mode-label">MODE</span>
                  <SmoothSwitch checked={exactOnly} onChange={setExactOnly} labelLeft="Group" labelRight="Solo" selectedCount={selectedPeople.length} />
                </>
              )}

              {hasActiveFilters && (
                <>
                  <div className="fb-divider" />
                  <button onClick={onClear} className="fb-clear-btn">Clear all</button>
                </>
              )}

              <button
                onClick={onToggleThumbnails}
                className="fb-icon-btn"
                style={{
                  background: showThumbnails ? 'linear-gradient(135deg,#7B2FF7,#FF4081)' : '#f4f4f4',
                  borderColor: showThumbnails ? 'transparent' : '#e4e4e4',
                  color: showThumbnails ? 'white' : '#666',
                  boxShadow: showThumbnails ? '0 2px 8px rgba(123,47,247,0.30)' : 'none',
                }}
                title="Toggle people"
              >
                <PeopleIcon />
              </button>

              <button
                onClick={onToggleFilters}
                className="fb-icon-btn"
                style={{
                  background: showFilters ? '#1a1a1a' : '#f4f4f4',
                  borderColor: showFilters ? '#1a1a1a' : '#e4e4e4',
                }}
                title={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <FilterIcon active={showFilters} />
              </button>
            </>
          )}

          {/* On mobile: icon buttons stay in row 1, right-aligned */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span className="fb-count">{totalPhotos.toLocaleString()}</span>
              <button
                onClick={onToggleThumbnails}
                className="fb-icon-btn"
                style={{
                  background: showThumbnails ? 'linear-gradient(135deg,#7B2FF7,#FF4081)' : '#f4f4f4',
                  borderColor: showThumbnails ? 'transparent' : '#e4e4e4',
                  color: showThumbnails ? 'white' : '#666',
                  boxShadow: showThumbnails ? '0 2px 8px rgba(123,47,247,0.30)' : 'none',
                }}
                title="Toggle people"
              >
                <PeopleIcon />
              </button>
              <button
                onClick={onToggleFilters}
                className="fb-icon-btn"
                style={{
                  background: showFilters ? '#1a1a1a' : '#f4f4f4',
                  borderColor: showFilters ? '#1a1a1a' : '#e4e4e4',
                }}
                title={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <FilterIcon active={showFilters} />
              </button>
            </div>
          )}
        </div>

        {/* ── ROW 2 (mobile only): orientation + mode + clear ── */}
        {isMobile && (
          <div
            ref={filtersRef}
            className={`fb-filters-wrap${showFilters ? ' open' : ''}`}
          >
            <div className="fb-filters-inner">
              <OrientationSelector value={orientation} onChange={onOrientation} />

              {selectedPeople.length === 1 && (
                <>
                  <div className="fb-divider" />
                  <span className="fb-mode-label">MODE</span>
                  <SmoothSwitch checked={onlyMe} onChange={setOnlyMe} labelLeft="Group" labelRight="Solo" selectedCount={1} />
                </>
              )}
              {selectedPeople.length >= 2 && (
                <>
                  <div className="fb-divider" />
                  <span className="fb-mode-label">MODE</span>
                  <SmoothSwitch checked={exactOnly} onChange={setExactOnly} labelLeft="Group" labelRight="Solo" selectedCount={selectedPeople.length} />
                </>
              )}

              {hasActiveFilters && (
                <>
                  <div className="fb-divider" />
                  <button onClick={onClear} className="fb-clear-btn">Clear all</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
