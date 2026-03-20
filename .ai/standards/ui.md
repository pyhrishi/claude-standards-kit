# UI STANDARDS v1.1 — ALWAYS APPLY
> Scope: ALL frontend development. Stack: React + Bootstrap + TypeScript.
> Severity: [MUST] = blocks merge · [SHOULD] = default · [AVOID] = never do

---

## LAYOUT & DESIGN CONSISTENCY

> **Source of truth: Figma.** All values — font sizes, weights, spacing, colours, border radii, shadows — come directly from the Figma design files. Nothing is assumed or prescribed here.

### Typography
- [MUST] All font sizes, weights, and line heights taken from Figma Text Styles — no assumed values
- [MUST] All font sizes defined as CSS variables extracted from Figma — no inline declarations in components
- [MUST] Font family matches the Figma file exactly
- [MUST] CSS token names match Figma Text Style names (e.g. Figma "Body/Regular" → `--text-body-regular`)
- [AVOID] Any font size, weight, or line height not present in Figma Text Styles
- [AVOID] Hardcoded pixel values in component CSS — values must come from Figma-extracted tokens

### Typography Tokenization (UI-01-25 to UI-01-27)
Font sizes and weights must use centralized utility classes — not declared per component.
```css
.f-11 { font-size: 11px; }   .f-12 { font-size: 12px; }
.f-14 { font-size: 14px; }   .f-16 { font-size: 16px; }
.fw-400 { font-weight: 400; } .fw-500 { font-weight: 500; }
.fw-600 { font-weight: 600; } .fw-700 { font-weight: 700; }
```
- [MUST] Font sizes via centralized utility classes (f-11, f-12, f-14) — not per-component CSS
- [MUST] Font weights via centralized utility classes (fw-400, fw-500, fw-600) — not per-component CSS
- [AVOID] Declaring `font-size` or `font-weight` directly inside component CSS files

### Spacing & Layout
- [MUST] All spacing values extracted from Figma Auto Layout and frame dimensions — not approximated
- [MUST] Page grid (columns, gutters, margins) must match Figma grid overlay settings exactly
- [MUST] Component internal spacing (padding, gap) must match the Auto Layout values in the Figma component
- [MUST] Spacing values stored as CSS variables — components reference variables, not raw pixels
- [AVOID] Estimating spacing by eye — always measure from Figma Inspect panel
- [AVOID] Inconsistent spacing on equivalent elements across pages of the same product

### Colours
- [MUST] All colours extracted from Figma Colour Styles or Variables — no colours assumed or invented
- [MUST] Colour token names in code match Figma names (e.g. Figma "Primary/500" → `--color-primary-500`)
- [MUST] No raw hex values in component files — always reference the CSS variable from Figma
- [MUST] If a colour appears in Figma with no named style, raise with design lead before coding — do not guess
- [AVOID] Using a colour not present in the Figma Colour Styles for that product

### Project Color Token Standardization (UI-01-28 to UI-01-30)
- [MUST] All project colours defined as CSS variables or Tailwind tokens: `var(--primary-color)`
- [MUST] Gradient styles defined as reusable utility classes — not inline per component
- [AVOID] Hardcoding hex colour values inside component files

### Component Visual Properties (border radius, shadows, icon sizes)
- [MUST] Border radius values match Figma component definitions — use Inspect panel
- [MUST] Box shadow / elevation values match Figma Effect Styles
- [MUST] Icon sizes match the Figma component or frame dimensions
- [MUST] Any property not specified in Figma must be flagged to design before implementation
- [AVOID] Estimating or approximating any visual property — always measure from Figma

---

## COMPONENT REUSABILITY

### Architecture layers
```
Design Tokens  →  CSS variables (colours, spacing, type)
Atom           →  Button · Input · Badge · Spinner · Icon
Molecule       →  FormField · SearchBar · Pagination · StatusBadge
Organism       →  DataTable · SideNav · FilterPanel · ModalDialog
Page Template  →  Layout wiring (DashboardLayout, FormPageLayout)
Page           →  Business logic + API calls (ProjectsListPage)
```
- [MUST] Business logic exists only in the Page layer — Atoms and Molecules are purely presentational
- [MUST] All shared components in a single shared library — never duplicated per product
- [MUST] Components accept props for all customisable behaviour — no hardcoded internal variants
- [MUST] Every shared component has a TypeScript prop interface
- [MUST] Component files named PascalCase: `DataTable.tsx` not `datatable.js`
- [AVOID] Copying and modifying a component instead of extending via props
- [AVOID] Two versions of the same component: `Button.tsx` and `CustomButton.tsx`

