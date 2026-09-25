import type { SVGProps } from "react";

/* Inline SVG only — no icon font, no external request. */

type P = SVGProps<SVGSVGElement>;

export function BrandMark(props: P) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <rect x="1" y="2.6" width="13" height="9.8" rx="1.6" stroke="#fff" strokeWidth="1.3" />
      <circle cx="5.2" cy="6" r="1.1" fill="#fff" />
      <path
        d="M2 11L5.6 7.6L8 10L9.8 8.3L13 11.2"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ImagePlaceholderIcon(props: P) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="7" width="38" height="30" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 33L17 22L25 30L31 24L38 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon(props: P) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="5.5" y="5.5" width="8" height="9" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 3.5H4.3C3.6 3.5 3 4.1 3 4.8V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DownloadIcon(props: P) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 2.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4.8 7.2L8 10.4L11.2 7.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2.8 13.2H13.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AlertIcon(props: P) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5V8.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r=".9" fill="currentColor" />
    </svg>
  );
}

export function ThumbMark(props: P) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="10" r="1.8" fill="currentColor" />
      <path
        d="M4 19L10 12L14 16L17 13L21 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PrivacyShieldIcon(props: P) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 1.8L3.6 4.4V9.6C3.6 14 6.4 17.2 10 18.2C13.6 17.2 16.4 14 16.4 9.6V4.4L10 1.8Z"
        stroke="#2997ff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 9.8L9.3 11.7L12.8 8"
        stroke="#2997ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RemoveIcon(props: P) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ToastOkIcon(props: P) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.6" stroke="#5ed07e" strokeWidth="1.5" />
      <path
        d="M5.2 8.3L7.1 10.2L10.9 6"
        stroke="#5ed07e"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ToastErrIcon(props: P) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.6" stroke="#ff6b5e" strokeWidth="1.5" />
      <path d="M8 4.8V8.6" stroke="#ff6b5e" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r=".9" fill="#ff6b5e" />
    </svg>
  );
}

export function ToastInfoIcon(props: P) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.6" stroke="#2997ff" strokeWidth="1.5" />
      <path d="M8 7.2V11" stroke="#2997ff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5" r=".9" fill="#2997ff" />
    </svg>
  );
}

export function CheckBadgeIcon(props: P) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <circle cx="7" cy="7" r="6" stroke="#1d8a4c" strokeWidth="1.6" />
      <path
        d="M4.2 7.2L6.2 9.2L9.9 5"
        stroke="#1d8a4c"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
