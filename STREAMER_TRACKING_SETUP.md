# 🎙️ Streamer Tracking Feature - Setup Handleiding

## 📋 Overzicht

Dit systeem houdt bij welke streamer verantwoordelijk is voor welke orders. Elke streamer kan zich "inchecken" voor een webshop voordat de livestream begint, en alle orders die tijdens hun sessie binnenkomen worden automatisch aan hen toegeschreven.

---

## 🎯 Features

- ✅ **Check-in/Check-out systeem** voor streamers
- ✅ **Automatische order tracking** - alle orders worden gekoppeld aan actieve streamer
- ✅ **Streamer statistieken dashboard** - beveiligd met admin key
- ✅ **Real-time updates** - zie direct welke streamer actief is
- ✅ **Multi-shop support** - elke shop kan een eigen actieve streamer hebben
- ✅ **Historische data** - bekijk prestaties per streamer over tijd

---

## 📦 Installatie

### **Stap 1: Database Migratie**

Voer het SQL script uit in je Supabase database:

```bash
# In Supabase SQL Editor
psql < ADD_STREAMER_TRACKING.sql
```

Of kopieer de inhoud van `ADD_STREAMER_TRACKING.sql` naar de Supabase SQL Editor en voer uit.

### **Stap 2: Deploy naar Vercel**

```bash
git add .
git commit -m "Add streamer tracking feature"
git push
```

Vercel zal automatisch deployen.

### **Stap 3: Test de Functionaliteit**

1. Ga naar `/admin`
2. Scroll naar beneden naar "🎙️ Actieve Streamer"
3. Voer een streamer naam in en klik "Check-in"
4. Maak een test order in Shopify
5. Check in admin panel dat order aan streamer is gekoppeld

---

## 🎮 Gebruik

### **Voor Eigenaren: Streamers Toevoegen**

**Voeg streamers toe via de statistieken pagina** (aanbevolen):

1. Log in op **`/streamer-stats`**
2. Selecteer de juiste webshop
3. Klik op **"+ Nieuwe Streamer"**
4. Voer de naam in (bijv: "Emma", "Lars", "Sophie")
5. Klik **"✓ Toevoegen"**
6. ✅ De streamer staat nu in de lijst voor die webshop!

**Waarom via statistieken pagina?**
- Extra beveiliging (admin key vereist)
- Overzichtelijk beheer
- Streamers verschijnen daarna in dropdown lijst in admin panel

### **Voor Admins: Streamer Inchecken**

1. Log in op **`/admin`**
2. Selecteer de juiste webshop
3. Scroll naar "🎙️ Actieve Streamer" sectie
4. **Optie A - Selecteer uit lijst**:
   - Kies een bestaande streamer uit de dropdown
   - Klik **"Check-in"**
5. **Optie B - Typ nieuwe naam**:
   - Typ een nieuwe streamer naam
   - Klik **"Check-in"**
   - De streamer wordt automatisch toegevoegd
6. ✅ De streamer is nu actief!

**Alle nieuwe orders die nu binnenkomen worden automatisch aan deze streamer toegeschreven.**

### **Voor Admins: Streamer Uitchecken**

1. **Optie A - Via Admin Panel (`/admin`)**:
   - Klik op **"Check-out"** knop naast de actieve streamer
   - De streamer wordt gemarkeerd als "offline"

2. **Optie B - Via Streamer Stats (`/streamer-stats`)**:
   - Ga naar de statistieken pagina
   - Zoek de actieve streamer (🟢 ACTIEF)
   - Klik op de **"Check-out"** knop in de acties kolom

**Na uitchecken:**
- Nieuwe orders worden NIET meer aan een streamer toegeschreven (tot de volgende check-in)
- De checkout tijd wordt vastgelegd
- De streamer blijft zichtbaar in statistieken met al hun orders

### **Voor Eigenaren: Statistieken Bekijken**

