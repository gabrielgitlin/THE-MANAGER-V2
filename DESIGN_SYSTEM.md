# The Manager — Design System
> Source of truth for all UI decisions. Every new component, page, or feature built for The Manager must reference this document.

---

## 1. Brand Identity

**Concept: The Manager's Desk**
> Behind every great artist, there's a system. The Manager is built for the people who hold it all together.

The visual identity blends the calm order of an analog workspace (archival filing, Swiss design, modular grids) with the sharp precision of a game board. Everything is intentional — nothing is ornamental.

**Voice**: Timeless, minimal, focused. Serious where it matters, playful where it helps. In a world full of noise, The Manager becomes the structure that lets talent speak.

**Designed by**: Andrés Higueros (branding) | Brand contact: work@andreshigueros.com

---

## 2. Color Tokens

All colors are defined as CSS custom properties in `src/index.css` and mirrored in `tailwind.config.js`.

### Surface Hierarchy (dark theme)
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0c0c0c` | Page background |
| `--surface` | `#141414` | Cards, panels |
| `--surface-2` | `#1a1a1a` | Inputs, secondary surfaces |
| `--surface-3` | `#222222` | Hover states, dropdowns |
| `--surface-4` | `#2a2a2a` | Active states, tooltips |

### Borders
| Token | Value | Use |
|-------|-------|-----|
| `--border` | `rgba(255,255,255,0.06)` | Subtle dividers, card edges |
| `--border-2` | `rgba(255,255,255,0.10)` | Input borders, stronger dividers |
| `--border-3` | `rgba(255,255,255,0.15)` | Focus-adjacent, prominent borders |

### Text Hierarchy
| Token | Value | Use |
|-------|-------|-----|
| `--t1` | `#ffffff` | Primary text, headings |
| `--t2` | `#cccccc` | Body text, secondary labels |
| `--t3` | `#999999` | Placeholder, inactive, metadata |
| `--t4` | `rgba(255,255,255,0.08)` | Ghost placeholders, ultra-subtle |

### Brand Accent (Official: Pantone 7479 U)
| Token | Value | Use |
|-------|-------|-----|
| `--brand-1` | `#009C55` | Primary actions, active states, focus |
| `--brand-2` | `#007A43` | Hover on primary |
| `--brand-3` | `#005C32` | Active/pressed on primary |
| `--brand-glow` | `rgba(0,156,85,0.15)` | Focus glow on inputs |

**Do NOT** use any other green. `#009C55` is the exact official brand color.

### Status Colors
| Token | Value | Use |
|-------|-------|-----|
| `--status-green` / `--status-green-bg` | `#009C55` / `rgba(0,156,85,0.08)` | Success, active, live |
| `--status-blue` / `--status-blue-bg` | `#ccdbe2` / `rgba(204,219,226,0.08)` | Info, imported/external data, secondary links |
| `--status-yellow` / `--status-yellow-bg` | `#DDAA44` / `rgba(221,170,68,0.08)` | Warning, pending review |
| `--status-orange` / `--status-orange-bg` | `#E08A3C` / `rgba(224,138,60,0.08)` | Caution, at risk |
| `--status-red` / `--status-red-bg` | `#DD5555` / `rgba(221,85,85,0.08)` | Error, danger, destructive |
| `--status-neutral` / `--status-neutral-bg` | `#90928f` / `rgba(144,146,143,0.08)` | Archived, draft, cancelled, inactive |

**Blue usage rule**: `--status-blue` is from the official brand palette (Pantone 643 U). Use for: info toasts/alerts, imported data badges (Spotify, Google Cal), external link color, "Release" event type in calendar. Never use for primary actions or navigation.

**Neutral usage rule**: `--status-neutral` is from the official brand palette (Pantone 7539 U). Use for: archived/cancelled/draft status badges, "Other" event type in calendar, secondary metadata. Never substitute for the text hierarchy (t1–t3).

### Official Brand Palette (from Brandbook 2025)
Five official colors with print specs. Blue and Gray are now also semantic app tokens.

| Token | Value | Pantone | App use |
|-------|-------|---------|---------|
| `--palette-black` | `#000000` | Black U | Print/editorial only |
| `--palette-blue-gray` | `#ccdbe2` | 643 U | → `--status-blue` in app |
| `--palette-cream` | `#eef2ea` | 9043 U | Print/editorial only — not in app UI |
| `--palette-gray` | `#90928f` | 7539 U | → `--status-neutral` in app |
| `--palette-green` | `#009c55` | 7479 U | → `--brand-1` in app |

---

## 3. Typography

### Typefaces
The brand uses a two-typeface system: a primary grotesk and a technical monospace.

