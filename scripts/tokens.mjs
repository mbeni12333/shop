const palette = {
  bg: '#FCFBFE',
  surface: '#FFFFFF',
  soft: '#F2EDFC',
  ink: '#242033',
  muted: '#686274',
  purple: '#6840C6',
  purpleHover: '#5330A6',
  pale: '#E8DFF9',
  border: '#DDD7E6',
  control: '#898092',
  green: '#27634B',
  greenBg: '#E9F3ED',
  red: '#AC3045',
  redBg: '#FFF0F2',
};
const hsl = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  let s = 0;
  const l = (mx + mn) / 2;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return (
    h.toFixed(1) +
    ' ' +
    (s * 100).toFixed(1) +
    '% ' +
    (l * 100).toFixed(1) +
    '%'
  );
};
for (const [key, value] of Object.entries(palette))
  console.log(key.padEnd(14), value, hsl(value));