### Mandatory shared components — always use, never reimplement
| Component | What it handles |
|---|---|
| `AppButton` | All button variants (primary, secondary, danger, ghost) — one component, variant prop |
| `AppInput / FormField` | Input + label + helper text + error state + required indicator |
| `AppSelect` | Dropdown — wraps react-select with standard styling and error state |
| `AppModal` | All dialogs — title, body, footer, size variants, close (X + Escape) |
| `AppToast / Notify` | All toast notifications — wraps approved library |
| `AppDataTable` | All data tables — sorting, pagination, search, loading, empty state |
| `ConfirmDialog` | Destructive action confirmation — before ALL delete/irreversible actions |
| `EmptyState` | Zero-result state — icon + message + optional CTA — never a blank space |
| `AppSpinner` | Loading states — inline and full-page variants |
| `ErrorBoundary` | Catches render errors — friendly message + monitoring log |
| `PageHeader` | Consistent page title, breadcrumb, and primary action area |

---

## DESIGN & INTERACTION STANDARDS

### Form Validation
- [MUST] Errors shown inline directly below the failing field — never in a popup
- [MUST] Error messages are specific: `"Email is required"` not `"Invalid input"`
- [MUST] Required fields marked with `*` before the label — consistent across all forms
- [MUST] Validation triggers on blur and on submit — not on every keystroke
- [MUST] Errors clear automatically when the value becomes valid
- [MUST] Submit button disabled/spinner while request is in flight
- [AVOID] Browser-native validation popups — use `novalidate` on all forms

### Toast Notifications
| Type | Duration | Trigger |
|---|---|---|
| Success (green) | 3s auto-dismiss | Action completed |
| Error (red) | Persistent — user dismisses | Action failed / API error |
| Warning (amber) | 5s | Partial success / needs attention |
| Info (blue) | 4s | Background update |

- [MUST] All toasts via `AppToast` component — never `cogo-toast` directly in page code
- [MUST] Destructive actions (delete, archive, revoke) ALWAYS require `ConfirmDialog` first
- [MUST] Maximum one toast visible at a time — queue additional
- [AVOID] `alert()` `confirm()` `prompt()` — use AppModal and AppToast

### Loading & Empty States
- [MUST] Every data-fetching component shows spinner/skeleton — never a blank area
- [MUST] Every list/table shows `EmptyState` when zero results — never blank
- [MUST] Loading state disables interactive elements — prevents duplicate submissions
- [SHOULD] Skeleton preferred over spinner for content-heavy pages

### Modals
- [MUST] All modals via `AppModal` — consistent header, footer, close button
- [MUST] Always has title + close (X button + Escape key)
- [MUST] Size variants: sm 400px · md 600px · lg 800px · xl fullscreen
- [AVOID] Modals deeper than 2 levels · modal opening a modal

---

## RESPONSIVE DESIGN

**Current status: Desktop-first. Full responsive requires leadership decision.**

### Current minimum standard (always apply)
- [MUST] All pages render without horizontal scroll at 1280px minimum
- [MUST] Minimum supported: 1280 × 768px desktop
- [MUST] All interactive elements minimum 36×36px click target
- [AVOID] Fixed pixel widths on containers causing overflow at standard resolutions

### If full responsive is approved (leadership decision required first)
| Breakpoint | Width | Device |
|---|---|---|
| xs | < 576px | Mobile portrait |
| sm | 576–767px | Mobile landscape |
| md | 768–991px | Tablet |
| lg | 992–1199px | Small desktop |
| xl | 1200px+ | Standard desktop |

---

## LIBRARY HEALTH AUDIT — CURRENT STACK STATUS

### 🔴 CRITICAL — Fix before next production release

| Library | Issue | Replace With |
|---|---|---|
| `xlsx` (SheetJS CE v0.18.5) | **CVE-2023-30533**: HIGH severity prototype pollution. No patches since Mar 2022. | `exceljs` |
| `@material-ui/core` v4 | **Officially deprecated** Sep 2021. No security updates. | `@mui/material` v5+ |
| `react-excel-renderer` v1.1.0 | Depends on xlsx v0.14.x (multiple CVEs). Last release Feb 2019. | Build on `exceljs` directly |

### ⚫ DEAD — Replace in next planning cycle (no React 18, no maintenance)

| Library | Last Release | Replace With |
|---|---|---|
| `react-bootstrap-table-next` + paginator + toolkit | May 2020 | `@tanstack/react-table` v8 |
| `@react-keycloak/web` | Oct 2020 (repo archived) | `keycloak-js` + custom React context/hooks |
| `cogo-toast` | Feb 2020 | `react-hot-toast` or `react-toastify` via `AppToast` wrapper |
| `react-outside-click-handler` | Sep 2019 | Native `useRef` + `addEventListener` pattern |

