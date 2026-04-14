'use client';
import { useMemo } from 'react';
import {
  Star, Music, Sparkles, Heart, UtensilsCrossed, Flame,
  PartyPopper, Sun, Moon, Camera, Flower2, Crown, Gift,
  Coffee, Wine, Cake, Diamond, Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EventPillProps {
  ceremonies: string[];
  active: string;
  onSelect: (c: string) => void;
}

type CeremonyMeta = {
  label: string;
  icon: LucideIcon;
  bg: string;          // solid active background
  glowColor: string;   // for box-shadow glow
  iconBg: string;      // small icon badge color
};

const CEREMONY_MAP: Record<string, CeremonyMeta> = {
  all:         { label: 'All',         icon: Star,            bg: '#64748b', glowColor: 'rgba(100,116,139,0.5)',  iconBg: 'rgba(255,255,255,0.2)' },
  wedding:     { label: 'Vows',        icon: Heart,           bg: 'linear-gradient(135deg,#fb7185,#e11d48)', glowColor: 'rgba(244,63,94,0.45)',   iconBg: 'rgba(255,255,255,0.25)' },
  reception:   { label: 'Soirée',      icon: Wine,            bg: 'linear-gradient(135deg,#c084fc,#7c3aed)', glowColor: 'rgba(168,85,247,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  ceremony:    { label: 'Ceremony',    icon: Crown,           bg: 'linear-gradient(135deg,#fbbf24,#d97706)', glowColor: 'rgba(245,158,11,0.5)',   iconBg: 'rgba(255,255,255,0.2)' },
  cocktail:    { label: 'Cocktails',   icon: Wine,            bg: 'linear-gradient(135deg,#f472b6,#db2777)', glowColor: 'rgba(236,72,153,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  dinner:      { label: 'Feast',       icon: UtensilsCrossed, bg: 'linear-gradient(135deg,#fb923c,#ea580c)', glowColor: 'rgba(249,115,22,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  dance:       { label: 'Dancing',     icon: Music,           bg: 'linear-gradient(135deg,#a78bfa,#7c3aed)', glowColor: 'rgba(139,92,246,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  mehendi:     { label: 'Mehndi',      icon: Flower2,         bg: 'linear-gradient(135deg,#4ade80,#16a34a)', glowColor: 'rgba(34,197,94,0.45)',   iconBg: 'rgba(255,255,255,0.2)' },
  haldi:       { label: 'Haldi',       icon: Sun,             bg: 'linear-gradient(135deg,#fde047,#ca8a04)', glowColor: 'rgba(234,179,8,0.55)',   iconBg: 'rgba(255,255,255,0.2)' },
  sangeet:     { label: 'Sangeet',     icon: Music,           bg: 'linear-gradient(135deg,#e879f9,#c026d3)', glowColor: 'rgba(217,70,239,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  engagement:  { label: 'Engaged',     icon: Diamond,         bg: 'linear-gradient(135deg,#38bdf8,#0284c7)', glowColor: 'rgba(14,165,233,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  baraat:      { label: 'Baraat',      icon: PartyPopper,     bg: 'linear-gradient(135deg,#f87171,#dc2626)', glowColor: 'rgba(239,68,68,0.45)',   iconBg: 'rgba(255,255,255,0.2)' },
  pheras:      { label: 'Pheras',      icon: Flame,           bg: 'linear-gradient(135deg,#fb923c,#c2410c)', glowColor: 'rgba(249,115,22,0.5)',   iconBg: 'rgba(255,255,255,0.2)' },
  birthday:    { label: 'Celebration', icon: Cake,            bg: 'linear-gradient(135deg,#f472b6,#be185d)', glowColor: 'rgba(236,72,153,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  anniversary: { label: 'Anniversary', icon: Sparkles,        bg: 'linear-gradient(135deg,#818cf8,#4338ca)', glowColor: 'rgba(99,102,241,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  brunch:      { label: 'Brunch',      icon: Coffee,          bg: 'linear-gradient(135deg,#fbbf24,#b45309)', glowColor: 'rgba(217,119,6,0.45)',   iconBg: 'rgba(255,255,255,0.2)' },
  lunch:       { label: 'Luncheon',    icon: UtensilsCrossed, bg: 'linear-gradient(135deg,#a3e635,#4d7c0f)', glowColor: 'rgba(132,204,22,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  party:       { label: 'Festivities', icon: PartyPopper,     bg: 'linear-gradient(135deg,#a78bfa,#5b21b6)', glowColor: 'rgba(124,58,237,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  night:       { label: 'Night',       icon: Moon,            bg: 'linear-gradient(135deg,#94a3b8,#1e293b)', glowColor: 'rgba(71,85,105,0.5)',    iconBg: 'rgba(255,255,255,0.18)' },
  portrait:    { label: 'Portraits',   icon: Camera,          bg: 'linear-gradient(135deg,#2dd4bf,#0f766e)', glowColor: 'rgba(20,184,166,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
  gift:        { label: 'Gifts',       icon: Gift,            bg: 'linear-gradient(135deg,#fb7185,#e11d48)', glowColor: 'rgba(251,113,133,0.45)', iconBg: 'rgba(255,255,255,0.2)' },
  ritual:      { label: 'Ritual',      icon: Wand2,           bg: 'linear-gradient(135deg,#c084fc,#6b21a8)', glowColor: 'rgba(147,51,234,0.45)',  iconBg: 'rgba(255,255,255,0.2)' },
};

function getCeremonyMeta(slug: string): CeremonyMeta {
  if (!slug) return CEREMONY_MAP['all'];
  const key = slug.toLowerCase();
  return CEREMONY_MAP[key] ?? {
    label: slug.charAt(0).toUpperCase() + slug.slice(1),
    icon: Sparkles,
    bg: '#6b7280',
    glowColor: 'rgba(107,114,128,0.4)',
    iconBg: 'rgba(255,255,255,0.2)',
  };
}

const STYLES = `
  .ep-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ep-wrap::-webkit-scrollbar { display: none; }

  .ep-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px 5px 8px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    font-family: Inter, -apple-system, sans-serif;
    white-space: nowrap;
    transition: background 0.18s ease, box-shadow 0.18s ease,
                color 0.15s ease, transform 0.12s ease;
    will-change: transform;
    user-select: none;
    /* CRITICAL: clip glow inside the pill */
    position: relative;
    overflow: hidden;
  }
  .ep-pill:active { transform: scale(0.95); }

  .ep-inactive {
    background: transparent;
    color: #888;
  }
  .ep-inactive:hover {
    background: #f0f0f0;
    color: #444;
  }
  .ep-active { color: white; }

  /* Glow layer — absolutely positioned INSIDE the pill (overflow:hidden clips it) */
  .ep-glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .ep-active .ep-glow { opacity: 1; }

  .ep-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    flex-shrink: 0;
    position: relative; /* above glow layer */
    z-index: 1;
    transition: background 0.15s ease;
  }
  .ep-label { position: relative; z-index: 1; }
  .ep-inactive .ep-icon { background: #f0f0f0; }
  .ep-inactive:hover .ep-icon { background: #e4e4e4; }
  .ep-active .ep-icon { background: rgba(255,255,255,0.22); }
`;

export function EventPill({ ceremonies, active, onSelect }: EventPillProps) {
  const items = useMemo(
    () => ['', ...ceremonies].map((slug) => ({ slug, ...getCeremonyMeta(slug) })),
    [ceremonies],
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="ep-wrap">
        {items.map(({ slug, label, icon: Icon, bg, glowColor }) => {
          const isActive = active === slug;
          return (
            <button
              key={slug}
              onClick={() => onSelect(slug)}
              className={`ep-pill ${isActive ? 'ep-active' : 'ep-inactive'}`}
              style={isActive ? {
                background: bg,
                // Soft outer glow via box-shadow only — no overflow leak
                boxShadow: `0 0 12px 2px ${glowColor}, 0 2px 8px rgba(0,0,0,0.15)`,
              } : undefined}
            >
              {/* Inner radial glow, clipped by overflow:hidden */}
              <span
                className="ep-glow"
                style={isActive ? {
                  background: `radial-gradient(ellipse at center, rgba(255,255,255,0.22) 0%, transparent 70%)`,
                } : undefined}
              />
              <span className="ep-icon">
                <Icon size={12} color={isActive ? 'white' : '#999'} strokeWidth={2.2} />
              </span>
              <span className="ep-label">{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
