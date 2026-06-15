/**
 * Seeded supplier directory.
 *
 * ⚠️ DEMO DATA — names, phone numbers and coordinates are placeholders for the
 * competition build. WhatsApp numbers are NON-FUNCTIONAL examples (+23355000XXXX).
 * Replace with real agro-dealer data before any farmer field use.
 *
 * Coordinates are approximate town centres so the Leaflet map renders sensibly.
 */
export const SUPPLIERS = [
  // Ashanti (Kumasi area)
  { id: 'kofi-agro-kumasi', name: "Kofi's Agro Shop", region: 'ashanti', town: 'Kumasi', lat: 6.6886, lng: -1.6244, whatsapp: '+233550001001', products: ['Copper Hydroxide', 'Mancozeb', 'Wettable Sulfur'], price_range: 'GHc 45–70' },
  { id: 'mensah-input-kumasi', name: 'Mensah Farm Input', region: 'ashanti', town: 'Kumasi', lat: 6.7000, lng: -1.6300, whatsapp: '+233550001002', products: ['Mancozeb', 'Chlorothalonil', 'Tebuconazole'], price_range: 'GHc 40–65' },
  { id: 'adwoa-agro-ejisu', name: 'Adwoa Agro Centre', region: 'ashanti', town: 'Ejisu', lat: 6.7333, lng: -1.4667, whatsapp: '+233550001003', products: ['Copper Hydroxide', 'Wettable Sulfur'], price_range: 'GHc 35–60' },
  { id: 'obuasi-farmcare', name: 'Obuasi FarmCare', region: 'ashanti', town: 'Obuasi', lat: 6.2027, lng: -1.6664, whatsapp: '+233550001004', products: ['Mancozeb', 'Copper Hydroxide'], price_range: 'GHc 42–68' },

  // Greater Accra
  { id: 'ama-shop-accra', name: "Ama's Agro Shop", region: 'greater_accra', town: 'Accra', lat: 5.6037, lng: -0.1870, whatsapp: '+233550002001', products: ['Copper Hydroxide', 'Mancozeb'], price_range: 'GHc 50–75' },
  { id: 'tema-greens', name: 'Tema Greens Supply', region: 'greater_accra', town: 'Tema', lat: 5.6698, lng: -0.0166, whatsapp: '+233550002002', products: ['Mancozeb', 'Wettable Sulfur', 'Chlorothalonil'], price_range: 'GHc 45–70' },
  { id: 'madina-agrovet', name: 'Madina AgroVet', region: 'greater_accra', town: 'Madina', lat: 5.6836, lng: -0.1660, whatsapp: '+233550002003', products: ['Copper Hydroxide', 'Tebuconazole'], price_range: 'GHc 48–72' },

  // Western
  { id: 'takoradi-farminput', name: 'Takoradi Farm Input', region: 'western', town: 'Takoradi', lat: 4.8845, lng: -1.7554, whatsapp: '+233550003001', products: ['Mancozeb', 'Copper Hydroxide'], price_range: 'GHc 44–69' },
  { id: 'tarkwa-agro', name: 'Tarkwa Agro Hub', region: 'western', town: 'Tarkwa', lat: 5.3018, lng: -1.9930, whatsapp: '+233550003002', products: ['Wettable Sulfur', 'Mancozeb'], price_range: 'GHc 38–62' },

  // Volta
  { id: 'ho-farmcare', name: 'Ho FarmCare', region: 'volta', town: 'Ho', lat: 6.6008, lng: 0.4713, whatsapp: '+233550004001', products: ['Copper Hydroxide', 'Mancozeb', 'Chlorothalonil'], price_range: 'GHc 46–71' },
  { id: 'hohoe-agro', name: 'Hohoe Agro Centre', region: 'volta', town: 'Hohoe', lat: 7.1510, lng: 0.4730, whatsapp: '+233550004002', products: ['Mancozeb', 'Wettable Sulfur'], price_range: 'GHc 40–64' },

  // Northern
  { id: 'tamale-farminput', name: 'Tamale Farm Input', region: 'northern', town: 'Tamale', lat: 9.4075, lng: -0.8533, whatsapp: '+233550005001', products: ['Wettable Sulfur', 'Tebuconazole', 'Mancozeb'], price_range: 'GHc 35–60' },
  { id: 'yendi-agro', name: 'Yendi Agro Supply', region: 'northern', town: 'Yendi', lat: 9.4427, lng: -0.0093, whatsapp: '+233550005002', products: ['Mancozeb', 'Copper Hydroxide'], price_range: 'GHc 38–63' },
];

/** Suppliers in a region that stock at least one product matching the treatment name. */
export function findSuppliers(region, treatmentName = '') {
  const wanted = treatmentName.toLowerCase();
  return SUPPLIERS.filter((s) => {
    if (region && s.region !== region) return false;
    if (!wanted) return true;
    return s.products.some((p) => wanted.includes(p.toLowerCase()) || p.toLowerCase().includes(wanted.split(' ')[0]));
  });
}

/** Builds a tel: link that opens the phone dialer with the shop's number preloaded. */
export function telLink(supplier) {
  return `tel:${supplier.whatsapp.replace(/[^0-9+]/g, '')}`;
}

/** Builds a wa.me deep link with a pre-filled, polite product enquiry. */
export function whatsappLink(supplier, productName, lang = 'en') {
  const msg =
    lang === 'twi'
      ? `Agoo ${supplier.name}, merehwehwɛ ${productName} ama me mfudeɛ. Wowɔ bi? Ne boɔ ne sɛn?`
      : `Hello ${supplier.name}, I am looking for ${productName} for my crop. Do you have it? How much is it?`;
  const num = supplier.whatsapp.replace(/[^0-9]/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}
