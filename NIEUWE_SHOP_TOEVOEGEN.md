# Nieuwe Webshop Toevoegen - Handleiding

## 📋 Wat je nodig hebt:
- Toegang tot het admin panel
- Toegang tot Vercel (voor environment variables)
- Je Shopify webhook secret

---

## ✅ Stap 1: Maak de Shop aan in Admin

1. Ga naar **https://tiktok-queue.vercel.app/admin**
2. Log in met je admin key
3. Klik op de knop **"Beheer Shops"**
4. Vul de gegevens in:
   - **Shop naam**: Een technische naam zonder spaties (bijv: `mysteryboxnl`, `geoshop`, `secretbox`)
   - **Display naam**: De mooie naam die je ziet (bijv: `Mystery Box NL`, `Geo Shop`)
   - ⚠️ **Shopify Shop Domain**: Laat leeg! Wordt automatisch ingevuld
5. Klik op **"Shop Toevoegen"**
6. Je ziet nu een melding met de environment variable die je moet toevoegen

---

## 🔐 Stap 2: Voeg Environment Variable toe in Vercel

1. Ga naar **https://vercel.com**
2. Open je project (tiktok-queue)
3. Klik op **Settings** (bovenaan)
4. Klik op **Environment Variables** (linkermenu)
5. Klik op **"Add New"**
6. Vul in:
   - **Name**: `SHOPIFY_SECRET_MYSTERYBOXNL` (gebruik de naam uit stap 1, in HOOFDLETTERS)
   - **Value**: Je Shopify webhook secret (zie hieronder hoe je deze vindt)
   - **Environments**: Vink alles aan (Production, Preview, Development)
7. Klik **Save**
8. **BELANGRIJK:** Je ziet deze popup:
   ```
   Added Environment Variable successfully. A new deployment 
   is needed for changes to take effect.
   ```
9. **Klik op "Redeploy"** (de zwarte knop rechts)
10. Wacht ongeveer 30 seconden tot de deployment klaar is

### Shopify Webhook Secret vinden:
1. Log in op je Shopify admin
2. Ga naar **Settings** → **Notifications**
3. Scroll naar beneden naar **Webhooks**
4. Je ziet hier: Je webhooks worden ondertekend met [..] kopieer die lange string. Dat is je shopify secret

---

## 🔗 Stap 3: Configureer Shopify Webhook

1. In je Shopify admin: **Settings** → **Notifications** → **Webhooks**
2. Klik **"Create webhook"**
3. Vul in:
   - **Event**: `Order payment`
   - **Format**: `JSON`
   - **URL**: `https://tiktok-queue.vercel.app/api/webhook/order-paid`
   - **API version**: Kies de nieuwste
4. Klik **Save**
5. De webhook zal automatisch de juiste shop detecteren!

---

## 📺 Stap 4: Overlay URL Ophalen

1. Ga terug naar **Admin** → **Beheer Shops**
2. Zoek je nieuwe shop in de lijst
3. Je ziet nu:
   - ✓ **Domain**: Automatisch ingevuld na eerste order! (Als leeg, wacht op eerste order)
4. Klik op **"📋 Kopieer Overlay URL"**
5. Plak deze URL in TikTok Live Studio als **Browser Source**

### Alternatief: Direct openen
- Klik op **"🔗 Open"** om de overlay in een nieuw tabblad te openen en te testen

---

## 🎨 Stap 5: Kleuren Aanpassen (Optioneel)

Wil je andere kleuren dan geel? Pas ze aan!

1. In **Admin** → **Beheer Shops**
2. Klik op **"🎨 Kleuren"** bij je shop
3. Kies je kleuren:
   - **Primaire Kleur**: Kleur van de namen (standaard geel)
   - **Text Kleur**: Kleur van de "En nog X meer" tekst
   - **Achtergrond Kleur**: Achtergrond van de vakjes (bijv: `rgba(0, 0, 0, 0.6)`)
4. Schakel achtergronden aan/uit:
   - ✅ **Toon achtergrond bij namen**: Vakjes om namen heen
   - ✅ **Toon achtergrond bij "En nog X meer"**: Gekleurde achtergrond
5. Bekijk het **Voorbeeld**
6. Klik **Opslaan**
7. Refresh je overlay → klaar!

### Voorbeeldkleuren:
- **Rood**: `#FF0000`
- **Blauw**: `#00BFFF`
- **Groen**: `#00FF00`
- **Paars**: `#9D4EDD`
- **Oranje**: `#FF6B35`

---

## ✅ Checklist - Is alles gelukt?

- [ ] Shop aangemaakt in admin panel
- [ ] Environment variable toegevoegd in Vercel
- [ ] Redeploy geklik in Vercel
- [ ] Shopify webhook geconfigureerd
- [ ] Overlay URL gekopieerd
- [ ] Overlay werkt in TikTok Live Studio
- [ ] (Optioneel) Kleuren aangepast

---

## ❓ Problemen?

### "Shop not found" foutmelding bij webhook
- Check of je de **Redeploy** knop hebt geklikt in Vercel na het toevoegen van de environment variable
- Controleer of de shop naam in de environment variable exact overeenkomt (hoofdletters!)

### Shopify Domain staat nog op "⚠️ Wordt auto-ingevuld"
- Dit is normaal! Het wordt automatisch ingevuld zodra de **eerste order** binnenkomt
- Test door een test order te plaatsen in Shopify

### Overlay is leeg
- Check of je de juiste `shopId` in de URL hebt
- Kopieer de URL via de **"📋 Kopieer Overlay URL"** knop in admin

### Kleuren veranderen niet
- Refresh de overlay pagina (F5)
- Check of je de juiste shop hebt geselecteerd in admin

---

## 🎉 Klaar!

Je nieuwe shop is nu volledig ingesteld en klaar voor gebruik!

- Beheer de queue via: **https://tiktok-queue.vercel.app/admin**
- Gebruik de overlay in TikTok Live Studio
- Orders komen automatisch binnen via de Shopify webhook
