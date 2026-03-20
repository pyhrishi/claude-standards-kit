# FraudFighter — Frontend Rules
> Load for any UI task. Extends CLAUDE.md.

## Stack
React 18 · TypeScript · Bootstrap · Redux · Axios · Keycloak-js · TanStack Table v8 · react-virtual

## FF UI Patterns

### Decision badge — AppBadge only, never raw text or inline styles
```tsx
<AppBadge decision={FraudDecision.REVIEW} />
// Never: <span style={{color:'orange'}}>REVIEW</span>
```

### Alert priority tokens (from Figma — not hex)
```css
var(--ff-priority-high)     /* BLOCK — red   */
var(--ff-priority-medium)   /* REVIEW — amber */
var(--ff-priority-low)      /* flagged — blue */
var(--ff-pass)              /* PASS — green  */
```

### Score display — AppGauge
0.0–1.0 rendered as gauge via AppGauge (wraps react-gauge-chart).
Always show: score value + decision + top 3 contributing rules/features.
Skeleton loading while fetching — never blank.

### Alert tables — virtualisation MANDATORY
Alert volumes exceed 10k rows. Use AppDataTable (TanStack Table v8 + react-virtual).
Never render unbounded alert lists — always virtualise or paginate.

### Rule builder form
- Client-side validation of threshold ranges + expression syntax before submit
- Inline errors below each field — specific message ("Threshold must be 0.0–1.0")
- Preview impact before activating (simulation call to backend)

### Case investigation view
- Timeline of all events sorted descending by timestamp
- Entity profile panel (account, device, IP, geo)
- Related alerts grouped by entity linkage
- Action buttons (Escalate, Close, File SAR) gated by role

## All visual values from Figma
Never hardcode hex, px sizes, or border-radius values.
All from Figma Colour Styles / Text Styles / Auto Layout via CSS custom properties.

## Library rules
- Tables: `@tanstack/react-table` v8 — not react-bootstrap-table-next
- Icons: SVG only — no PNG/JPG icons
- Toast: AppToast only — not cogo-toast directly
- No inline `style={{ }}` or `onclick=` in any component (CSP + security)
