export type AppScheme = "light" | "dark" | "warm";

export const Colors = {
  light: {
    background: "#FFFFFF",
    surface: "#F5F5F5",
    accent: "#E8FF38",
    accentSubtle: "#F7FFBA",
    textPrimary: "#111111",
    textSecondary: "#6B6B6B",
    border: "#E0E0E0",
    buttonBg: "#242018",
    buttonText: "#FFFFFF",
    error: "#C0392B",
    shadow: "#000000",
  },
  dark: {
    background: "#1E1C1B",
    surface: "#2A2826",
    accent: "#E8FF38",
    accentSubtle: "#2A2D00",
    textPrimary: "#F2F2F2",
    textSecondary: "#8E8E93",
    border: "#383533",
    buttonBg: "#3E3A32",
    buttonText: "#F2F2F2",
    error: "#E74C3C",
    shadow: "#000000",
  },
  warm: {
    background: "#F0EDEA",
    surface: "#FFFFFF",
    accent: "#E8FF38",
    accentSubtle: "#F7FFBA",
    textPrimary: "#1A1614",
    textSecondary: "#8A7A72",
    border: "#E2DDD8",
    buttonBg: "#242018",
    buttonText: "#FFFFFF",
    error: "#C0392B",
    shadow: "#000000",
  },
};

// Maps warm → light for palette lookups (until warm palette is defined)
function paletteScheme(s: AppScheme): "light" | "dark" {
  return s === "dark" ? "dark" : "light";
}

export type ChipStyle = { bg: string; text: string };

const P = {
  light: [
    { bg: "#E5E9D5", text: "#4D532D" },  // 0 olive green
    { bg: "#FEEACB", text: "#896126" },  // 1 amber
    { bg: "#BEC8C6", text: "#011410" },  // 2 teal
    { bg: "#FEE1DD", text: "#7D463D" },  // 3 coral
    { bg: "#E2DAF0", text: "#5A3D82" },  // 4 lavender
    { bg: "#F0DAE4", text: "#8A4A60" },  // 5 dusty rose
    { bg: "#E8E0D5", text: "#6B5C4E" },  // 6 warm taupe
    // 7-10: reserved for categories
    { bg: "#C8DFB0", text: "#2A4A14" },  // 7 green           — At Work
    { bg: "#FDD99A", text: "#6B4400" },  // 8 yellow          — In Academia
    { bg: "#F8BDB5", text: "#6A2820" },  // 9 pink            — With Friends
    { bg: "#C8D8E8", text: "#1A3A5C" },  // 10 blue           — To-do list
  ],
  dark: [
    { bg: "#262A17", text: "#BDCF72" },  // 0 olive green
    { bg: "#402C0C", text: "#FEAD32" },  // 1 amber
    { bg: "#131C1B", text: "#82C4BC" },  // 2 teal
    { bg: "#3F231F", text: "#FA8A7A" },  // 3 coral
    { bg: "#1E1630", text: "#B89FD8" },  // 4 lavender
    { bg: "#2E1820", text: "#D490A8" },  // 5 dusty rose
    { bg: "#252220", text: "#B0A498" },  // 6 warm taupe
    // 7-10: reserved for categories
    { bg: "#1E2E10", text: "#A8CC7A" },  // 7 green           — At Work
    { bg: "#3A2C08", text: "#F0BC50" },  // 8 yellow          — In Academia
    { bg: "#3A1C18", text: "#F0907A" },  // 9 pink            — With Friends
    { bg: "#182030", text: "#7AAAC8" },  // 10 blue           — To-do list
  ],
};

export const ChipColors: Record<string, { light: ChipStyle; dark: ChipStyle }> = {
  // At Work
  meeting:      { light: P.light[3], dark: P.dark[3] }, // coral
  video_call:   { light: P.light[6], dark: P.dark[6] }, // warm taupe
  small_talk:   { light: P.light[1], dark: P.dark[1] }, // amber
  presentation: { light: P.light[0], dark: P.dark[0] }, // olive green
  messenger:    { light: P.light[5], dark: P.dark[5] }, // dusty rose
  work_email:   { light: P.light[4], dark: P.dark[4] }, // lavender
  // In Academia
  prof_meeting:  { light: P.light[2], dark: P.dark[2] }, // teal
  seminar:       { light: P.light[0], dark: P.dark[0] }, // olive green
  conference_qa: { light: P.light[5], dark: P.dark[5] }, // dusty rose
  thesis:        { light: P.light[6], dark: P.dark[6] }, // warm taupe
  prof_email:    { light: P.light[3], dark: P.dark[3] }, // coral
  // With Friends
  in_person:    { light: P.light[1], dark: P.dark[1] }, // amber
  whatsapp:     { light: P.light[5], dark: P.dark[5] }, // dusty rose
  group_chat:   { light: P.light[2], dark: P.dark[2] }, // teal
};

export function getChipStyle(key: string, scheme: AppScheme): ChipStyle {
  const ps = paletteScheme(scheme);
  return ChipColors[key]?.[ps] ?? { bg: "#E0E0E0", text: "#111111" };
}

export function getPaletteStyle(index: number, scheme: AppScheme): ChipStyle {
  const ps = paletteScheme(scheme);
  return P[ps][index % P[ps].length];
}

const PRESET_PALETTE: Record<string, number> = {
  work:     7,  // sky blue
  academia: 8,  // sage green
  friends:  9,  // warm peach
  todo:     10, // dusty cyan
};

export function getPresetStyle(presetId: string, scheme: AppScheme): ChipStyle {
  const idx = PRESET_PALETTE[presetId] ?? 0;
  return P[paletteScheme(scheme)][idx];
}
