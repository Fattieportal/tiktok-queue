// Translations for multi-language support
// Supported languages: nl (Nederlands), de (Deutsch)

export type Language = 'nl' | 'de';

type Translations = {
  [key in Language]: {
    // Widget translations
    liveQueue: string;
    queueClosed: string;
    noActiveOrder: string;
    waitingForNext: string;
    liveUpdates: string;
    autoRefresh: string;
    waitingInQueue: string;
    andMore: string;
    
    // Overlay translations
    queue: string;
    queueClosedOverlay: string;
    noOpenOrders: string;
  };
};

export const translations: Translations = {
  nl: {
    // Widget
    liveQueue: 'LIVE WACHTRIJ',
    queueClosed: 'Wachtrij is gesloten',
    noActiveOrder: 'Geen actieve bestelling',
    waitingForNext: 'Wacht op de volgende live unboxing...',
    liveUpdates: 'Live updates',
    autoRefresh: 'Automatisch ververst',
    waitingInQueue: 'Wachtende in wachtrij',
    andMore: 'En nog',
    
    // Overlay
    queue: 'Wachtrij:',
    queueClosedOverlay: '🔒 Wachtrij is gesloten',
    noOpenOrders: 'Geen openstaande',
  },
  de: {
    // Widget
    liveQueue: 'LIVE WARTESCHLANGE',
    queueClosed: 'Warteschlange ist geschlossen',
    noActiveOrder: 'Keine aktive Bestellung',
    waitingForNext: 'Warte auf das nächste Live-Unboxing...',
    liveUpdates: 'Live-Updates',
    autoRefresh: 'Automatisch aktualisiert',
    waitingInQueue: 'Wartende in der Warteschlange',
    andMore: 'Und noch',
    
    // Overlay
    queue: 'Warteschlange:',
    queueClosedOverlay: '🔒 Warteschlange ist geschlossen',
    noOpenOrders: 'Keine offenen',
  },
};

export function getTranslations(lang: Language = 'nl') {
  return translations[lang] || translations.nl;
}