| Role | Licensed (brand materials) | Digital substitute (app) | Weights | Rules |
|------|---------------------------|--------------------------|---------|-------|
| Primary | **ABC Diatype** | **Inter** | Bold/SemiBold for titles · Medium/Regular for body | Optical kerning always on |
| Secondary | **ABC Marfa Mono** | **Roboto Mono** | Medium + Bold only | Tracking +50 always · UPPERCASE recommended |

**ABC Diatype** and **ABC Marfa Mono** require a license from abcdinamo.com. Use only for pitch decks, print, and brand marketing. **Inter + Roboto Mono** are correct for all app UI and internal tools.

**Roboto Mono** (via `var(--font-mono)`) is used for: system labels, tab/nav text, timestamps, metadata, KPI sub-labels, calendar numbers, and any technical information layer.

### Typography Scale
Defined in `tailwind.config.js` as custom font sizes and in `src/index.css` as base HTML element styles.

| Class | Size | Weight | Tracking | Use |
|-------|------|--------|----------|-----|
| `text-kpi` | 24px | 300 | — | KPI/metric values |
| `text-kpi-sm` | 22px | 300 | — | Smaller KPI values |
| `h1` | 18px | 600 | +0.02em | Page titles |
| `h2` | 15px | 600 | — | Section headings |
| `h3` | 14px | 500 | — | Subsection headings |
| `text-body` / `p` | 14px | 400 | — | Body copy |
| `text-data` | 13px | 400 | — | Table data, lists |
| `text-nav` | 12px | 500 | +0.05em | Navigation labels (uppercase) |
| `text-section` | 12px | 600 | +0.08em | Section headers (uppercase) |
| `text-chart-title` | 11px | 600 | +0.05em | Chart labels (uppercase) |
| `text-micro` | 11px | 400 | — | Fine print, supporting text |
| `label` | 10px | 600 | +0.05em | Form labels (uppercase) |
| `text-tiny` | 9px | — | — | Pixel-level metadata |

