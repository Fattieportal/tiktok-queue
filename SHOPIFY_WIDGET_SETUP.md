# Shopify Storefront Widget - Installatie Handleiding

## 📋 Overzicht
Deze widget toont de live TikTok unboxing wachtrij direct op je Shopify storefront. Klanten kunnen in real-time zien welke bestelling op dit moment wordt uitgepakt.

## 🎯 Features
- ✅ Live actieve bestelling display
- ✅ Klantnaam + product informatie
- ✅ Real-time timer (elapsed time)
- ✅ Automatische updates (elke 5 seconden)
- ✅ Responsive design (mobiel + desktop)
- ✅ Custom branding per shop (automatisch uit database)
- ✅ "Wachtrij gesloten" status

## 🔗 Widget URL

De widget is beschikbaar op:
```
https://your-domain.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID
```

**Shop ID vinden:**
1. Log in op `/admin`
2. Klik op "Beheer Shops"
3. Kopieer de UUID van je shop

## 📦 Installatie Methodes

### **Methode 1: iFrame Embed (Eenvoudigst)**

Voeg deze code toe aan je Shopify theme:

#### **Optie A: Liquid Template (Hele pagina)**

1. Ga naar Shopify Admin → **Online Store** → **Themes**
2. Klik op **Actions** → **Edit code**
3. Maak een nieuwe template:
   - Klik op **Add a new template**
   - Selecteer **page**
   - Naam: `live-queue` (of `live-wachtrij`)
   - Klik **Create template**

4. Vervang de inhoud met:

```liquid
<div class="page-width">
  <div class="page-header">
    <h1 class="page-header__title">{{ page.title }}</h1>
  </div>
  
  <div class="rte">
    {{ page.content }}
  </div>

  <div style="width: 100%; height: 100vh; min-height: 600px; margin-top: 2rem;">
    <iframe 
      src="https://YOUR-DOMAIN.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID"
      style="width: 100%; height: 100%; border: none; border-radius: 12px;"
      title="Live TikTok Wachtrij"
      loading="lazy"
    ></iframe>
  </div>
</div>
```

5. **Vervang:**
   - `YOUR-DOMAIN.vercel.app` → je Vercel domein
   - `YOUR_SHOP_ID` → je shop UUID

6. Sla op en maak een nieuwe pagina:
   - Ga naar **Online Store** → **Pages**
   - Klik **Add page**
   - Titel: "Live Wachtrij" (of "Live Queue")
   - In de rechter sidebar bij **Theme template** selecteer: `page.live-queue`
   - Klik **Save**

7. De pagina is nu live op: `https://jouw-shop.com/pages/live-wachtrij`

---

#### **Optie B: Custom Section (Flexibeler)**

1. Ga naar **Online Store** → **Themes** → **Edit code**
2. Klik op **Add a new section**
3. Naam: `live-queue-widget`
4. Voeg deze code toe:

```liquid
<div class="live-queue-section" style="padding: 2rem 0;">
  <div class="page-width">
    {% if section.settings.show_title %}
      <h2 style="text-align: center; margin-bottom: 2rem; font-size: 2rem;">
        {{ section.settings.title }}
      </h2>
    {% endif %}

    <div style="width: 100%; height: {{ section.settings.height }}px; min-height: 400px;">
      <iframe 
        src="{{ section.settings.widget_url }}"
        style="width: 100%; height: 100%; border: none; border-radius: {{ section.settings.border_radius }}px;"
        title="Live TikTok Wachtrij"
        loading="lazy"
      ></iframe>
    </div>
  </div>
</div>

{% schema %}
{
  "name": "Live Wachtrij Widget",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_title",
      "label": "Toon titel",
      "default": true
    },
    {
      "type": "text",
      "id": "title",
      "label": "Titel",
      "default": "🟠 Live TikTok Wachtrij"
    },
    {
      "type": "url",
      "id": "widget_url",
      "label": "Widget URL",
      "info": "Format: https://your-domain.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID"
    },
    {
      "type": "range",
      "id": "height",
      "min": 400,
      "max": 1200,
      "step": 50,
      "unit": "px",
      "label": "Hoogte",
      "default": 700
    },
    {
      "type": "range",
      "id": "border_radius",
      "min": 0,
      "max": 24,
      "step": 4,
      "unit": "px",
      "label": "Border radius",
      "default": 12
    }
  ],
  "presets": [
    {
      "name": "Live Wachtrij Widget"
    }
  ]
}
{% endschema %}
```