### 🟡 STALE — Stable but unmaintained, plan replacement within 6 months

| Library | Last Release | Notes |
|---|---|---|
| `moment` / `moment-timezone` | Dec 2023 (maintenance mode) | New code: use `date-fns` (already in stack) |
| `react-picky` | Sep 2020 | Replace with `react-select` `isMulti` |
| `react-tag-input-component` | Oct 2022 | Replace with `react-select` creatable |
| `redux-persist` | Sep 2019 | Stable, widely used, no CVEs — monitor |
| `file-saver` | Nov 2020 | Stable, no CVEs — low priority |
| `react-idle-timer` | Jun 2023 | Monitor for activity |

### ✅ HEALTHY — No action, keep versions current

`bootstrap` · `react-bootstrap` · `reactstrap` · `react-apexcharts` · `@nivo/core` · `recharts` ·
`react-gauge-chart` · `react-circular-progressbar` · `react-datepicker` · `react-date-range` ·
`date-fns` · `react-select` · `react-phone-number-input` · `react-drag-drop-files` ·
`react-lottie` · `redux` · `redux-thunk` · `redux-promise-middleware` · `axios` · `keycloak-js`

---

## DATA TABLE STANDARD (Section 05)

- [MUST] All new table implementations use `@tanstack/react-table` v8
- [MUST] Existing `react-bootstrap-table-next` tables must be migrated to TanStack Table
- [AVOID] Introducing any new table library — TanStack Table only

```js
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
```

---

## ICON USAGE STANDARD (Section 06)

- [MUST] All icons must use SVG format
- [SHOULD] Icons come from a centralized icon library shared across products
- [AVOID] PNG, JPG, WebP, or icon fonts for any icon or small UI element

---

## PERFORMANCE GUIDELINES (Section 07)

- [MUST] Large data lists and tables use virtualisation — only render visible rows
- [MUST] Heavy components (charts, modals, report views) use `React.lazy()` + `Suspense`
- [SHOULD] Never render large datasets without pagination or virtualisation

```js
// Virtualisation
import { useVirtualizer } from '@tanstack/react-virtual';

// Lazy loading
const ReportChart = React.lazy(() => import('./ReportChart'));
<Suspense fallback={<AppSpinner />}><ReportChart /></Suspense>
```

---

## SECURITY UI GUIDELINES (Section 08)

- [MUST] No inline CSS — `style={{ }}` or `style="..."` prohibited in all components
- [MUST] No inline JS event handlers — `onclick="..."` in markup is prohibited
- [MUST] All applications must comply with Content Security Policy (CSP)

**CSP compliance checklist:**
```
[ ] No style={{ }} or style="..." in JSX/HTML
[ ] No onclick="..." or inline event handler attributes
[ ] All styles via CSS class names referencing the token system
[ ] No dynamically injected <style> tags at runtime
[ ] CSP header correctly configured in server / CDN
```

---

## CHECKLIST — BEFORE EVERY UI COMPONENT / PAGE IS MERGED

```
[ ] Typography: utility classes used (f-11, fw-400) — no per-component font declarations
[ ] All font sizes via design token variables — no hardcoded px values
[ ] All spacing on base-8 scale via token variables
[ ] All colours via --color-* CSS custom properties — no hex literals
[ ] WCAG contrast checked (4.5:1 text, 3:1 UI)
[ ] Shared components used — AppButton, AppModal, AppToast, AppDataTable, etc.
[ ] No business logic in Atom or Molecule components
[ ] Form validation: inline errors, specific messages, clears on fix, submit disabled in-flight
[ ] Destructive actions guarded by ConfirmDialog
[ ] Loading state has spinner/skeleton — no blank areas
[ ] Zero-results has EmptyState — no blank areas
[ ] No alert() / confirm() / prompt() / cogo-toast direct usage
[ ] No use of CRITICAL or DEAD libraries in new code
[ ] Desktop renders correctly at 1280px with no horizontal scroll
[ ] Tables use @tanstack/react-table — not react-bootstrap-table-next
[ ] All icons are SVG — no PNG or JPG icons
[ ] Large datasets use virtualisation or pagination
[ ] Heavy components use React.lazy()
[ ] No inline style={{ }} or style="..." in any component
[ ] No onclick="..." or inline JS in markup
[ ] No use of CRITICAL or DEAD libraries in new code
```
