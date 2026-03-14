# Shopify Iframe Auto-Resize Setup

De widget stuurt nu automatisch zijn hoogte naar de parent window (Shopify) via `postMessage`. Hierdoor past de iframe zich dynamisch aan de content aan.

## Widget Gedrag

De widget:
- ✅ Groeit automatisch bij meer wachtrij content
- ✅ Krimpt automatisch bij minder content
- ✅ Geen fixed height of scrollbars
- ✅ Stuurt hoogte updates bij elke state change (polling, queue updates, etc.)
- ✅ Gebruikt ResizeObserver voor nauwkeurige detectie
- ✅ requestAnimationFrame + delay voor correcte DOM timing
- ✅ Werkt zowel bij groei ALS krimp van content

### Wanneer wordt de hoogte verstuurd?

1. **Bij elke state change** (elke 5 seconden via polling)
   - Actieve bestelling verandert
   - Wachtrij items toegevoegd/verwijderd
   - Queue gesloten/geopend
   - Kleuren wijzigen

2. **Na DOM update** (requestAnimationFrame + 50ms delay)
   - Zorgt dat layout volledig berekend is
   - Vangt zowel groei als krimp op

3. **Bij window resize** (fonts laden, browser resize)

4. **Bij DOM changes** (ResizeObserver)
   - Detecteert alle visuele changes
   - Werkt voor groei EN krimp

### Debug Mode

Open de browser console in de widget om height updates te zien:
```
[Widget] Height sent: 450
[Widget] Height sent: 380  ← krimp gedetecteerd!
[Widget] Height sent: 520  ← groei gedetecteerd!
```

## Shopify Theme Integratie

### Optie 1: JavaScript in de iframe embed code

```html
<div id="tiktok-queue-widget-container">
  <iframe 
    id="tiktok-queue-iframe"
    src="https://jouw-vercel-app.vercel.app/shopify-widget?shopId=YOUR_SHOP_ID"
    style="width: 100%; border: none; overflow: hidden;"
    scrolling="no"
  ></iframe>
</div>

<script>
  // Listen for height updates from the widget
  window.addEventListener('message', function(event) {
    // Security: optioneel check origin
    // if (event.origin !== 'https://jouw-vercel-app.vercel.app') return;
    
    if (event.data.type === 'tiktok-queue-resize') {
      const iframe = document.getElementById('tiktok-queue-iframe');
      if (iframe) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>
```

### Optie 2: Shopify Section met Liquid + JS

Maak een nieuw section bestand: `sections/tiktok-queue-widget.liquid`

```liquid
<div class="tiktok-queue-section" style="padding: 40px 0;">
  <div class="container">
    <iframe 
      id="tiktok-queue-iframe-{{ section.id }}"
      src="https://jouw-vercel-app.vercel.app/shopify-widget?shopId={{ section.settings.shop_id }}"
      style="width: 100%; border: none; overflow: hidden; min-height: 200px;"
      scrolling="no"
    ></iframe>
  </div>
</div>

<script>
  (function() {
    const iframeId = 'tiktok-queue-iframe-{{ section.id }}';
    
    window.addEventListener('message', function(event) {
      if (event.data.type === 'tiktok-queue-resize') {
        const iframe = document.getElementById(iframeId);
        if (iframe) {
          iframe.style.height = event.data.height + 'px';
        }
      }
    });
  })();
</script>

{% schema %}
{
  "name": "TikTok Queue Widget",
  "settings": [
    {
      "type": "text",
      "id": "shop_id",
      "label": "Shop ID",
      "info": "Je shop UUID uit de admin panel"
    }
  ],
  "presets": [
    {
      "name": "TikTok Queue Widget"
    }
  ]
}
{% endschema %}
```

### Optie 3: Hardcoded in theme.liquid

Voeg toe aan `theme.liquid` (bijvoorbeeld voor footer):

```liquid
<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'tiktok-queue-resize') {
      const iframes = document.querySelectorAll('iframe[src*="shopify-widget"]');
      iframes.forEach(function(iframe) {
        iframe.style.height = event.data.height + 'px';
      });
    }
  });
</script>
```

## Testing

1. **Deploy de widget** naar Vercel (met de nieuwe postMessage code)
2. **Voeg de iframe toe** aan je Shopify theme met resize script
3. **Test verschillende states:**
   - Geen actieve bestelling → Widget klein
   - Actieve bestelling + 0 wachtenden → Medium hoogte
   - Actieve bestelling + 5 wachtenden → Groter
   - Actieve bestelling + 10 wachtenden → Nog groter (alles zichtbaar, geen scroll)
   - Wachtrij gesloten → Klein

4. **Monitor de console** voor postMessage events:
```javascript
window.addEventListener('message', (e) => {
  if (e.data.type === 'tiktok-queue-resize') {
    console.log('Widget height update:', e.data.height);
  }
});
```

## Troubleshooting

### Iframe past hoogte niet aan
- Check of het resize script **na** de iframe in de DOM staat
- Check browser console voor JavaScript errors
- Verify dat `postMessage` events aankomen (zie Testing sectie)

### Hoogte springt/flikkert
- Dit is normaal tijdens het laden (fonts, images, etc.)
- De ResizeObserver vangt dit op en stuurt updates
- Eventueel een `transition` toevoegen aan iframe:
```css
iframe {
  transition: height 0.3s ease;
}
```

### Security: Origin checking
Voor extra security, check de origin:
```javascript
window.addEventListener('message', function(event) {
  // Alleen berichten van jouw Vercel app accepteren
  if (event.origin !== 'https://jouw-vercel-app.vercel.app') return;
  
  if (event.data.type === 'tiktok-queue-resize') {
    // ... update height
  }
});
```

## Voordelen van deze aanpak

✅ Widget groeit/krimpt automatisch
✅ Geen scrollbars in iframe
✅ Geen fixed heights nodig
✅ Werkt met alle Shopify themes
✅ Real-time updates bij queue changes
✅ Responsive (works on mobile too)
