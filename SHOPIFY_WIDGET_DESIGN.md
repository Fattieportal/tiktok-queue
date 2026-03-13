# 🎨 Shopify Widget - Design Preview

## Widget Design Specificaties

### **Layout Structuur**

```
┌─────────────────────────────────────────────────┐
│  [Gradient Dark Background]                     │
│                                                  │
│  ┌───────────────────────────────────────────┐ │
│  │  [Dark Card - #1f1f1f]                    │ │
│  │                                            │ │
│  │  🟠 LIVE WACHTRIJ                         │ │
│  │  ────────────────────────────────────────  │ │
│  │                                            │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │  [Orange Border Card]                │ │ │
│  │  │                                       │ │ │
│  │  │  ┌─────┐              ⏱️ 23:45      │ │ │
│  │  │  │ #1  │                             │ │ │
│  │  │  └─────┘                             │ │ │
│  │  │                                       │ │ │
│  │  │  Mathilda                            │ │ │
│  │  │                                       │ │ │
│  │  │  📦 1x Standaard (1 kg)              │ │ │
│  │  │                                       │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  │                                            │ │
│  │  Live updates • Automatisch ververst      │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## **Kleur Schema**

### **Default Colors (Oranje Theme)**
```css
/* Primary (Accents) */
--primary-color: #FF9500;      /* Oranje - Namen, badges, borders */

/* Text */
--text-color: #FFFFFF;         /* Wit - Primaire tekst */
--text-secondary: rgba(255, 255, 255, 0.8);  /* Licht gedimmed */
--text-muted: rgba(255, 255, 255, 0.5);      /* Footer text */

/* Backgrounds */
--bg-gradient: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
--card-bg: #1f1f1f;            /* Donkergrijs */
--section-bg: rgba(0, 0, 0, 0.8);  /* Semi-transparant zwart */

/* Effects */
--border-orange: 3px solid #FF9500;
--shadow-orange: 0 8px 24px rgba(255, 149, 0, 0.4);
--glow-orange: 0 4px 12px rgba(255, 149, 0, 0.3);
```

### **Custom Shop Colors**
Automatisch uit database:
- `primary_color` → Badge, naam, timer, border
- `text_color` → Algemene tekst
- `background_color` → Section backgrounds

---

## **Typography**

```css
/* Header */
h1: 28px, bold, #FFFFFF

/* Positie Badge (#1) */
48px, bold, #000000 op oranje achtergrond

/* Klantnaam */
48px, bold, #FF9500, text-shadow voor diepte

/* Product Info */
22px, regular, #FFFFFF (90% opacity)

/* Timer */
28px, bold, #FF9500, monospace font

/* Footer */
14px, regular, #FFFFFF (50% opacity)
```

---

## **Component Breakdown**

### **1. Container**
```typescript
width: 100%
minHeight: 100vh
background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)
padding: 20px
center aligned
```

### **2. Card**
```typescript
maxWidth: 600px
background: #1f1f1f
borderRadius: 24px
padding: 40px
boxShadow: 0 20px 60px rgba(0, 0, 0, 0.5)
```

### **3. Header (Live Indicator)**
```typescript
display: flex
alignItems: center
gap: 12px