1. Ga naar **`/streamer-stats`**
2. Log in met de admin key (extra beveiliging)
3. Selecteer een webshop
4. Bekijk:
   - Totaal aantal orders per streamer
   - Voltooide vs wachtende orders
   - Check-in en check-out tijden
   - Live status (welke streamer is nu actief?)

**Of klik in het admin panel op 📊 Statistieken**

---

## 📊 Streamer Statistieken Dashboard

### **Toegang**

URL: **`https://your-domain.vercel.app/streamer-stats`**

**Beveiliging:** Vereist admin key (dubbele beveiliging bovenop normale admin)

### **Informatie per Streamer**

| Kolom | Beschrijving |
|-------|-------------|
| **▶** | Klik om order details uit te klappen |
| **Status** | 🟢 ACTIEF = streamer is nu live<br>⚫ Offline = streamer is uitgecheckt |
| **Naam** | Naam van de streamer |
| **Totaal** | Totaal aantal orders ooit |
| **Voltooid** | Aantal voltooide orders |
| **Wachtend** | Aantal orders nog in wachtrij |
| **Ingecheckt** | Datum/tijd van laatste check-in |
| **Uitgecheckt** | Datum/tijd van laatste check-out |
| **Acties** | Check-out knop (alleen voor actieve streamers) |

### **Expandable Order Details**

Klik op de **▶** pijl naast een streamer om te zien:
- **Order nummer** - Shopify order nummer
- **Klant naam** - Voornaam van de klant
- **Producten** - Volledige product informatie
- **Status** - Live status van de order (Voltooid ✓ / Actief ▶ / Wachtend ⏳)
- **Datum** - Wanneer de order binnenkwam

### **Summary Cards**

- **Totaal Streamers**: Aantal unieke streamers voor deze shop
- **Actieve Streamers**: Hoeveel streamers zijn NU live
- **Totaal Orders**: Som van alle orders van alle streamers

---

## 🔌 API Endpoints

### **1. Check-in Streamer**

```bash
POST /api/streamers/check-in?key=ADMIN_KEY
Content-Type: application/json

{
  "streamerName": "Emma",
  "shopId": "uuid-van-shop"
}
```

**Response:**
```json
{
  "success": true,
  "streamer": { "id": "...", "name": "Emma", "is_active": true },
  "message": "Emma is nu ingecheckt!"
}
```

### **2. Check-out Streamer**

```bash
POST /api/streamers/check-out?key=ADMIN_KEY
Content-Type: application/json

{
  "streamerId": "uuid-van-streamer"
}
```

### **3. Haal Actieve Streamer Op**

```bash
GET /api/streamers/active?shopId=uuid-van-shop
```

**Response:**
```json
{
  "activeStreamer": {
    "id": "...",
    "name": "Emma",
    "is_active": true,
    "checked_in_at": "2024-01-15T14:30:00Z"
  }
}
```

### **4. Lijst Alle Streamers (met Stats)**

```bash
GET /api/streamers/list?key=ADMIN_KEY&shopId=uuid-van-shop
```

**Response:**
```json
{
  "streamers": [
    {
      "id": "...",
      "name": "Emma",
      "shop_id": "...",
      "shop_name": "MyShop",
      "total_orders": 45,
      "completed_orders": 40,
      "waiting_orders": 5,
      "active_orders": 0,
      "first_order_at": "2024-01-10T12:00:00Z",
      "last_order_at": "2024-01-15T14:45:00Z",
      "checked_in_at": "2024-01-15T14:30:00Z",
      "checked_out_at": null,
      "is_active": true
    }
  ]
}
```

---

## 🔄 Automatische Koppeling

Het **`order-paid.ts`** webhook is automatisch aangepast om:

1. Bij elke nieuwe order te checken of er een actieve streamer is
2. Als er een actieve streamer is, het `streamer_id` veld in te vullen
3. Als er GEEN actieve streamer is, blijft het veld leeg (NULL)

**Je hoeft niets handmatig te doen** - dit gebeurt automatisch zodra een streamer is ingecheckt!

---

## 💡 Best Practices

### **Check-in Workflow**

