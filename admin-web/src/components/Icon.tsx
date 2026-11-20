/** Line paths for the console's icons, in the same 24×24 style as the app. */
const paths = {
  dashboard: ['M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'],
  flag: ['M5 21V4h11l-2 4 2 4H5'],
  logs: ['M6 3h9l4 4v14H6z', 'M9 12h7M9 16h7'],
  users: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21a7 7 0 0 1 14 0', 'M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3'],
  logout: ['M15 4h4v16h-4', 'M10 8l-4 4 4 4M6 12h10'],
} as const;

export type IconName = keyof typeof paths;

/** Draws one console icon by name, e.g. <Icon name="flag" />. */
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
