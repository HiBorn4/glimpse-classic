"use client";

import { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TabItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
};

export type ExpandableTabsProps = {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
  onSelect?: (id: string) => void;
};

export const ExpandableTabs = ({
  tabs,
  defaultTabId = tabs[0]?.id,
  className,
  onSelect,
}: ExpandableTabsProps) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    setActiveTabId(defaultTabId);
  }, [defaultTabId]);

  useEffect(() => {
    const widths: Record<string, number> = {};
    for (const tab of tabs) {
      const el = labelRefs.current[tab.id];
      if (el) widths[tab.id] = el.scrollWidth;
    }
    setLabelWidths(widths);
  }, [tabs]);

  const handleSelect = (id: string) => {
    setActiveTabId(id);
    onSelect?.(id);
  };

  const BASE_W = 34;
  const ICON_LABEL_GAP = 6;
  const LABEL_PADDING = 10;

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-2xl bg-white shadow-sm border border-gray-100",
        className
      )}
      style={{ flexWrap: "nowrap", minWidth: 0 }}
    >
      {/* Hidden measurement layer */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {tabs.map((tab) => (
          <span
            key={tab.id}
            ref={(el) => { labelRefs.current[tab.id] = el; }}
          >
            {tab.label}
          </span>
        ))}
      </div>

      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const isHovered = hoveredId === tab.id && !isActive;
        const Icon = tab.icon;
        const expandedW = BASE_W + ICON_LABEL_GAP + (labelWidths[tab.id] ?? 60) + LABEL_PADDING;
        const currentW = isActive ? expandedW : BASE_W;

        return (
          <div
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            onMouseEnter={() => setHoveredId(tab.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(tab.color)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              cursor: "pointer",
              overflow: "hidden",
              height: 34,
              flexShrink: 0,
              width: currentW,
              transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease",
              opacity: isActive ? 1 : isHovered ? 0.85 : 0.6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 9,
                paddingRight: 9,
                gap: ICON_LABEL_GAP,
                minWidth: 0,
              }}
            >
              <Icon
                style={{ width: 15, height: 15, flexShrink: 0, color: "white" }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "white",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  maxWidth: isActive ? (labelWidths[tab.id] ?? 80) : 0,
                  opacity: isActive ? 1 : 0,
                  transition: "max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease",
                  display: "block",
                }}
              >
                {tab.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
