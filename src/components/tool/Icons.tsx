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

/** Clipboard with a downward arrow — "read what is on the clipboard". */
export function PasteIcon(props: P) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 3.2H4.6A1.6 1.6 0 0 0 3 4.8v8.6A1.6 1.6 0 0 0 4.6 15h6.8A1.6 1.6 0 0 0 13 13.4V4.8a1.6 1.6 0 0 0-1.6-1.6H10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="6" y="1" width="4" height="3.2" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 7.2v3.6M6.4 9.4L8 11l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Bracketed code turning into a picture — the reverse tool's own mark. */
export function DecodeMarkIcon(props: P) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true" {...props}>
      <path
        d="M11 9L5 22L11 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 9L39 22L33 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="16" y="14" width="12" height="9" rx="1.8" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="17.6" r="1.1" fill="currentColor" />
      <path
        d="M16.5 22.4L19.4 19.8L21.4 21.6L22.8 20.3L27.5 22.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 26.5v5.6M19.8 30L22 32.2L24.2 30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Header chrome
 * ------------------------------------------------------------------ */

/** Wireframe globe — the conventional "this control is about language".
    Drawn rather than lettered: a code such as "EN" has to change as the
    language set changes, and an abbreviation is not an affordance. */
export function GlobeIcon(props: P) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.8 8h12.4" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.8c1.7 1.8 2.6 3.9 2.6 6.2S9.7 12.4 8 14.2C6.3 12.4 5.4 10.3 5.4 8S6.3 3.6 8 1.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

/** Disclosure caret. Rotates to point up while the menu is open, which
    is the only thing on screen telling the visitor it can be closed. */
export function ChevronDownIcon(props: P) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.2 3.9L5 6.7L7.8 3.9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Marks the language already being read. Present in every row and
    invisible in all but one, so the names stay on a common baseline. */
export function CheckIcon(props: P) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.4 6.3L4.9 8.8L9.6 3.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
