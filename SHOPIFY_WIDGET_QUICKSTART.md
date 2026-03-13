# 🚀 Shopify Widget - Quick Start Guide

## ✅ Wat is geïmplementeerd

### **1. Database**
- ✅ `product_info` kolom toegevoegd aan `queue_entries`
- 📄 Migratie: `ADD_PRODUCT_INFO.sql`

### **2. Webhook**
- ✅ Shopify order webhook parset nu product informatie
- ✅ Format: "1x Product (Variant)" of "2x Product A + 1x Product B"
- ✅ Automatisch opgeslagen bij nieuwe orders

### **3. API**
- ✅ `/api/queue/public-state` uitgebreid met:
  - `product_info` field
  - `created_at` timestamp (voor timer)

### **4. Shopify Widget**
- ✅ Nieuwe pagina: `/shopify-widget?shopId=XXX`
- ✅ Features:
  - Live actieve bestelling (#1 positie)
  - Klantnaam
  - Product info
  - Real-time timer (mm:ss format)
  - Auto-refresh elke 5 seconden
  - Custom shop branding (colors)
  - Responsive design
  - "Wachtrij gesloten" status

### **5. Admin Panel**
- ✅ Nieuwe knoppen:
  - 🛍️ "Kopieer Shopify Widget URL" (oranje)
  - 🔗 "Open" widget preview
- ✅ Inclusief shopId in URL

### **6. Documentatie**
- ✅ `SHOPIFY_WIDGET_SETUP.md` - Volledige Shopify integratie handleiding
- ✅ `SHOPIFY_WIDGET_CHANGELOG.md` - Feature overzicht & technical details

---

## 🔧 Installatie Stappen

### **Stap 1: Database Migratie**
1. Open Supabase SQL Editor
2. Run de query uit `ADD_PRODUCT_INFO.sql`:
```sql
ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS product_info TEXT;
```
3. Klik "Run"

### **Stap 2: Code Deployment**
1. Commit alle wijzigingen:
```bash
git add .
git commit -m "feat: Shopify widget met product info en timer"
git push origin main
```

2. Vercel deployment gebeurt automatisch (of manual):
```bash
vercel --prod
```

### **Stap 3: Test de Widget**
1. Ga naar `/admin`
2. Selecteer een shop
3. Klik "🛍️ Kopieer Shopify Widget URL"
4. Open URL in nieuw tabblad
5. Controleer:
   - ✅ Design laadt correct
   - ✅ Shop colors worden toegepast
   - ✅ Timer werkt (als er actieve order is)
   - ✅ Responsive (test op mobiel)

### **Stap 4: Test Webhook**
1. Maak een test order in Shopify met "TikTok Live Unboxing" verzending
2. Betaal de order (test modus)
3. Check in admin panel of order binnenkomt
4. Verifieer dat `product_info` gevuld is

### **Stap 5: Shopify Integratie**
Volg de instructies in `SHOPIFY_WIDGET_SETUP.md` voor:
- iFrame embed in Shopify theme
- Custom section setup
- Liquid template configuratie

---

## 📋 Test Checklist

### **Database**
- [ ] `product_info` kolom bestaat
- [ ] Bestaande orders hebben NULL of placeholder
- [ ] Nieuwe orders krijgen automatisch product info

### **Webhook**
- [ ] Test order met 1 product → format: "1x Product"
- [ ] Test order met variant → format: "1x Product (Variant)"
- [ ] Test order met meerdere producten → format: "2x A + 1x B"
- [ ] Producten zonder variant tonen geen "(Default Title)"

### **Widget**
- [ ] Widget laadt op `/shopify-widget?shopId=XXX`
- [ ] Toont "Geen actieve bestelling" als queue leeg
- [ ] Toont actieve bestelling met:
  - [ ] #1 badge (oranje)
  - [ ] Klantnaam (groot, oranje)
  - [ ] Product info (met 📦 icon)
  - [ ] Timer (top right, met ⏱️ icon)
- [ ] Timer telt elke seconde bij
- [ ] Shop colors worden toegepast (uit database)
- [ ] "Wachtrij gesloten" toont 🔒 bericht
- [ ] Auto-refresh werkt (nieuwe data na 5 sec)

### **Responsive**
- [ ] Desktop (1920px) - volledig zichtbaar
- [ ] Laptop (1440px) - goed leesbaar
- [ ] Tablet (768px) - geen overlap
- [ ] Mobiel (375px) - alles past, geen scroll nodig

### **Admin Panel**
- [ ] Oranje "Shopify Widget URL" knop zichtbaar
- [ ] URL kopiëren werkt
- [ ] URL bevat juiste shopId
- [ ] "Open" knop opent widget in nieuw tabblad
- [ ] Alert toont juiste URL

### **Edge Cases**
- [ ] Order zonder product_info → toont fallback
- [ ] Shop zonder custom colors → gebruikt defaults
- [ ] Zeer lange productnaam → breekt netjes af
- [ ] Zeer lange klantnaam → past nog steeds
- [ ] Timer na 1 uur → toont "1:23" format

---

## 🐛 Troubleshooting

### **Widget toont geen data**
```bash
# Check API response
curl "https://your-domain.vercel.app/api/queue/public-state?shopId=YOUR_SHOP_ID"
```

### **Product info is NULL**
- Bestaande orders: Normaal (pre-migration)
- Nieuwe orders: Check webhook logs in Vercel
- Verifieer dat `line_items` in Shopify webhook zit

### **Timer klopt niet**
- Check browser timezone
- Verifieer `created_at` timestamp in database
- Test met fresh order

### **Kleuren kloppen niet**
- Check shop colors in admin panel
- Update colors (Color Editor)
- Widget refresh (hard reload: Ctrl+Shift+R)

---

## 📦 Bestanden Overzicht

### **Nieuwe Bestanden:**
```
ADD_PRODUCT_INFO.sql              # DB migratie
SHOPIFY_WIDGET_SETUP.md           # Shopify installatie
SHOPIFY_WIDGET_CHANGELOG.md       # Feature changelog
SHOPIFY_WIDGET_QUICKSTART.md      # Deze guide
src/pages/shopify-widget.tsx      # Widget component
```

### **Gewijzigde Bestanden:**
```
src/pages/api/webhook/order-paid.ts    # +product parsing
src/pages/api/queue/public-state.ts    # +product_info field
src/pages/admin.tsx                     # +widget URL knoppen
```

---

## 🎉 Klaar!

Je Shopify widget is nu volledig geïmplementeerd en klaar voor gebruik!

**Volgende stappen:**
1. ✅ Database migreren
2. ✅ Deployen naar production
3. ✅ Testen met test order
4. ✅ Integreren in Shopify theme
5. 🚀 Live gaan tijdens TikTok stream!

---

**Support:** Check de andere docs voor details over specifieke onderdelen.