5. Sla op
6. Ga naar **Online Store** → **Themes** → **Customize**
7. Voeg de sectie toe waar je wilt (homepage, specifieke pagina, etc.)
8. Configureer de URL in de section settings
9. Klik **Save**

---

#### **Optie C: Direct in Theme Code (Hardcoded)**

Voor een vaste positie (bijv. homepage):

1. **Online Store** → **Themes** → **Edit code**
2. Open het bestand waar je de widget wilt (bijv. `templates/index.liquid`)
3. Voeg toe waar je wilt:

```liquid
<div style="width: 100%; max-width: 1200px; margin: 4rem auto; padding: 0 1rem;">
  <h2 style="text-align: center; margin-bottom: 2rem; font-size: 2rem;">
    🟠 Live TikTok Wachtrij
  </h2>
  
  <div style="width: 100%; height: 700px; min-height: 500px;">
    <iframe 
      src="https://YOUR-DOMAIN.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID"
      style="width: 100%; height: 100%; border: none; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);"
      title="Live TikTok Wachtrij"
      loading="lazy"
    ></iframe>
  </div>
</div>
```

---

### **Methode 2: Popup/Modal (Tijdens Live Stream)**

Voor een popup die alleen tijdens live streams verschijnt:

```liquid
<div id="live-queue-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; padding: 20px;">
  <div style="position: relative; max-width: 800px; margin: 0 auto; height: 100%;">
    <button onclick="document.getElementById('live-queue-modal').style.display='none'" 
            style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; z-index: 10000;">
      ×
    </button>
    
    <iframe 
      src="https://YOUR-DOMAIN.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID"
      style="width: 100%; height: 100%; border: none; border-radius: 12px;"
      title="Live TikTok Wachtrij"
    ></iframe>
  </div>
</div>

<button onclick="document.getElementById('live-queue-modal').style.display='block'"
        style="position: fixed; bottom: 20px; right: 20px; background: #FF9500; color: white; border: none; padding: 16px 24px; border-radius: 50px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(255,149,0,0.4); z-index: 9998;">
  🟠 Bekijk Live Wachtrij
</button>
```

---

## 🎨 Styling Aanpassen

De widget gebruikt automatisch de kleuren uit je shop configuratie (admin panel), maar je kunt extra CSS toevoegen:

```html
<style>
  .live-queue-section {
    background: #f5f5f5;
    padding: 4rem 0;
  }
  
  .live-queue-section iframe {
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    border: 2px solid #ddd;
  }
</style>
```

---

## 📱 Responsive Design

De widget is automatisch responsive. Aanbevolen minimum hoogtes:
- **Desktop**: 700px
- **Tablet**: 600px  
- **Mobiel**: 500px

---

## 🔧 Troubleshooting

### **Widget laadt niet**
- ✅ Check of je de juiste `shopId` hebt gebruikt
- ✅ Controleer of de shop `is_active = true` in admin panel
- ✅ Verifieer dat je Vercel deployment live is

### **Geen data zichtbaar**
- ✅ Check of er een actieve bestelling is in `/admin`
- ✅ Controleer of de queue niet gesloten is (toggle in admin)

### **Kleuren kloppen niet**
- ✅ Update shop colors in admin panel
- ✅ Widget herlaadt automatisch bij volgende poll (5 sec)

### **Timer klopt niet**
- ✅ Check browser timezone settings
- ✅ Verifieer `created_at` timestamp in database

---

## 🚀 Live Gaan

1. Test de widget eerst op een preview/development theme
2. Controleer responsive design op mobiel
3. Test tijdens een echte live stream
4. Publiceer naar production theme
5. Voeg link toe aan je navigatie menu (optioneel)

---

## 📊 Analytics (Optioneel)

Track widget views met Google Analytics:

```html
<iframe 
  src="https://your-domain.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID"
  onload="gtag('event', 'view_live_queue', { 'event_category': 'engagement' });"
  ...
></iframe>
```

---

## 🆘 Support

Bij vragen of problemen:
1. Check de console voor errors (F12 in browser)
2. Verifieer shop settings in `/admin`
3. Test direct via widget URL (zonder iframe)

---

**✅ Klaar! Je live wachtrij widget is nu geïnstalleerd.**

Tip: Promoot de widget tijdens je TikTok live streams voor maximale engagement! 🎉
