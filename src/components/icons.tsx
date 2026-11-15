type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function LockIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

export function ShieldIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
      <path d="M8.5 12l2.5 2.5L16 9.5" />
    </svg>
  );
}

export function LinesIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function MenuIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function AlertIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  );
}

export function Check({ className = "text-brand" }: IconProps) {
  return (
    <span aria-hidden="true" className={`font-bold ${className}`}>
      ✓
    </span>
  );
}
