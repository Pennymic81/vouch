import Link from "next/link";

export function LogoMark({ size = 32, fill = "#4338CA" }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={fill} />
      <path
        d="M9 16.5l4.5 4.5L23 11"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  size = 32,
  dark = false,
  textClass = "text-[22px]",
}: {
  size?: number;
  dark?: boolean;
  textClass?: string;
}) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 no-underline ${dark ? "text-white" : "text-ink"}`}
    >
      <LogoMark size={size} fill={dark ? "#6366F1" : "#4338CA"} />
      <span className={`font-display font-bold ${textClass}`}>Vouch</span>
    </Link>
  );
}
