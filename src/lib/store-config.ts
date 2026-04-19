export const STORE_CONFIG = {
  name: "Katsumoto",
  tagline: "Agroindustrial",
  phone: "(064) 222-333",
  phoneHref: "tel:+5164222333",
  whatsappNumber: "51903041894",
  whatsappDisplay: "+51 903 041 894",
  whatsappMessage: "Hola, me interesa un producto de la tienda Katsumoto. ¿Podrían asesorarme?",
  email: "ventas@katsumoto.pe",
  ruc: "20123456781",
  address: "Jr. San Toribio 345, Pichanaki - Chanchamayo",
  addressMapUrl: "https://maps.google.com/?q=Jr.+San+Toribio+345+Pichanaki+Chanchamayo",
  schedule: "Lun–Sáb: 8:00 AM – 6:00 PM",
  city: "Pichanaki",
  version: "v2.0",
} as const;

export function getWhatsAppUrl(message?: string): string {
  const msg = message || STORE_CONFIG.whatsappMessage;
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}
