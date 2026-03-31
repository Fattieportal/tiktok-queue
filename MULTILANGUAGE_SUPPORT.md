# 🌍 Meertalige Ondersteuning

## Overzicht
Het systeem ondersteunt nu meerdere talen voor overlays en widgets. Per shop kan worden ingesteld in welke taal de interface moet worden weergegeven.

## Ondersteunde Talen
- **Nederlands** (`nl`) - Standaard
- **Deutsch** (`de`) - Duits

## Implementatie

### 1. Database Setup
Voer de volgende SQL uit om de taal kolom toe te voegen aan de shops tabel:

```sql
-- Zie ADD_LANGUAGE_SUPPORT.sql
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'nl' CHECK (language IN ('nl', 'de'));
```

### 2. Taal Instellen per Shop

#### Via Admin Panel
1. Ga naar het admin panel
2. Klik op "🎨 Instellingen" bij de gewenste shop
3. Selecteer de gewenste taal onder "🌍 Interface Taal"
4. Klik op "Opslaan"

#### Via API
```bash
# Via update-colors endpoint (bevat nu ook language)
POST /api/shops/update-colors?key=YOUR_ADMIN_KEY
Content-Type: application/json

{
  "id": "shop-id",
  "language": "de"
}

# Of via dedicated endpoint
POST /api/shops/update-language?key=YOUR_ADMIN_KEY
Content-Type: application/json

{
  "shopId": "shop-id",
  "language": "de"
}
```

### 3. Vertalingen Toevoegen

Vertalingen worden beheerd in `/src/lib/translations.ts`. Om een nieuwe taal toe te voegen:

1. Voeg de taal toe aan het `Language` type:
```typescript
export type Language = 'nl' | 'de' | 'fr'; // Voeg 'fr' toe voor Frans
```

2. Voeg vertalingen toe aan het `translations` object:
```typescript
export const translations: Translations = {
  nl: { /* ... */ },
  de: { /* ... */ },
  fr: {
    liveQueue: 'FILE D\'ATTENTE EN DIRECT',
    queueClosed: 'File d\'attente fermée',
    // etc.
  }
};
```

3. Update de database constraint:
```sql
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_language_check;
ALTER TABLE shops ADD CONSTRAINT shops_language_check CHECK (language IN ('nl', 'de', 'fr'));
```

## Vertaalde Componenten

### Widget (`/shopify-widget`)
- "LIVE WACHTRIJ" / "LIVE WARTESCHLANGE"
- "Wachtrij is gesloten" / "Warteschlange ist geschlossen"
- "Geen actieve bestelling" / "Keine aktive Bestellung"
- "Wacht op de volgende live unboxing..." / "Warte auf das nächste Live-Unboxing..."
- "Live updates • Automatisch ververst" / "Live-Updates • Automatisch aktualisiert"
- "Wachtende in wachtrij" / "Wartende in der Warteschlange"
- "En nog X meer..." / "Und noch X mehr..."

### Overlay (`/overlay`)
- "Wachtrij:" / "Warteschlange:"
- "🔒 Wachtrij is gesloten" / "🔒 Warteschlange ist geschlossen"
- "Geen openstaande" / "Keine offenen"
- "En nog X meer..." / "Und noch X meer..."

## Technische Details

### Data Flow
1. Shop heeft `language` kolom in database (default: 'nl')
2. `/api/queue/public-state` haalt shop data op inclusief `language`
3. Frontend ontvangt `language` in state
4. `getTranslations(language)` wordt aangeroepen om correcte vertalingen op te halen
5. Vertalingen worden gebruikt in UI componenten

### Type Safety
Het systeem maakt gebruik van TypeScript voor type-veilige vertalingen:

```typescript
type Language = 'nl' | 'de';
const t = getTranslations(state.language); // Type-veilig!
// t.liveQueue is altijd beschikbaar
```

## Testing

### Test verschillende talen
1. Maak een test shop aan
2. Zet de taal op 'de' (Deutsch)
3. Open `/shopify-widget?shopId=YOUR_SHOP_ID`
4. Verifieer dat alle teksten in het Duits zijn
5. Open `/overlay?shopId=YOUR_SHOP_ID`
6. Verifieer dat de overlay ook in het Duits is

### Test fallback
Als een ongeldige taal wordt opgegeven, valt het systeem terug naar Nederlands ('nl').

## Best Practices

1. **Altijd fallback naar Nederlands**: Nederlands is de standaard taal
2. **Consistente vertalingen**: Gebruik dezelfde terminologie in alle componenten
3. **Test nieuwe talen grondig**: Controleer alle UI states (leeg, 1 item, veel items, gesloten)
4. **Database constraints**: Beperk toegestane waarden in de database
5. **API validatie**: Valideer taal input in API endpoints

## Toekomstige Uitbreidingen

Mogelijke verbeteringen:
- Frans, Engels, Spaans toevoegen
- Datum/tijd formattering per taal
- Getallen formattering (decimalen, duizendtallen)
- RTL ondersteuning (Arabisch, Hebreeuws)
- Automatische taaldetectie op basis van browser instellingen
