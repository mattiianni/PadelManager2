import React from 'react';

const iconProps = {
  className: "h-6 w-6",
  strokeWidth: "1.5",
  stroke: "currentColor",
  fill: "none",
  "strokeLinecap": "round" as const,
  "strokeLinejoin": "round" as const,
};

export const ChartBarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
    <path d="M3 12m0 1a1 1 0 0 1 1 -1h1a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1z" />
    <path d="M9 8m0 1a1 1 0 0 1 1 -1h1a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1z" />
    <path d="M15 4m0 1a1 1 0 0 1 1 -1h1a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1z" />
    <path d="M4 20l14 0" />
  </svg>
);

export const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
    <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
  </svg>
);

export const TableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
    <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" />
    <path d="M3 10h18" /><path d="M10 3v18" />
  </svg>
);

export const ShuffleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
    <path d="M18 4l3 3l-3 3" /><path d="M18 20l3 -3l-3 -3" />
    <path d="M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5" />
    <path d="M21 7h-5a4.978 4.978 0 0 0 -3.003 .997" />
  </svg>
);

export const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
    <path d="M8 21l8 0" /><path d="M12 17l0 4" /><path d="M7 4l10 0" />
    <path d="M17 4v8a5 5 0 0 1 -10 0v-8" /><path d="M5 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M15 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
  </svg>
);

export const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
);

export const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

export const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" />
        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </svg>
);

export const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} className="h-5 w-5 mr-2" viewBox="0 0 24 24">
        <path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" />
        <path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-10z" />
    </svg>
);

export const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
      <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
    </svg>
);

export const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    </svg>
);

export const ArrowUpIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} className={className} viewBox="0 0 24 24">
    <path d="M12 5l0 14" /><path d="M18 11l-6 -6" /><path d="M6 11l6 -6" />
  </svg>
);

export const ArrowDownIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M12 5l0 14" /><path d="M18 13l-6 6" /><path d="M6 13l6 6" />
    </svg>
);

export const ArrowStableIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M5 12l14 0" />
    </svg>
);

export const ChevronDownIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M6 9l6 6l6 -6" />
    </svg>
);

export const PencilIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
        <path d="M13.5 6.5l4 4" />
    </svg>
);

export const StatsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" {...iconProps} viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <path d="M20 18v3" />
        <path d="M16 16v5" />
        <path d="M12 13v8" />
        <path d="M8 16v5" />
        <path d="M3 11c6 0 5 -5 9 -5s3 5 9 5" />
    </svg>
);
