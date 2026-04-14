"use client"
import type React from "react"

export function AnimatedBlobs() {
  const blobStyle = {
    "--border-radius": "115% 140% 145% 110% / 125% 140% 110% 125%",
    "--border-width": "3.5vmin",   // reduced by 30% from 5vmin
    aspectRatio: "1",
    display: "block",
    gridArea: "stack",
    backgroundSize: "calc(100% + var(--border-width) * 2)",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    border: "var(--border-width) solid transparent",
    borderRadius: "var(--border-radius)",
    maskImage: "linear-gradient(transparent, transparent), linear-gradient(black, white)",
    maskClip: "padding-box, border-box",
    maskComposite: "intersect",
    mixBlendMode: "screen" as const,
    height: "56vmin",              // reduced by 30% from 80vmin
    filter: "blur(0.7vmin)",       // slightly reduced blur for smaller blob
  } as React.CSSProperties

  // Whitish-gold layers — luminous pearl to warm champagne gold
  const blobs = [
    {
      backgroundColor: "#fffbe0",
      backgroundImage: "linear-gradient(#ffffff, #fff5c0, #fce060, #fffbe0)",
      transform: "rotate(0deg) scale(1.04)",
    },
    {
      backgroundColor: "#fff8d0",
      backgroundImage: "linear-gradient(#fffef5, #fff0a0, #f8d040, #fff8d0)",
      transform: "rotate(90deg) scale(0.97)",
    },
    {
      backgroundColor: "#fffff0",
      backgroundImage: "conic-gradient(#fffff8, #fff8c8, #fce050, #ffe898, #ffffff, #fff5d0, #fffff8)",
      transform: "rotate(180deg) scale(1.02)",
    },
    {
      backgroundColor: "#fff5c0",
      backgroundImage: "linear-gradient(#ffffff, #fffce8, #f8e070, #d4a820, #fff5c0)",
      transform: "rotate(270deg) scale(0.95)",
    },
  ]

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "#1a1a2e" }}
    >
      <div className="grid" style={{ gridTemplateAreas: "'stack'" }}>
        <div
          className="grid relative"
          style={{
            gridTemplateAreas: "'stack'",
            gridArea: "stack",
            animation: "spin 5s linear infinite",
          }}
        >
          {blobs.map((blob, index) => (
            <span
              key={index}
              style={{
                ...blobStyle,
                ...blob,
              }}
            />
          ))}
          {/* Shimmer highlight overlay — moves like liquid */}
          <span
            style={{
              ...blobStyle,
              backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.95) 0%, rgba(255,252,200,0.60) 22%, rgba(255,240,120,0.25) 44%, transparent 65%)",
              backgroundColor: "transparent",
              mixBlendMode: "screen",
              animation: "shimmerSpin 2.8s ease-in-out infinite",
              filter: "blur(0.3vmin)",
            } as React.CSSProperties}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmerSpin {
          0%   { transform: rotate(0deg) scale(1); opacity: 0.55; }
          30%  { transform: rotate(108deg) scale(1.12); opacity: 0.95; }
          60%  { transform: rotate(216deg) scale(0.95); opacity: 0.60; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}