[Pulse Dot]
  - 12px diameter
  - oranje (#FF9500)
  - pulse animatie (2s)

[Title]
  - "🟠 LIVE WACHTRIJ"
  - 28px bold
```

### **4. Active Order Card**
```typescript
background: gradient (dark → oranje tint)
border: 3px solid oranje
borderRadius: 20px
padding: 32px
position: relative

[Badge #1] - Absolute top-left
  - 80x80px
  - oranje achtergrond
  - zwarte tekst (#000)
  - 48px font
  - 16px border radius

[Timer] - Absolute top-right
  - Dark semi-transparent bg
  - ⏱️ icon + tijd
  - 28px font, oranje
  - Monospace

[Content Area] - Below badge
  - margin-top: 80px
  
  [Name]
    - 48px, bold, oranje
    - text-shadow voor glow
    - word-break: break-word
  
  [Product Info]
    - 📦 icon
    - 22px font
    - Light bg (rgba white 5%)
    - Padding: 16px 20px
    - Border radius: 12px
```

### **5. Empty State**
```typescript
background: rgba(0, 0, 0, 0.8)
borderRadius: 16px
padding: 32px
textAlign: center

[Icon] - ⏳
  - 48px
  
[Title]
  - "Geen actieve bestelling"
  - 22px, bold
  
[Subtitle]
  - "Wacht op de volgende..."
  - 16px, dimmed
```

### **6. Closed State**
```typescript
background: rgba(255, 68, 68, 0.1)
border: 2px solid #FF4444
borderRadius: 16px
padding: 32px

[Icon] - 🔒 (48px)
[Message] - "Wachtrij is gesloten" (24px, rood)
```

---

## **Animations**

### **Pulse (Live Indicator)**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

animation: pulse 2s ease-in-out infinite;
```

### **Smooth Transitions**
```css
transition: all 0.3s ease;  /* Hover states */
```

---

## **Responsive Breakpoints**

### **Desktop (1200px+)**
- Card maxWidth: 600px
- Full padding: 40px
- Large fonts (48px names)

### **Tablet (768px - 1199px)**
- Card maxWidth: 90%
- Padding: 32px
- Medium fonts (40px names)

### **Mobile (< 768px)**
- Card maxWidth: 100%
- Padding: 24px
- Smaller fonts (32px names)
- Badge: 60x60px (i.p.v. 80x80)
- Timer font: 24px (i.p.v. 28px)

---

## **States Overzicht**

### **1. Active Order (Normaal)**
- Oranje border card
- #1 badge visible
- Timer counting up
- Name + product info shown

### **2. No Active Order**
- Gray card (no border)
- ⏳ icon
- "Geen actieve bestelling"
- Subtitle tekst

### **3. Queue Closed**
- Red accent color
- 🔒 icon
- Red border
- "Wachtrij is gesloten"

### **4. Loading**
- Show last known state
- Graceful degradation
- No error messages visible

---

## **Accessibility**

```typescript
// Semantic HTML
<h1> voor hoofdtitel
<div> met role="status" voor live updates

// Alt text
"Live TikTok Wachtrij" voor iframe title

// Contrast ratios
- White on dark: 15:1+ ✅
- Orange on black: 8:1+ ✅
- Orange on dark gray: 6:1+ ✅

// Font sizes
- Minimum 14px (footer)
- Body text 22px+
- Headings 28px+
```

---

## **Performance**

### **Polling Strategy**
```typescript
Initial load: immediate
Refresh rate: 5000ms (5 seconds)
Timer update: 1000ms (1 second, client-side)

Optimizations:
- Client-side timer (geen extra API calls)
- Lightweight API response (~1KB)
- Graceful error handling (geen crashes)
```

### **Loading Strategy**
```typescript
iframe loading="lazy"  // Lazy load
Initial render: < 100ms
API response: < 200ms
Total FCP: < 500ms
```

---

## **Browser Support**

### **Tested Browsers**
- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

### **Fallbacks**
- CSS Grid → Flexbox fallback
- CSS variables → Inline styles fallback
- Modern JS → Babel transpiled

---

## **Example URL**

### **Development**
```
http://localhost:3000/shopify-widget?shopId=550e8400-e29b-41d4-a716-446655440000
```

### **Production**
```
https://your-domain.vercel.app/shopify-widget?shopId=550e8400-e29b-41d4-a716-446655440000
```

### **Embedded in Shopify**
```html
<iframe 
  src="https://your-domain.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID"
  style="width: 100%; height: 700px; border: none; border-radius: 12px;"
  title="Live TikTok Wachtrij"
  loading="lazy"
></iframe>
```

---

## **Screenshot Checklist**

Voor client presentation/documentation:

1. ✅ Active order met timer
2. ✅ Active order met lange productnaam
3. ✅ Active order met meerdere producten
4. ✅ Empty state ("Geen actieve bestelling")
5. ✅ Closed state ("Wachtrij gesloten")
6. ✅ Mobile responsive (375px)
7. ✅ Tablet responsive (768px)
8. ✅ Desktop full view (1440px)
9. ✅ Custom shop colors (bijv. geel i.p.v. oranje)
10. ✅ Timer na > 1 uur (format check)

---

**Design Status:** ✅ Complete & Production Ready
