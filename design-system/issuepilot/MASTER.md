# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** IssuePilot  
**Generated:** 2026-10-21 18:21:07  
**Category:** SaaS Developer Intelligence  
**Visual Style:** Glassmorphism  

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#6366F1` / `#4F46E5` | `--color-primary` | Accent glow, active states, key brand elements |
| Secondary | `#334155` | `--color-secondary` | Neutral support elements, secondary tags |
| CTA/Accent | `#22C55E` | `--color-cta` | Run green, verified badges, success indicators |
| Background (Dark) | `#0B0F19` | `--color-background` | Deep obsidian backdrop |
| Background (Light) | `#F8FAFC` | `--color-background` | Clean airy slate-50 backdrop |
| Text (Dark) | `#F8FAFC` | `--color-text` | High-contrast readable typography (15:1 ratio) |
| Text (Light) | `#0F172A` | `--color-text` | High-contrast slate-900 typography (14:1 ratio) |

### Glassmorphism Tokens

| Token | Light Mode Value | Dark Mode Value | Usage |
|-------|------------------|-----------------|-------|
| `--glass-bg` | `rgba(255, 255, 255, 0.8)` | `rgba(15, 23, 42, 0.7)` | Translucent card backdrop |
| `--glass-border` | `rgba(226, 232, 240, 0.8)` | `rgba(255, 255, 255, 0.1)` | Luminous edge boundary |
| `--glass-blur` | `20px` / `blur-xl` | `20px` / `blur-xl` | Diffusion filter for refraction |
| `--glass-shadow` | `0 4px 24px -1px rgba(0,0,0,0.05)` | `0 4px 24px -1px rgba(0,0,0,0.3)` | Elevation lift |
| `--glass-specular` | `inset 0 1px 1px 0 rgba(255,255,255,0.9)` | `inset 0 1px 1px 0 rgba(255,255,255,0.08)` | Top edge light reflection |

### Ambient Background Glows

Glassmorphism strictly requires colorful ambient light gradients behind the translucent frosted panels:
- Top-left Indigo Glow: `blur(120px) bg-indigo-500/10 dark:bg-indigo-600/15`
- Top-right Cyan Glow: `blur(130px) bg-cyan-500/10 dark:bg-cyan-600/12`
- Bottom Violet Glow: `blur(140px) bg-violet-500/10 dark:bg-purple-600/12`

### Typography

- **Heading Font:** Space Grotesk / Inter
- **Body Font:** DM Sans / Inter
- **Monospace Font:** JetBrains Mono / Fira Code
- **Mood:** Tech, startup, modern, innovative, bold, futuristic

---

## Component Specs (Glassmorphism Implementations)

### 1. Glass Cards (`.glass-card`, `Card`, `.glass-card-interactive`)

Inspired by hyper-realistic frosted glass with multi-layer volumetric inset box-shadows, beveled edge refraction, and dual specular light beams (`::before` and `::after`).

```css
/* Card Container */
.glass-card,
.glass-card-interactive {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    inset 0 -1px 0 rgba(255, 255, 255, 0.15),
    inset 0 0 10px 4px rgba(255, 255, 255, 0.45);
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dark .glass-card,
.dark .glass-card-interactive {
  background: rgba(13, 18, 36, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 10px 4px rgba(255, 255, 255, 0.04);
}

/* Optional fixed showcase card dimensions */
.glass-card-showcase {
  width: 240px;
  height: 360px;
}

/* Top Specular Edge Highlight Line (90deg gradient beam) */
.glass-card::before,
.glass-card-interactive::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.8),
    transparent
  );
  pointer-events: none;
  z-index: 10;
}

.dark .glass-card::before,
.dark .glass-card-interactive::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.45),
    transparent
  );
}

/* Left Specular Edge Reflection Line (180deg gradient beam) */
.glass-card::after,
.glass-card-interactive::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.8),
    transparent,
    rgba(255, 255, 255, 0.3)
  );
  pointer-events: none;
  z-index: 10;
}

.dark .glass-card::after,
.dark .glass-card-interactive::after {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.45),
    transparent,
    rgba(255, 255, 255, 0.12)
  );
}

/* Interactive Hover States */
.glass-card-interactive {
  cursor: pointer;
}

.glass-card-interactive:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 
    0 16px 36px rgba(99, 102, 241, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(255, 255, 255, 0.25),
    inset 0 0 12px 6px rgba(255, 255, 255, 0.55);
}

.dark .glass-card-interactive:hover {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 
    0 16px 36px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(99, 102, 241, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 12px 5px rgba(255, 255, 255, 0.08);
}
```

### 2. Glass Buttons (`Button variant="glass"`)

```css
.btn-glass {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  color: #0F172A;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 200ms ease;
  cursor: pointer;
}

.dark .btn-glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #F8FAFC;
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(99, 102, 241, 0.4);
}

.dark .btn-glass:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(99, 102, 241, 0.5);
}
```

### 3. Glass Inputs (`.glass-input`, `Input`)

```css
.input-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #0F172A;
  transition: all 200ms ease;
}

.dark .input-glass {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #F8FAFC;
}

.input-glass:focus {
  border-color: rgba(99, 102, 241, 0.6);
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
```

### 4. Glass Modals

```css
.modal-overlay {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.modal {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 560px;
  width: 90%;
}

.dark .modal {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
}
```

---

## Anti-Patterns (Do NOT Use)

- ❌ **Low opacity in light mode** — Never use `bg-white/10` in light mode (too washed out); use `bg-white/80` or higher.
- ❌ **Low contrast text** — Body text must meet 4.5:1 minimum contrast (WCAG AA).
- ❌ **Missing cursor:pointer** — All interactive cards and buttons must declare `cursor-pointer`.
- ❌ **Emojis as icons** — Use official Lucide SVG icons exclusively.
- ❌ **Layout-shifting hovers** — Use smooth transition transforms (`translate-y-0.5`) without scaling width/height.
- ❌ **Flat design without depth** — Glassmorphism requires multi-layer backdrop diffusion.

---

## Pre-Delivery Checklist

- [x] Ambient glowing backdrops implemented in `app/layout.tsx`
- [x] Frosted glass tokens defined in `app/globals.css`
- [x] `Card` component upgraded to default glassmorphic styling
- [x] `Button` component updated with `"glass"` variant and `cursor-pointer`
- [x] `Input` and `Badge` components enhanced with frosted glass diffusion
- [x] Navbar and Footer elevated with frosted glass blur
- [x] Hero search bar and feature grid upgraded to frosted glass
- [x] All modal dialogs (AI Triage, Preferences, Link PR, Notes, Saved Snapshots) styled with frosted glass
- [x] Light mode contrast ratio strictly above 4.5:1
- [x] All interactive elements have `cursor-pointer`
