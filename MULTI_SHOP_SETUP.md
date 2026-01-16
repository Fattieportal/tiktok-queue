# Multi-Shop Queue System - Setup Instructies

## 🚀 Overzicht
Het systeem ondersteunt nu meerdere webshops met separate wachtrijen per shop.

## 📋 Stap 1: Database Migratie

Run de SQL queries in `DATABASE_MIGRATION.sql` in je Supabase SQL Editor:

```sql
-- Zie DATABASE_MIGRATION.sql voor de volledige queries
```

Dit maakt:
- `shops` table aan
- Voegt `shop_id` toe aan `queue_entries` en `queue_actions`
- Maakt indexes voor betere performance
- Voegt "removed" status toe aan de constraint

## 🔐 Stap 2: Environment Variables

Voor elke shop moet je een SHOPIFY_SECRET toevoegen in Vercel:

### Format:
```
SHOPIFY_SECRET_<SHOP_NAME_UPPERCASE>=your_shopify_webhook_secret
```

### Voorbeelden:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin
ADMIN_KEY=your_admin_key

# Shopify Webhooks - één per shop
SHOPIFY_SECRET_DEFAULT=secret_for_default_shop
SHOPIFY_SECRET_MYSTERYBOXNL=secret_for_mysteryboxnl
SHOPIFY_SECRET_SHOP2=secret_for_shop2
```

### Environment Variables Toevoegen in Vercel:

1. Ga naar je Vercel project
2. Klik op **Settings** → **Environment Variables**
3. Voeg de nieuwe variable toe (bijv: `SHOPIFY_SECRET_MYSTERYBOXNL`)
4. Vul de waarde in (je Shopify webhook secret)
5. Klik **Save**
6. **BELANGRIJK:** Je ziet deze popup:
   ```
   Added Environment Variable successfully. A new deployment 
   is needed for changes to take effect.
   ```
7. **Klik op "Redeploy"** - Anders werkt de nieuwe shop niet!

**Let op:** 
- De shop naam moet exact overeenkomen met de `name` in de database (lowercase, underscores i.p.v. spaties)
- Zonder redeploy zijn de nieuwe environment variables niet beschikbaar
- Je kunt meerdere variables tegelijk toevoegen en dan 1x redeployen



## 🏪 Stap 3: Shops Aanmaken

1. Log in op het admin panel (`/admin`)
2. Klik op "Beheer Shops"
3. Vul de shop details in:
   - **Shop naam**: Technische naam (bijv: `mysteryboxnl`, `shop2`)
   - **Display naam**: Mooie naam (bijv: `MysteryBox.nl`, `Shop 2`)
   - **Shopify Shop Domain**: Wordt automatisch ingevuld bij eerste webhook! Laat leeg.
4. Klik "Shop Toevoegen"
5. **BELANGRIJK:** Voeg nu `SHOPIFY_SECRET_<SHOPNAME>` toe in Vercel:
   - Ga naar Vercel → Settings → Environment Variables
   - Voeg toe: `SHOPIFY_SECRET_MYSTERYBOXNL` (bijvoorbeeld)
   - Klik **Save**
   - Klik **Redeploy** in de popup die verschijnt!
6. Wacht tot deployment klaar is (~30 seconden)
7. De shop is nu klaar voor gebruik!


## 🔗 Stap 4: Shopify Webhooks Configureren

Voor elke shop in Shopify:

1. Ga naar **Settings → Notifications → Webhooks**
2. Maak een nieuwe webhook aan:
   - **Event**: `Order payment`
   - **Format**: JSON
   - **URL**: `https://your-domain.com/api/webhook/order-paid`
   - **API version**: Latest
3. Sla op

De webhook detecteert automatisch de juiste shop via de `x-shopify-shop-domain` header.

## 📺 Stap 5: Overlay voor TikTok Live

### Dynamische Overlay URL:
```
https://your-domain.com/overlay?shopId=<SHOP_ID>
```

### Shop ID vinden:
1. Log in op admin panel
2. Klik op "Beheer Shops"
3. Kopieer de UUID onder "ID:" bij de juiste shop

### Voorbeeld:
```
https://your-domain.com/overlay?shopId=550e8400-e29b-41d4-a716-446655440000
```

Voeg deze URL toe als Browser Source in TikTok Live Studio / OBS.

## � Stap 6: Kleuren Aanpassen (Optioneel)

Elke shop kan eigen kleuren hebben voor de overlay!

### Kleuren Instellen:

