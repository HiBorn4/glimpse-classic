import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_EVENT_TITLE ?? 'Wedding Gallery',
  description: 'Find your wedding photos instantly with AI face search',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const R2_URL  = process.env.NEXT_PUBLIC_R2_URL;

// Inline script — runs before first paint, no flash of wrong column count.
// All thresholds are % of viewport width (vw), so zero fixed px values.
const responsiveScript = `
(function () {
  function update() {
    var vw = window.innerWidth / window.screen.width * 100;
    var pct = (window.innerWidth / window.innerWidth) * 100; // always 100 — use vw directly
    var w = window.innerWidth;
    var total = window.screen.width || 1920;
    // Use viewport width as percentage of a reference 1920px screen
    // But we keep it truly relative: just use the actual pixel width to
    // derive a vw-proportional column count with no named breakpoints.
    // Formula: cols = floor(vw / 20) clamped between 2 and 5
    //   where vw = viewport width expressed as % of 1920 baseline
    //   At 1920px → 100vw/20 = 5 cols
    //   At 1280px →  67vw/20 = 3.3 → 3 cols
    //   At  768px →  40vw/20 = 2   → 2 cols
    //   At  480px →  25vw/20 = 1.2 → clamped to 2 cols
    var vwPct = (w / 1920) * 100;
    var cols = Math.floor(vwPct / 20);
    if (cols < 2) cols = 2;
    if (cols > 5) cols = 5;

    document.documentElement.style.setProperty('--masonry-cols', cols);

    // Phone class for utility CSS
    if (cols <= 2) {
      document.documentElement.classList.add('is-phone');
    } else {
      document.documentElement.classList.remove('is-phone');
    }
  }
  update();
  window.addEventListener('resize', update);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {API_URL ? <link rel="preconnect" href={API_URL} /> : null}
        {R2_URL  ? <link rel="dns-prefetch" href={R2_URL} /> : null}
        {/* Responsive columns — % based, runs before paint */}
        <script dangerouslySetInnerHTML={{ __html: responsiveScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
