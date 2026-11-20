/** MADD colour palette, taken from the design. Use these names, never raw hex codes in screens. */
export const colors = {
  blue: '#1E4FD8', // primary actions, links
  blueDark: '#1440B8', // gradient end, pressed state
  blueLight: '#3A6FF0', // gradient start, madda wave
  sky: '#B9CCFF', // madda wave on blue
  tint: '#E3ECFF', // secondary buttons, icon backgrounds
  ink: '#0B1B3F', // main text
  muted: '#5A6788', // secondary text
  line: '#DCE4F3', // borders and dividers
  background: '#F4F7FC', // screen background
  white: '#FFFFFF',
  success: '#16A34A',
  successBg: '#DFF5E7',
  warning: '#F59E0B',
  warningBg: '#FFF1DC',
  warningText: '#9A4A06',
  warningBorder: '#FCD9A0', // "Why we paused it" box border (design 11)
  warningSurface: '#FFFAF1', // "Why we paused it" box background
  danger: '#DC2626',
  dangerBg: '#FDECEC',
  dangerText: '#B91C1C',
  dangerBorder: '#F5C2C2', // "Freeze my account" card border (design 19)
  dangerSurface: '#FFF6F6', // "Freeze my account" card background
} as const;