1. **Voor de livestream**: Admin checkt streamer in via `/admin`
2. **Tijdens livestream**: Orders komen binnen en worden automatisch gekoppeld
3. **Na de livestream**: Admin checkt streamer uit (of laat automatisch verlopen)
4. **Einde dag/week**: Bekijk statistieken in `/streamer-stats`

### **Multiple Streamers per Shop**

- Elke shop kan slechts **1 actieve streamer** tegelijk hebben
- Als je een nieuwe streamer incheckt, wordt de vorige automatisch uitgecheckt
- Dit voorkomt verwarring over wie verantwoordelijk is voor orders

### **Multi-Shop Scenario**

- Shop A kan streamer "Emma" actief hebben
- Shop B kan tegelijkertijd streamer "Lars" actief hebben
- Elke shop heeft zijn eigen actieve streamer tracking

---

## 🛡️ Beveiliging

### **Admin Panel** (`/admin`)
- Vereist admin key in localStorage of login
- Normale beveiliging

### **Streamer Stats** (`/streamer-stats`)
- Vereist admin key login bij elke sessie
- **Extra beveiligingslaag** - niet toegankelijk zonder key
- Ideaal voor eigenaren die stats willen delen zonder volledige admin toegang

### **API Endpoints**
- Alle schrijf-operaties (check-in/check-out) vereisen `?key=ADMIN_KEY`
- Lees-operaties (active streamer) zijn openbaar (geen gevoelige data)
- Stats endpoint vereist admin key

---

## 📊 Database Schema

### **`streamers` Tabel**

```sql
CREATE TABLE streamers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shop_id UUID NOT NULL REFERENCES shops(id),
  is_active BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, shop_id)
);
```

### **`queue_entries` Tabel Update**

```sql
ALTER TABLE queue_entries 
ADD COLUMN streamer_id UUID REFERENCES streamers(id) ON DELETE SET NULL;
```

### **`streamer_stats` View**

Automatisch gegenereerde view die aggregeert:
- Totaal orders per streamer
- Splits per status (waiting/active/completed)
- Eerste en laatste order timestamps
- Check-in/check-out historie

---

## 🚀 Deployment Checklist

- [x] `ADD_STREAMER_TRACKING.sql` uitgevoerd in Supabase
- [x] Code gecommit en gepusht naar GitHub
- [x] Vercel deployment succesvol
- [x] Test check-in functionaliteit in `/admin`
- [x] Test order webhook (maak een test order)
- [x] Verifieer koppeling in database
- [x] Test `/streamer-stats` pagina
- [x] Test check-out functionaliteit

---

## ❓ FAQ

**Q: Wat gebeurt er als ik vergeet een streamer uit te checken?**  
A: Geen probleem! Je kunt later handmatig uitchecken, of gewoon de volgende streamer inchecken (de vorige wordt automatisch uitgecheckt).

**Q: Kunnen orders van meerdere streamers in de wachtrij staan?**  
A: Ja! Elke order houdt vast welke streamer actief was toen hij binnenkwam. In de wachtrij kunnen orders van verschillende streamers gemengd zijn.

**Q: Kan ik zien welke streamer verantwoordelijk was voor een specifieke order?**  
A: Ja, in de database heeft elke `queue_entry` een `streamer_id` veld. Je kunt dit zien in de stats, of een query draaien in Supabase.

**Q: Wat als ik per ongeluk de verkeerde naam invoer?**  
A: Check gewoon opnieuw in met de juiste naam. Nieuwe orders gaan naar de nieuwe actieve streamer.

**Q: Werkt dit ook met de oude orders?**  
A: Nee, alleen orders die binnenkomen NADAT een streamer is ingecheckt worden gekoppeld. Oude orders hebben geen `streamer_id`.

---

## 🎉 Klaar!

Je streamer tracking systeem is nu volledig operationeel! 

- Streamers kunnen zich inchecken via admin panel
- Orders worden automatisch gekoppeld
- Statistieken zijn beschikbaar voor eigenaren
- Alles werkt naadloos met je bestaande queue systeem