1. Log in op admin panel
2. Klik op "Beheer Shops"
3. Klik op **🎨 Kleuren** bij de gewenste shop
4. Pas de kleuren aan:
   - **Primaire Kleur**: Kleur van de namen (standaard: geel #FFD400)
   - **Text Kleur**: Kleur van "En nog X meer" text (standaard: zwart #000000)
   - **Achtergrond Kleur**: Achtergrond van naam vakjes (standaard: rgba(0, 0, 0, 0.6))
5. Toggle achtergronden aan/uit:
   - ✅ **Toon achtergrond bij namen**: Zwarte vakjes om namen
   - ✅ **Toon achtergrond bij "En nog X meer"**: Gekleurde achtergrond
6. Bekijk **Live Preview** om te zien hoe het eruitziet
7. Klik **Opslaan**
8. Refresh je overlay → nieuwe kleuren!

### Voorbeelden:
- **Rood theme**: `#FF0000` (primary), `#FFFFFF` (text), `rgba(0, 0, 0, 0.7)` (background)
- **Blauw theme**: `#00BFFF` (primary), `#000000` (text), `rgba(255, 255, 255, 0.3)` (background)
- **Alleen tekst**: Beide achtergrond toggles uit ⬜ voor minimalistisch design

## �🎯 Gebruik Admin Panel

1. **Login**: Gebruik je ADMIN_KEY
2. **Shop Selecteren**: Kies een shop uit het dropdown menu
3. **Queue Beheren**: Alle knoppen (Next, Skip, Undo, Reset, Remove) werken nu per shop
4. **Handmatig Toevoegen**: Voeg namen toe aan de geselecteerde shop
5. **Shops Beheren**: Klik "Beheer Shops" om shops aan te maken/verwijderen
6. **Kleuren Aanpassen**: Klik "🎨 Kleuren" om overlay kleuren per shop in te stellen
7. **Overlay URL**: Klik "📋 Kopieer Overlay URL" om de URL direct te kopiëren

## 🛠 API Endpoints

Alle queue endpoints hebben nu een `shopId` parameter nodig:

### State (Admin Only):
```
GET /api/queue/state?key=ADMIN_KEY&shopId=SHOP_ID
```

### Public State (Voor Overlay):
```
GET /api/queue/public-state?shopId=SHOP_ID
```

### Queue Actions (Admin Only):
```
POST /api/queue/next?key=ADMIN_KEY&shopId=SHOP_ID
POST /api/queue/skip?key=ADMIN_KEY&shopId=SHOP_ID
POST /api/queue/undo?key=ADMIN_KEY&shopId=SHOP_ID
POST /api/queue/reset?key=ADMIN_KEY&shopId=SHOP_ID
POST /api/queue/add?key=ADMIN_KEY&shopId=SHOP_ID
  Body: { firstName: "Naam", shopId: "SHOP_ID" }
POST /api/queue/remove?key=ADMIN_KEY&shopId=SHOP_ID
  Body: { id: 123 }
```

### Shop Management (Admin Only):
```
GET /api/shops/list?key=ADMIN_KEY
POST /api/shops/create?key=ADMIN_KEY
  Body: { name: "shopname", displayName: "Shop Name", shopifyShopDomain: "shop.myshopify.com" }
POST /api/shops/delete?key=ADMIN_KEY
  Body: { id: "SHOP_ID" }
```

## ⚠️ Belangrijke Notities

1. **Environment Variables**: Vergeet niet om voor elke nieuwe shop een `SHOPIFY_SECRET_<SHOPNAME>` toe te voegen!
2. **Server Restart**: Na het toevoegen van env variables moet je Next.js herstarten
3. **Shop Name Format**: Shop namen worden automatisch lowercase gemaakt en spaties vervangen door underscores
4. **Verwijderen**: Bij het verwijderen van een shop worden alle queue entries EN actions ook verwijderd (CASCADE)
5. **Default Shop**: Een "default" shop wordt automatisch aangemaakt tijdens de migratie voor bestaande data

## 🐛 Troubleshooting

### "shopId is required" error
- Zorg dat je een shop hebt geselecteerd in het admin panel
- Check of de shopId parameter in de URL staat bij API calls

### "Shop not found" bij webhook
- Check of de shop met het juiste `shopify_shop_domain` bestaat in de database
- Zorg dat `is_active` op `true` staat

### "SHOPIFY_SECRET_X missing" error
- Voeg de juiste env variable toe aan `.env`
- Herstart je Next.js server
- Check of de shop naam exact overeenkomt (UPPERCASE in env variable)

### Overlay toont geen data
- Check of de `shopId` parameter in de URL correct is
- Verifieer dat er wachtende personen zijn voor die specifieke shop
- Open de browser console voor foutmeldingen

## ✅ Checklist voor Nieuwe Shop

- [ ] Shop aangemaakt via "Beheer Shops" in admin panel
- [ ] Shop ID genoteerd
- [ ] `SHOPIFY_SECRET_<SHOPNAME>` toegevoegd aan `.env`
- [ ] Next.js server herstart
- [ ] Shopify webhook geconfigureerd met juiste URL
- [ ] Shopify webhook test succesvol
- [ ] Overlay URL aangemaakt met shopId parameter
- [ ] Overlay getest in TikTok Live Studio / OBS

## 🎉 Klaar!

Je kunt nu meerdere shops beheren, elk met hun eigen wachtrij, overlay, en Shopify integratie!
