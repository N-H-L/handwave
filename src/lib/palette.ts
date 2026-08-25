/**
 * Okabe-Ito — the eight-colour qualitative palette designed to stay
 * distinguishable under all three common forms of colour blindness. Chosen
 * over anything prettier because roughly 1 in 12 men cannot read a red/green
 * encoding, and a physics demo that loses its meaning for them is a broken
 * physics demo.
 */
export const OKABE_ITO = {
  black: "#000000",
  orange: "#E69F00",
  skyBlue: "#56B4E9",
  bluishGreen: "#009E73",
  yellow: "#F0E442",
  blue: "#0072B2",
  vermillion: "#D55E00",
  reddishPurple: "#CC79A7",
} as const;

export const INK = {
  axis: "#3f3f46",
  grid: "#e4e4e7",
  gridStrong: "#d4d4d8",
  ground: "#52525b",
  label: "#52525b",
  body: OKABE_ITO.vermillion,
  trail: OKABE_ITO.blue,
  ghost: OKABE_ITO.orange,
} as const;
