'use client';
import { LayoutGrid, Monitor, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ORIENTATION SELECTOR — teal/purple family, glow contained inside pill
// ─────────────────────────────────────────────────────────────────────────────
type OrTab = { id: string; icon: LucideIcon; label: string; bg: string; glowColor: string };

const ORIENTATION_TABS: OrTab[] = [
  { id: '',          icon: LayoutGrid, label: 'All',       bg: 'linear-gradient(135deg,#94a3b8,#475569)', glowColor: 'rgba(100,116,139,0.45)' },
  { id: 'landscape', icon: Monitor,    label: 'Landscape', bg: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glowColor: 'rgba(20,184,166,0.50)'  },
  { id: 'portrait',  icon: Smartphone, label: 'Portrait',  bg: 'linear-gradient(135deg,#c084fc,#7e22ce)', glowColor: 'rgba(168,85,247,0.50)'  },
];

const SHARED_STYLES = `
  /* ── Orientation ── */
  .or-wrap {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #f5f5f5;
    border-radius: 999px;
    padding: 3px;
    flex-shrink: 0;
  }
  .or-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px 4px 8px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    font-family: Inter, -apple-system, sans-serif;
    white-space: nowrap;
    position: relative;
    overflow: hidden;          /* glow clipped inside */
    transition: background 0.18s ease, box-shadow 0.18s ease,
                color 0.15s ease, transform 0.12s ease;
    will-change: transform;
    user-select: none;
  }
  .or-btn:active { transform: scale(0.93); }
  .or-inactive { background: transparent; color: #888; }
  .or-inactive:hover { background: #ebebeb; color: #444; }
  .or-active { color: white; }
  .or-glow {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.22) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.25s ease;
  }
  .or-active .or-glow { opacity: 1; }
  .or-icon {
    display: flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
    position: relative; z-index: 1; transition: background 0.13s ease;
  }
  .or-label { position: relative; z-index: 1; }
  .or-inactive .or-icon { background: #eaeaea; }
  .or-inactive:hover .or-icon { background: #e0e0e0; }
  .or-active .or-icon { background: rgba(255,255,255,0.22); }

  /* ── Mode Switch ── */
  .sw-wrap {
    display: inline-flex;
    align-items: center;
    background: #f4f4f4;
    border-radius: 999px;
    padding: 3px;
    flex-shrink: 0;
    user-select: none;
    font-family: Inter, -apple-system, sans-serif;
  }
  .sw-opt {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
    position: relative;
    overflow: hidden;          /* glow clipped inside */
    transition: background 0.18s ease, box-shadow 0.18s ease,
                color 0.15s ease, transform 0.12s ease;
    will-change: transform;
  }
  .sw-opt:active { transform: scale(0.93); }
  .sw-on  { font-weight: 600; color: white; }
  .sw-off { font-weight: 400; color: #aaa; background: transparent; }
  .sw-glow {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.22) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.25s ease;
  }
  .sw-on .sw-glow { opacity: 1; }
  .sw-ico { position: relative; z-index: 1; display: flex; align-items: center; }
  .sw-lbl { position: relative; z-index: 1; }
`;

export function OrientationSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <style>{SHARED_STYLES}</style>
      <div className="or-wrap">
        {ORIENTATION_TABS.map(({ id, icon: Icon, label, bg, glowColor }) => {
          const active = value === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`or-btn ${active ? 'or-active' : 'or-inactive'}`}
              style={active ? {
                background: bg,
                boxShadow: `0 0 10px 2px ${glowColor}, 0 2px 6px rgba(0,0,0,0.12)`,
              } : undefined}
            >
              <span className="or-glow" />
              <span className="or-icon">
                <Icon size={11} color={active ? 'white' : '#999'} strokeWidth={2.2} />
              </span>
              <span className="or-label">{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMOOTH SWITCH (Mode) — amber for Group, rose for Solo
// ─────────────────────────────────────────────────────────────────────────────
interface SmoothSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelLeft: string;
  labelRight: string;
  selectedCount?: number;
}

const MODE = {
  group: { bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', glow: 'rgba(245,158,11,0.50)' },
  solo:  { bg: 'linear-gradient(135deg,#fb7185,#e11d48)', glow: 'rgba(244,63,94,0.48)'  },
};

function PersonSoloIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'white' : '#ccc'} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}
function PersonGroupIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'white' : '#ccc'} strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 21v-1a7 7 0 0 1 14 0v1" />
      <circle cx="17" cy="7" r="3" />
      <path d="M21 20v-1a6 6 0 0 0-4.5-5.8" />
    </svg>
  );
}

export function SmoothSwitch({ checked, onChange, labelLeft, labelRight, selectedCount = 1 }: SmoothSwitchProps) {
  const isMulti = selectedCount >= 2;
  return (
    <>
      <style>{SHARED_STYLES}</style>
      <div className="sw-wrap">
        {/* Group / Left */}
        <button
          onClick={() => onChange(false)}
          className={`sw-opt ${!checked ? 'sw-on' : 'sw-off'}`}
          style={!checked ? {
            background: MODE.group.bg,
            boxShadow: `0 0 10px 2px ${MODE.group.glow}, 0 2px 6px rgba(0,0,0,0.12)`,
          } : undefined}
        >
          <span className="sw-glow" />
          <span className="sw-ico">
            {isMulti ? <PersonGroupIcon active={!checked} /> : <PersonSoloIcon active={!checked} />}
          </span>
          <span className="sw-lbl">{labelLeft}</span>
        </button>

        {/* Solo / Right */}
        <button
          onClick={() => onChange(true)}
          className={`sw-opt ${checked ? 'sw-on' : 'sw-off'}`}
          style={checked ? {
            background: MODE.solo.bg,
            boxShadow: `0 0 10px 2px ${MODE.solo.glow}, 0 2px 6px rgba(0,0,0,0.12)`,
          } : undefined}
        >
          <span className="sw-glow" />
          <span className="sw-ico"><PersonSoloIcon active={checked} /></span>
          <span className="sw-lbl">{labelRight}</span>
        </button>
      </div>
    </>
  );
}
