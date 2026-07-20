// Video hero: scrubbato dallo scroll nella fase iniziale (desktop/tablet).
// Ricodificato con keyframe fitti per il seek fluido in both directions.
export const INTRO_VIDEO = "/media/video-intro.mp4";

export const GALLERY_IMAGES = [
  "/media/galleria-01.webp",
  "/media/galleria-02.webp",
  "/media/galleria-03.webp",
  "/media/galleria-04.webp",
  "/media/galleria-05.webp",
  "/media/galleria-06.webp",
  "/media/galleria-07.webp",
  "/media/galleria-08.webp",
  "/media/galleria-09.webp",
  "/media/galleria-10.webp",
  "/media/galleria-11.webp",
];

// WooCommerce su bluej.gengioia.it (stessa cartella della landing).
export const SHOP_URL = "https://bluej.gengioia.it/negozio/";
export const CART_URL = "https://bluej.gengioia.it/carrello/";

// Archivi per marchio del catalogo ufficiale (tag WooCommerce).
const TAG_BASE = "https://bluej.gengioia.it/tag-prodotto/";

// Le quattro linee della maison, con i rispettivi archivi nel negozio.
export const BRANDS = [
  {
    name: "Potenza",
    copy: "Made in Italy, taglio sartoriale. La linea premium che dà carattere all'intera collezione.",
    url: `${TAG_BASE}potenza/`,
  },
  {
    name: "Blue•j",
    copy: "La linea che porta il nome della maison: capi quotidiani, mai banali.",
    url: `${TAG_BASE}blue-j/`,
  },
  {
    name: "Anastasia Gray",
    copy: "Il laboratorio dei trend: uscite rapide, spirito giovane, pezzi che non aspettano.",
    url: `${TAG_BASE}anastasia-gray/`,
  },
  {
    name: "Sarah Chole",
    copy: "Gli essenziali morbidi: eleganza senza sforzo, dal giorno alla sera.",
    url: `${TAG_BASE}sarah-chole/`,
  },
];

export const CIRCLE_SYMBOLS = ["8", "$", "^^", "%", "/"];

export const CAPTION_TEXT =
  "Eleganza quotidiana, carattere made in Italy. blue•j firma la nuova collezione donna: capi esclusivi, selezionati con la cura della boutique.";
