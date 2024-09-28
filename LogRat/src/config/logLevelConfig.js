// Function to fade a color
const fadeColor = (color, amount) => {
  const [r, g, b] = color
    .slice(1)
    .match(/.{2}/g)
    .map((hex) => parseInt(hex, 16));
  const fadedColor = [Math.floor(r * amount), Math.floor(g * amount), Math.floor(b * amount)]
    .map((x) => x.toString(16))
    .map((hex) => (hex.length === 1 ? `0${hex}` : hex))
    .join('');

  return `#${fadedColor}`;
};

export const levelColors = {
  DEBUG: '#38ff38',
  INFO: '#3895ff',
  WARN: '#fcfc38',
  ERROR: '#ff4040',
  FATAL: '#ff8133'
};

export const fadedLevelColors = Object.fromEntries(
  Object.entries(levelColors).map(([key, color]) => [key, fadeColor(color, 0.15)])
);

export const allLogLevels = Object.keys(levelColors);
