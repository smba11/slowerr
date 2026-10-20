import type { CSSProperties } from "react";
const paths = {
  tram: (
    <>
      <rect x="5" y="4" width="14" height="15" rx="3" />
      <path d="M5 13h14M12 4v9M8 19l-2 3m10-3 2 3M8 2h8" />
      <path d="M8 16h.01M16 16h.01" />
    </>
  ),
  pause: (
    <>
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7z" />,
  camera: (
    <>
      <path d="m8 6 2-3h4l2 3h4v14H4V6z" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="17" r="3" />
    </>
  ),
  bell: (
    <>
      <path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 21h4M12 2v2" />
    </>
  ),
  plus: <path d="M5 12h14M12 5v14" />,
  minus: <path d="M5 12h14" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
    </>
  ),
  leaf: (
    <>
      <path d="M19 4C8 2 3 8 5 14c2 8 16 4 14-10ZM5 20 15 9" />
    </>
  ),
  share: (
    <>
      <path d="M12 16V2m-5 5 5-5 5 5M5 12H3v9h18v-9h-2" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