**Rules:**
- Navigation labels, section headers, chart titles, and form labels → always `uppercase`
- Use consistent hierarchy: never skip levels (don't go from h1 to h3)
- Avoid bold (`700+`) except for critical callouts — the system favors weight `300-600`

---

## 4. Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `--space-xs` | 4px | Icon gaps, tight padding |
| `--space-sm` | 8px | Button gaps, compact spacing |
| `--space-md` | 12px | Internal component padding |
| `--space-lg` | 16px | Standard spacing unit |
| `--space-xl` | 24px | Section internal padding |
| `--space-2xl` | 32px | Section separation |
| `--space-3xl` | 48px | Page-level separation |
| `--section-gap` | 28px | Gap between major page sections |

**Card padding**: 20px internal (`tm-card-body`, `tm-card-padded`)
**Card header/footer**: 16px vertical, 20px horizontal

---

## 5. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 0px | All UI elements — square corners |
| `--radius-md` | 0px | All UI elements — square corners |
| `--radius-lg` | 0px | All UI elements — square corners |
| `--radius-full` | 9999px | Badges, pills, avatars, traffic lights ONLY |

**Rule**: All corners are perfectly square. `--radius-full` is the only exception, reserved for circular/pill elements (status badges, traffic light dots, avatar circles).

---

## 6. Motion & Transitions

| Token | Value | Use |
|-------|-------|-----|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard easing (slight bounce) |
| `--duration-fast` | `0.12s` | Micro-interactions (button hover, border change) |
| `--duration-normal` | `0.2s` | Standard transitions (dropdown, state change) |
| `--duration-slow` | `0.35s` | Deliberate transitions (modal open, page change) |

**Rules:**
- All interactive state changes use `var(--duration-fast)` by default
- Modal open/close uses `slideUp` animation at `0.25s`
- Never use `transition: all` — be explicit about what properties transition

---

## 7. Component Patterns

### Buttons
```jsx
// Primary — main actions
<button className="btn btn-primary">Save</button>
<button className="btn btn-sm btn-primary">Save</button>
<button className="btn btn-lg btn-primary">Save</button>

// Secondary — supporting actions  
<button className="btn btn-secondary">Cancel</button>

// Ghost — low-emphasis actions
<button className="btn btn-ghost">View Details</button>

// Danger — destructive actions
<button className="btn btn-danger">Delete</button>

// Icon-only
<button className="btn-icon"><Icon /></button>
<button className="btn-icon sm"><Icon /></button>
```

**Rules:**
- One `btn-primary` per section maximum
- Destructive actions always use `btn-danger`, never `btn-primary` with a warning
- Disabled state: add `disabled` attribute — CSS handles `opacity: 0.4`

### Cards
```jsx
// Base card (no padding — use when controlling inner layout)
<div className="tm-card">
  <div className="tm-card-header">
    <span>Title</span>
    <button className="btn-icon"><Icon /></button>
  </div>
  <div className="tm-card-body">Content</div>
  <div className="tm-card-footer">
    <button className="btn btn-secondary">Cancel</button>
    <button className="btn btn-primary">Save</button>
  </div>
</div>

// Padded card (for simple content blocks)
<div className="tm-card-padded">Content</div>
```

### Tabs
```jsx
// Page-level navigation (42px height)
<div className="tm-tabs">
  <button className="tm-tab active">Overview</button>
  <button className="tm-tab">Catalog</button>
</div>

// Section-level navigation (36px height)
<div className="sub-tabs">
  <button className="sub-tab active">
    <img className="tab-icon" src={icon} />
    Details
  </button>
</div>
```

**Rules:**
- No padding changes on active — prevents layout shift (both use `border-bottom` only)
- Primary tabs for page-level, sub-tabs for section-level — don't mix

### Data Tables
```jsx
<div className="data-table-wrap">
  <table className="data-table">
    <thead>
      <tr>
        <th>Name</th>
        <th className="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr className="clickable">
        <td>Item</td>
        <td className="num">$1,000</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Badges
```jsx
<span className="status-badge badge-green">Released</span>
<span className="status-badge badge-blue">Imported</span>   {/* info / external source */}
<span className="status-badge badge-yellow">Pending</span>
<span className="status-badge badge-orange">Review</span>
<span className="status-badge badge-red">Overdue</span>
<span className="status-badge badge-brand">Featured</span>
<span className="status-badge badge-neutral">Archived</span> {/* draft / cancelled / inactive */}
```

### Metric Cards (KPIs)
```jsx
<div className="metric-grid grid-cols-3">
  <div className="metric-card">
    <div className="val">$24,500</div>
    <div className="lbl">Total Revenue</div>
    <div className="sub">↑ 12% this month</div>
  </div>
</div>
```

### Forms
```jsx
<div className="form-field">
  <label>Field Name</label>
  <input type="text" placeholder="Value" />
  <span className="field-hint">Optional helper text</span>
</div>

// Form row (2-column grid, collapses to 1 on mobile)
<div className="form-row">
  <div className="form-field">...</div>
  <div className="form-field">...</div>
</div>
```

### Empty States
```jsx
<div className="empty-state">
  <div className="empty-icon"><Icon size={28} /></div>
  <div className="empty-title">No items yet</div>
  <div className="empty-desc">Add your first item to get started.</div>
  <button className="btn btn-primary mt-4">Add Item</button>
</div>
```

---

## 8. Icon System

- **Style**: Pixel art — inspired by Windows 95/98, retro office productivity software
- **Grid**: 16×16 or 24×24, strict pixel grid
- **Source files**: `public/TM-*-negro.svg` — all black source, colorized via CSS filter
- **Size**: `.pxi-sm` 14px (inline/table), `.pxi-md` 16px (standard), `.pxi-lg` 20px (nav), `.pxi-xl` 24px (heading)

### Color Filter Classes
Apply to `<img>` tags pointing at the black SVG source files:

```jsx
<img src="/TM-Alert-negro.svg" className="pxi-md icon-white" />   // white — default on dark bg
<img src="/TM-Alert-negro.svg" className="pxi-md icon-green" />   // brand-1 green
<img src="/TM-Alert-negro.svg" className="pxi-md icon-blue" />    // status-blue (info)
<img src="/TM-Alert-negro.svg" className="pxi-md icon-red" />     // status-red (error)
<img src="/TM-Alert-negro.svg" className="pxi-md icon-yellow" />  // status-yellow (warning)
<img src="/TM-Alert-negro.svg" className="pxi-md icon-muted" />   // t3 muted gray
<img src="/TM-Alert-negro.svg" className="pxi-md icon-danger" />  // status-red (destructive)
```

### Available Icons (public/)
`TM-Alert`, `TM-ArrowLeft`, `TM-Close`, `TM-Copy`, `TM-Download`, `TM-ExternalLink`, `TM-File`, `TM-Filter`, `TM-Info`, `TM-Mic`, `TM-Pause`, `TM-Phone`, `TM-Play`, `TM-Refresh`, `TM-Search`, `TM-Send`, `TM-Settings`, `TM-Share`, `TM-SkipBack`, `TM-SkipFwd`, `TM-Trash`, `TM-Upload` (all `-negro.svg`), plus `TM-Pluma-negro.png` (edit/pencil), `The Manager_Iconografia-11.svg` (confirm/thumbs up).

### Nav icons (pixel-icon class)
Large navigation icons use `.pixel-icon` with opacity-based active state:
```jsx
<img src="/icon.svg" className="pixel-icon" />
<img src="/icon.svg" className="pixel-icon active" />  // brand-1 green filter
```

### Folder Containers
A selective pattern referencing analog filing systems — **top-left radius 4px only**, all other corners square.

**Use for:**
1. Section labels that sit above a card/list (`.folder-label` + `.folder-body`)
2. Active page-level tabs (add `.folder-active` to `.tm-tab.active`)
3. Category tags on cards (Live / Release / Finance)

**Never use on:** buttons, badges, inputs, modals, or more than one folder level per screen.

```jsx
// Section label flowing into content below
<div>
  <div className="folder-label">
    <img src="/TM-File-negro.svg" className="pxi-sm icon-muted" />
    Contract Documents
  </div>
  <div className="folder-body p-4">
    {/* content */}
  </div>
</div>

// Active tab with folder treatment
<button className="tm-tab active folder-active">Overview</button>
```

The tab's `border-bottom-color` matches the content panel background to fuse them visually. The label has no bottom border — the content panel's top border creates the join.

---

## 9. Layout & Navigation

### Page Layout
- Fixed header: 48px height, `background: #111111`, `z-50`, sticky
- Content area: `pt-12` (clears header), full-width responsive
- Mobile: tab bar at bottom (56px), hides header nav
- Max content width: no artificial max-width — full responsive grid

### Navigation
- Center nav icons: 44×44px touch targets
- Active state: `border-bottom: 2px solid var(--brand-1)`, icon opacity 1.0
- Inactive state: `border-bottom: 2px solid transparent`, icon opacity 0.35
- Transition: `var(--duration-fast)` on color and border

### Spacing Rules
- Use `gap-[section-gap]` (`28px`) between major page sections
- Use `gap-4` (`16px`) between cards in a grid
- Use `gap-3` (`12px`) inside component groups

---

## 10. Editorial System (Brand Guidelines)

When building marketing materials, presentations, or external-facing content (not app UI):

**Principles:**
- Swiss graphic design: rational structure, visible column grid, typographic discipline
- Modular grids with generous spacing and information blocks
- Every layout should feel *designed*, never improvised
- Use containers to frame content: underlines (labels), open boxes (groups), closed boxes (highlights), rounded boxes (file-folder references)

**Container Specs (print/editorial):**
- Line weight: 1pt stroke, solid black only (no dashes/dots)
- Corner radius: straight corners standard, 3-5px rounded for folder/card references
- Padding: 12-16px internal minimum
- All containers align to column grid

**Textures & Overlays:**
- Optional archival/analog overlay textures
- Keep at 20-60% opacity — enhance, never distract
- Apply to backgrounds, not content layers
- Use sparingly — clarity > decoration

---

## 11. Do's & Don'ts

| ✅ Do | ❌ Don't |
|------|---------|
| Use CSS variables for all colors | Hardcode hex values in components |
| Use `btn`, `tm-card`, `data-table` class system | Invent new ad-hoc button/card styles |
| Use `--border`, `--border-2`, `--border-3` for all borders | Use `border-gray-700` or any Tailwind gray |
| Use the 4-tier text hierarchy (t1→t4) | Use `text-white`, `text-gray-400`, etc. |
| One `btn-primary` per card/section | Multiple primary buttons competing |
| Brand green (#009C55) only for primary actions + active states | Use green as a decorative color |
| 1px borders throughout | 2px+ borders (except focus rings) |
| `text-[nav/section/label]` + uppercase for labels | Mixed-case navigation and system labels |
| Pixel art icons (Andrés Higueros set) | Generic Lucide/Heroicons in isolation |
| Empty states with icon + title + description + CTA | Blank areas with no explanation |
| Fixed-height tabs with `border-bottom` indicator only | Tabs that shift layout on active |

---

## 12. Tailwind Usage Guide

### Correct token usage
```jsx
// Colors
className="bg-surface text-t1"
className="bg-surface-2 border border-border-2"
className="text-brand-1"
className="text-status-red bg-status-red-bg"

// Typography
className="text-nav uppercase tracking-[0.05em]"
className="text-label uppercase"
className="text-kpi"

// Spacing
className="p-5"         // 20px — card body padding
className="gap-4"       // 16px — standard gap
className="gap-[28px]"  // section-gap (use CSS var when possible)
```

### What NOT to use
```jsx
// Avoid generic Tailwind colors
"text-gray-400"    → use "text-t3"
"bg-gray-900"      → use "bg-surface-2"
"border-gray-700"  → use "border-border-2"
"text-green-500"   → use "text-brand-1"
```

---

## 13. File Locations

| Asset | Location |
|-------|----------|
| CSS tokens & component classes | `src/index.css` |
| Tailwind config | `tailwind.config.js` |
| Global layout | `src/components/Layout.tsx` |
| This design system | `DESIGN_SYSTEM.md` (project root) |
| Brandbook (PDF) | `~/Downloads/TheManager-Brandbook-2025.pdf` |
| Brand logos | `~/Downloads/brand-full-color-*.zip` |
