'use client';

interface MenuToggleBtnProps {
  open: boolean;
  onClick: () => void;
  title?: string;
}

export function MenuToggleBtn({ open, onClick, title }: MenuToggleBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title ?? (open ? 'Hide' : 'Show')}
      style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: open ? '#1a1a1a' : '#f4f4f4',
        border: `1px solid ${open ? '#1a1a1a' : '#e4e4e4'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.22s, border-color 0.22s',
      }}
    >
      <svg
        width="17" height="17" viewBox="0 0 32 32" fill="none"
        stroke={open ? 'white' : '#444'} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        style={{
          transition: 'transform 0.48s ease-in-out',
          transform: open ? 'rotate(-45deg)' : 'none',
        }}
      >
        <path
          style={{
            transition: 'stroke-dasharray 0.48s ease, stroke-dashoffset 0.48s ease',
            strokeDasharray: open ? '20 300' : '12 63',
            strokeDashoffset: open ? '-32.42px' : '0',
          }}
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
        />
        <path d="M7 16 27 16" />
      </svg>
    </button>
  );
}
