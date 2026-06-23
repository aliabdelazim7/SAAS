# UI/UX Design System & Layout Blueprint

This document defines the interface design tokens, typography scales, dynamic widget dashboard configurations, layout directions (LTR/RTL), and accessibility standards for the web and mobile applications.

---

## 1. Design Tokens (CSS Variables)

We define a modern, premium design system using Tailwind-compatible HSL color tokens. The interface supports a default Dark Mode and clean Light Mode.

```css
/* apps/web/src/app/index.css */
@theme {
  --font-sans: 'Outfit', 'Cairo', sans-serif;
}

:root {
  /* Light Mode Palette - Premium Clean Glassmorphism theme */
  --background: 220 33% 98%;
  --foreground: 224 71.4% 4.1%;
  
  --card: 0 0% 100%;
  --card-foreground: 224 71.4% 4.1%;
  
  --primary: 262 83% 58%; /* Royal Indigo */
  --primary-foreground: 210 20% 98%;
  
  --secondary: 220 14% 96%;
  --secondary-foreground: 220.9 39.3% 11%;
  
  --accent: 262 80% 96%;
  --accent-foreground: 262 83% 58%;
  
  --muted: 220 10% 90%;
  --muted-foreground: 220 8.9% 46.1%;
  
  --border: 220 13% 91%;
  --radius: 0.75rem;
}

.dark {
  /* Dark Mode Palette - Deep Space Cyberpunk theme */
  --background: 224 71% 4%;
  --foreground: 210 20% 98%;
  
  --card: 224 71% 6%;
  --card-foreground: 210 20% 98%;
  
  --primary: 263.4 70% 50.4%; /* Neon Purple */
  --primary-foreground: 210 20% 98%;
  
  --secondary: 215 27.9% 16.9%;
  --secondary-foreground: 210 20% 98%;
  
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 20% 98%;
  
  --muted: 215 27.9% 12%;
  --muted-foreground: 217.9 10.6% 64.9%;
  
  --border: 215 27.9% 16.9%;
}
```

---

## 2. Dynamic Widget Layout Grid Schema

The client dashboard is customizable. Users can add, remove, resize, and drag widgets. Layout arrays are saved in the user's database settings as JSON metadata.

### 2.1 Dashboard JSON Layout Example
```json
{
  "dashboardId": "dashboard-default-retail",
  "widgets": [
    {
      "id": "widget-sales-today",
      "type": "METRIC_CARD",
      "module": "sales",
      "grid": { "x": 0, "y": 0, "w": 3, "h": 2 },
      "properties": {
        "title": "Sales Today",
        "chartType": "SPARKLINE",
        "timeframe": "24H"
      }
    },
    {
      "id": "widget-revenue-trends",
      "type": "CHART_LINE",
      "module": "sales",
      "grid": { "x": 3, "y": 0, "w": 9, "h": 4 },
      "properties": {
        "title": "Revenue vs Expenses",
        "showLegend": true
      }
    },
    {
      "id": "widget-low-stock",
      "type": "DATA_TABLE",
      "module": "inventory",
      "grid": { "x": 0, "y": 2, "w": 3, "h": 4 },
      "properties": {
        "title": "Low Stock Items",
        "limit": 5
      }
    }
  ]
}
```
* **Grid Rendering**: Next.js uses `react-grid-layout` to map these coordinate nodes to a CSS Grid. If a module is disabled in the tenant's subscription plan, the dashboard component filters it out during the rendering cycle.

---

## 3. RTL / LTR CSS Styling Rules

To support English (Left-to-Right) and Arabic (Right-to-Left) languages in a unified codebase:

1. **Direction attribute**: Next.js sets `dir="rtl"` or `dir="ltr"` on the root `<html>` element based on the user's language selection.
2. **Tailwind Logical Properties**: Developers must use directional-neutral Tailwind utilities:
   - Instead of margin-left (`ml-4`), use margin-inline-start (`ms-4`).
   - Instead of padding-right (`pr-2`), use padding-inline-end (`pe-2`).
   - Instead of absolute positioning `left-2`, use `start-2`.
   - Instead of rounded corner classes `rounded-l-lg`, use `rounded-s-lg`.

Example Component:
```tsx
export function MetricCard({ title, value, icon }) {
  return (
    <div className="flex items-center p-4 border border-border bg-card text-card-foreground rounded-xl">
      <div className="flex-1 text-start">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
      </div>
      <div className="ms-4 p-2 bg-accent rounded-lg text-accent-foreground">
        {icon}
      </div>
    </div>
  );
}
```

---

## 4. Accessibility Compliance (WCAG 2.1 AA)

To support vision-impaired operators and ensure keyboard navigability for rapid POS checkouts:

- **Contrast Ratios**: Color variables guarantee a minimum text contrast ratio of **4.5:1** against the background (conforming to WCAG AA rules).
- **Aria attributes**: Custom components (like dropdown overlays or date Pickers) implement proper aria labels (`aria-expanded`, `aria-haspopup`, `aria-label`).
- **Keyboard Navigation (Focus Traps)**:
  - POS screens bind keyboard shortcuts: `F1` (Switch to Search), `F8` (Open Payment Dialog), `F12` (Print Receipt).
  - Modal dialogues utilize `react-focus-lock` to keep key tab inputs contained inside the active viewport modal window.
- **Screen Reader Support**: Implements descriptive, hidden `sr-only` elements for graphical charts and SVG progress bars.
