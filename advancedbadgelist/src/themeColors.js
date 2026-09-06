// Theme colours are computed here in JS rather than with hsl(var(--x) ...) in CSS.
// Nesting var() inside hsl() means one bad value makes the whole declaration
// invalid, which silently drops the entire `background` shorthand and leaves
// panels transparent. Emitting plain hsl()/hsla() strings from here keeps the
// CSS free of that failure mode and works on older browsers too.

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

export function themeVars(stored) {
    const { preset, hue, sat } = normalizeTheme(stored);

    const vars = {
        "--abl-aero-border": hsl(hue, sat, 79, 0.45),
        "--abl-aero-border-bright": hsl(hue, sat, 89, 0.85),
        "--abl-aero-accent-dark": hsl(hue + 4, sat * 0.9, 18),
        "--abl-panel-tint": hsl(hue, sat, 56, 0.14),
        "--abl-icon-tint": hsl(hue, sat, 74, 0.08),
        "--abl-icon-border": hsl(hue, sat, 79, 0.25),
        "--abl-ghost-hover": hsl(hue, sat, 74, 0.12),
        "--abl-btn-top": hsl(hue, sat, 62),
        "--abl-btn-mid": hsl(hue, sat * 0.9, 36),
        "--abl-knob-mid": hsl(hue, sat * 0.3, 92),
        "--abl-knob-edge": hsl(hue, sat * 0.5, 84)
    };

    if (preset === "mono") {
        Object.assign(vars, MONO_OVERRIDES);
    }

    return vars;
}

export { PRESETS };
