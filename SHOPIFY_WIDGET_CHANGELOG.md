# Shopify Widget Uitbreiding - Changelog

## ✨ Nieuwe Features (Versie 2.0)

### **🛍️ Shopify Storefront Widget**
Volledig nieuwe klantgerichte interface voor weergave op Shopify stores.

**Features:**
- ✅ Real-time actieve bestelling display
- ✅ Klantnaam weergave
- ✅ Product informatie (automatisch uit order)
- ✅ Live timer (elapsed time sinds order actief)
- ✅ Automatische updates (elke 5 seconden)
- ✅ Responsive design (mobiel + desktop)
- ✅ Custom branding per shop
- ✅ "Wachtrij gesloten" status indicator

**Toegang:**
```
https://your-domain.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID
```

**Gebruik:**
- Embed via iframe in Shopify theme
- Zie `SHOPIFY_WIDGET_SETUP.md` voor volledige installatie instructies
- URL kopiëren via admin panel (nieuwe oranje knop)

---

### **📦 Product Informatie Opslag**
Orders bevatten nu automatisch product details.

**Database:**
- Nieuwe kolom: `queue_entries.product_info` (TEXT)
- Automatisch gevuld via Shopify webhook
- Format: `"1x Standaard (1 kg)"` of `"2x Product A + 1x Product B"`

**Implementatie:**
- Webhook parset `line_items` uit Shopify order
- Extract: product title, variant, quantity
- Opgeslagen bij order creatie

**Migration:**
```sql
-- Zie ADD_PRODUCT_INFO.sql
ALTER TABLE queue_entries ADD COLUMN product_info TEXT;
```

---

### **🔌 API Uitbreidingen**

#### **Public State API Update**
`/api/queue/public-state` nu met extra fields:
```typescript
{
  active: {
    id: number;
    first_name: string;
    product_info: string;  // ⬅️ NIEUW
    created_at: string;    // ⬅️ NIEUW
  } | null;
  waiting: [...];
  totalWaiting: number;
  queueClosed: boolean;
  colors: {...};
}
```

#### **Webhook Response Update**
`/api/webhook/order-paid` response bevat nu:
```typescript
{
  ok: true;
  status: "eligible";
  firstName: string;
  orderNumber: string;
  productInfo: string;  // ⬅️ NIEUW
  shippingTitles: string[];
  shopName: string;
}
```

---

### **🎨 Admin Panel Updates**

**Nieuwe knoppen:**
- 🛍️ "Kopieer Shopify Widget URL" (oranje)
- 🔗 "Open" widget in nieuw tabblad

**Locatie:**
Shop selector dropdown → URL knoppen onder dropdown

---

## 📋 Installatie Nieuwe Features

### **1. Database Migratie**
```bash
# In Supabase SQL Editor:
```
```sql
-- Run ADD_PRODUCT_INFO.sql
ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS product_info TEXT;
```

### **2. Code Deployment**
```bash
git pull origin main
npm install  # (als dependencies zijn veranderd)
```

### **3. Vercel Deployment**
```bash
# Automatisch via Git push, of:
vercel --prod
```

### **4. Shopify Integratie**
Volg `SHOPIFY_WIDGET_SETUP.md` voor theme integratie.

---

## 🧪 Testing Checklist

- [ ] Database migratie succesvol
- [ ] Nieuwe orders krijgen `product_info` via webhook
- [ ] `/shopify-widget?shopId=XXX` laadt correct
- [ ] Timer telt correct (real-time update)
- [ ] Product info wordt getoond
- [ ] Responsive design werkt (mobiel/tablet/desktop)
- [ ] Shop colors worden toegepast
- [ ] "Wachtrij gesloten" status werkt
- [ ] Admin panel knoppen werken
- [ ] URL kopiëren naar clipboard werkt

---

## 🔄 Backwards Compatibility

**✅ Volledig backwards compatible:**
- Bestaande overlay (`/overlay`) blijft werken
- Admin panel behoud alle functies
- Oude orders zonder `product_info` tonen fallback
- Bestaande API endpoints ongewijzigd (alleen extended)

**Geen breaking changes!**

---

## 📊 Performance

**Widget polling:**
- Interval: 5 seconden (configureerbaar)
- Lightweight API call (~1KB response)
- Client-side timer (geen extra requests)

**Database impact:**
- 1 extra kolom (TEXT, nullable)
- Geen extra indexes nodig
- Minimale storage overhead

---

## 🆕 Nieuwe Bestanden

```
ADD_PRODUCT_INFO.sql              # Database migratie
SHOPIFY_WIDGET_SETUP.md           # Installatie handleiding
SHOPIFY_WIDGET_CHANGELOG.md       # Dit bestand
src/pages/shopify-widget.tsx      # Widget component
```

**Modified bestanden:**
```
src/pages/api/webhook/order-paid.ts    # Product parsing
src/pages/api/queue/public-state.ts    # Extra fields
src/pages/admin.tsx                     # Nieuwe knoppen
```

---

## 💰 Pricing

Deze uitbreiding is gefactureerd als **separate module**:
- €900 development
- Inclusief: widget, database, API's, documentatie
- Production-ready code
- Shopify integratie support

---

## 🚀 Roadmap (Toekomstige Features)

Mogelijke uitbreidingen:
- [ ] WebSocket voor instant updates (i.p.v. polling)
- [ ] Product afbeeldingen tonen
- [ ] Queue positie indicator ("Je bent #5 in de rij")
- [ ] Notificaties wanneer je aan de beurt bent
- [ ] Custom animations per shop
- [ ] Multiple talen support

---

## 📞 Support

Voor vragen over deze uitbreiding:
1. Check `SHOPIFY_WIDGET_SETUP.md` voor installatie
2. Test widget direct: `/shopify-widget?shopId=YOUR_ID`
3. Controleer console (F12) voor errors
4. Verifieer database migratie

---

**Versie:** 2.0  
**Release Date:** Maart 2026  
**Status:** ✅ Production Ready
