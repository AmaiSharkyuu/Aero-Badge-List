// Theme colours are computed here in JS rather than with hsl(var(--x) ...) in CSS.
// Nesting var() inside hsl() means one bad value makes the whole declaration
// invalid, which silently drops the entire `background` shorthand and leaves
// panels transparent. Emitting plain hsl()/hsla() strings from here keeps the
// CSS free of that failure mode and works on older browsers too.
//
// Panels are rendered differently depending on Roblox's own light/dark theme:
// the dark theme gets the smoked-glass look, the light theme gets the glossy
// sky-blue gel that Frutiger Aero is actually named for.

const PRESETS = {
    aero: { hue: 200, sat: 95 },
    mono: { hue: 0, sat: 0 }
};

const MONO_OVERRIDES = {
    "--abl-toggle-off": "#3a3a3a",
    "--abl-toggle-on": "#cfcfcf",
    "--abl-rarity-valuable": "#ffffff",
    "--abl-rarity-legacy": "#9a9a9a",
    "--abl-rarity-nvl": "#4a4a4a",
    "--abl-rarity-valuable-glow": "rgba(255, 255, 255, 0.6)",
    "--abl-rarity-legacy-glow": "rgba(154, 154, 154, 0.5)",
    "--abl-rarity-nvl-glow": "rgba(74, 74, 74, 0.6)"
};

const SURFACES = {
    light: "rgb(251, 252, 253)",
    dark: "rgb(13, 13, 16)",
    unknown: "rgba(20, 20, 20, 0.05)"
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function round(value) {
    return Math.round(value * 10) / 10;
}

// Legacy comma syntax on purpose: supported everywhere, including the older
// Chromium builds behind Kiwi and some Opera GX versions.
function hsl(h, s, l, a = 1) {
    const hue = ((Math.round(h) % 360) + 360) % 360;
    const sat = round(clamp(s, 0, 100));
    const light = round(clamp(l, 0, 100));

    if (a >= 1) {
        return `hsl(${hue}, ${sat}%, ${light}%)`;
    }

    return `hsla(${hue}, ${sat}%, ${light}%, ${a})`;
}

// Only numbers and numeric strings are accepted; null, undefined, booleans and
// objects all fall back, since Number(null) === 0 would otherwise slip through.
function num(value, fallback) {
    const parsed = typeof value === "number" ? value
        : typeof value === "string" && value.trim() !== "" ? Number(value)
        : NaN;

    return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeTheme(stored) {
    const theme = stored && typeof stored === "object" ? stored : {};

    const preset = PRESETS[theme.preset] ? theme.preset
        : theme.preset === "custom" ? "custom"
        : "aero";

    const base = PRESETS[preset] || PRESETS.aero;

    return {
        preset,
        hue: num(theme.hue, base.hue),
        sat: clamp(num(theme.sat, base.sat), 0, 100)
    };
}

// Luminous sky-blue gel. The specular highlight is a fixed-height band at the
// top rather than a percentage, so a 120px badge card and a short button get
// the same shine instead of tall panels turning into large white expanses.
function lightSurface(h, s) {
    return {
        "--abl-gloss": "linear-gradient(to bottom, rgba(255, 255, 255, 0.85) 0px, rgba(255, 255, 255, 0.45) 12px, rgba(255, 255, 255, 0.12) 26px, rgba(255, 255, 255, 0) 40px)",
        "--abl-wash": `linear-gradient(to bottom, ${hsl(h, s, 92, 0.95)} 0%, ${hsl(h, s, 80, 0.95)} 42%, ${hsl(h, s, 70, 0.95)} 100%)`,
        "--abl-panel-border": hsl(h, s * 0.85, 45, 0.55),
        "--abl-panel-border-top": "rgba(255, 255, 255, 0.95)",
        "--abl-panel-shadow": `inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 ${hsl(h, s, 45, 0.25)}, 0 2px 8px ${hsl(h, s * 0.5, 35, 0.25)}`,
        "--abl-icon-tint": "rgba(255, 255, 255, 0.5)",
        "--abl-icon-border": hsl(h, s * 0.9, 45, 0.5),
        "--abl-ghost-hover": "rgba(255, 255, 255, 0.55)",
        // Text fields read as glass over white rather than as another blue gel.
        "--abl-field-bg": "rgba(255, 255, 255, 0.92)",
        "--abl-field-image": "none"
    };
}

// Smoked glass: a thin specular band at the top over a dark surface.
function darkSurface(h, s) {
    return {
        "--abl-gloss": "linear-gradient(to bottom, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 10%, rgba(255, 255, 255, 0) 32%)",
        "--abl-wash": `linear-gradient(to bottom, ${hsl(h, s, 56, 0.14)}, rgba(6, 10, 16, 0) 60%)`,
        "--abl-panel-border": hsl(h, s, 79, 0.45),
        "--abl-panel-border-top": hsl(h, s, 89, 0.85),
        "--abl-panel-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.5), 0 2px 5px rgba(0, 0, 0, 0.45)",
        "--abl-icon-tint": hsl(h, s, 74, 0.08),
        "--abl-icon-border": hsl(h, s, 79, 0.25),
        "--abl-ghost-hover": hsl(h, s, 74, 0.12),
        "--abl-field-bg": SURFACES.dark,
        "--abl-field-image": "none"
    };
}

export function themeVars(stored, mode = "dark") {
    const { preset, hue, sat } = normalizeTheme(stored);
    const surfaceMode = SURFACES[mode] ? mode : "dark";

    const vars = {
        "--abl-color-surface": SURFACES[surfaceMode],
        "--abl-aero-border-bright": hsl(hue, sat, 89, 0.85),
        "--abl-aero-accent-dark": hsl(hue + 4, sat * 0.9, 18),
        "--abl-btn-top": hsl(hue, sat, 62),
        "--abl-btn-mid": hsl(hue, sat * 0.9, 36),
        "--abl-knob-mid": hsl(hue, sat * 0.3, 92),
        "--abl-knob-edge": hsl(hue, sat * 0.5, 84),
        ...(surfaceMode === "light" ? lightSurface(hue, sat) : darkSurface(hue, sat))
    };

    if (preset === "mono") {
        Object.assign(vars, MONO_OVERRIDES);
    }

    return vars;
}

export { PRESETS };
