import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GALLERY_IMAGES } from "./data";
import type { Viewport } from "./useViewport";

// Stessa origine in produzione; in dev il proxy di Vite inoltra a
// bluej.gengioia.it (vedi vite.config.ts).
const API = "/wp-json/wc/store/v1";

interface ApiTerm {
  id: number;
  name: string;
  count: number;
}

interface ApiProduct {
  id: number;
  name: string;
  sku: string;
  permalink: string;
  prices: {
    price: string;
    currency_minor_unit: number;
    price_range: { min_amount: string; max_amount: string } | null;
  };
  attributes: { name: string; terms: { name: string }[] }[];
  categories: { name: string }[];
}

function euro(minor: string, unit: number): string {
  const n = parseInt(minor || "0", 10) / Math.pow(10, unit);
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) + " €";
}

function priceLabel(p: ApiProduct): string {
  const { prices } = p;
  if (prices.price_range) {
    return "da " + euro(prices.price_range.min_amount, prices.currency_minor_unit);
  }
  if (!prices.price || prices.price === "0") return "—";
  return euro(prices.price, prices.currency_minor_unit);
}

function attr(p: ApiProduct, name: string): string {
  const a = p.attributes.find((x) => x.name.toLowerCase() === name);
  if (!a) return "";
  return a.terms
    .slice(0, 4)
    .map((t) => t.name)
    .join(" · ");
}

interface Filters {
  category: string;
  brand: string;
  order: string;
  search: string;
}

export function Lookbook({
  vp,
  open,
  onClose,
}: {
  vp: Viewport;
  open: boolean;
  onClose: () => void;
}) {
  const single = !vp.isDesktop;
  const perPage = single ? 4 : 5;

  const [cats, setCats] = useState<ApiTerm[]>([]);
  const [brands, setBrands] = useState<ApiTerm[]>([]);
  const [filters, setFilters] = useState<Filters>({
    category: "",
    brand: "",
    order: "",
    search: "",
  });
  const [searchDraft, setSearchDraft] = useState("");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const apiPageRef = useRef(1);

  // Stato del libro: indice pagina corrente + animazione di voltata.
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<null | { dir: "next" | "prev"; started: boolean }>(null);
  const touchX = useRef<number | null>(null);

  /* ------------------------- caricamento dati ------------------------- */

  useEffect(() => {
    if (!open || cats.length > 0) return;
    fetch(`${API}/products/categories?per_page=100`)
      .then((r) => r.json())
      .then((list: (ApiTerm & { parent: number })[]) =>
        setCats(list.filter((c) => c.count > 0 && c.parent === 0)),
      )
      .catch(() => {});
    fetch(`${API}/products/attributes`)
      .then((r) => r.json())
      .then((attrs: { id: number; taxonomy: string }[]) => {
        const m = attrs.find((a) => a.taxonomy === "pa_marchio");
        if (!m) return [];
        return fetch(`${API}/products/attributes/${m.id}/terms?per_page=100`).then(
          (r) => r.json(),
        );
      })
      .then((terms: ApiTerm[] | undefined) => {
        if (Array.isArray(terms)) {
          setBrands([...terms].sort((a, b) => b.count - a.count));
        }
      })
      .catch(() => {});
  }, [open, cats.length]);

  const buildUrl = useCallback(
    (apiPage: number, f: Filters) => {
      let url = `${API}/products?per_page=100&page=${apiPage}`;
      if (f.category) url += `&category=${f.category}`;
      if (f.brand)
        url += `&attributes[0][attribute]=pa_marchio&attributes[0][slug][]=${encodeURIComponent(f.brand)}`;
      if (f.order === "asc") url += "&orderby=price&order=asc";
      if (f.order === "desc") url += "&orderby=price&order=desc";
      if (f.search) url += `&search=${encodeURIComponent(f.search)}`;
      return url;
    },
    [],
  );

  const loadPage = useCallback(
    (apiPage: number, f: Filters, replace: boolean) => {
      setLoading(true);
      fetch(buildUrl(apiPage, f))
        .then((r) => {
          const t = parseInt(r.headers.get("x-wp-total") || "0", 10);
          if (t) setTotal(t);
          return r.json();
        })
        .then((list: ApiProduct[]) => {
          apiPageRef.current = apiPage;
          setProducts((prev) => (replace ? list : [...prev, ...list]));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [buildUrl],
  );

  useEffect(() => {
    if (!open) return;
    setPage(0);
    setFlip(null);
    setProducts([]);
    setTotal(0);
    loadPage(1, filters, true);
  }, [open, filters, loadPage]);

  /* ------------------------------ pagine ------------------------------ */

  // Pagina 0 = copertina; poi blocchi di prodotti.
  const pages = useMemo(() => {
    const chunks: ApiProduct[][] = [];
    for (let i = 0; i < products.length; i += perPage) {
      chunks.push(products.slice(i, i + perPage));
    }
    return chunks;
  }, [products, perPage]);

  const pageCount = 1 + Math.max(1, Math.ceil(total / perPage) || pages.length);
  const step = single ? 1 : 2;
  const lastIndex = pageCount - 1;

  const ensureData = useCallback(
    (targetPage: number) => {
      const needed = targetPage * perPage;
      if (needed >= products.length && products.length < total && !loading) {
        loadPage(apiPageRef.current + 1, filters, false);
      }
    },
    [perPage, products.length, total, loading, loadPage, filters],
  );

  // La voltata avanza esattamente una volta per invocazione: guardia su
  // ref (niente stato stantio) e commit temporizzato sulla durata della
  // transizione CSS (0.7s) invece dell'inaffidabile transitionend.
  const flippingRef = useRef(false);

  const turn = useCallback(
    (dir: "next" | "prev") => {
      if (flippingRef.current) return;
      if (dir === "next" && page + step > lastIndex) return;
      if (dir === "prev" && page === 0) return;
      flippingRef.current = true;
      ensureData(page + step + step);
      setFlip({ dir, started: false });
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setFlip((f) => (f ? { ...f, started: true } : f)),
        ),
      );
      window.setTimeout(() => {
        setPage((p) => (dir === "next" ? p + step : p - step));
        setFlip(null);
        flippingRef.current = false;
      }, 760);
    },
    [page, step, lastIndex, ensureData],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") turn("next");
      if (e.key === "ArrowLeft") turn("prev");
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, turn]);

  if (!open) return null;

  const activeBrand = brands.find((b) => slug(b.name) === filters.brand)?.name;

  function renderPage(index: number, pageNo: boolean) {
    if (index === 0) {
      return (
        <div className="lb-page lb-cover">
          <img src={GALLERY_IMAGES[1]} alt="" draggable={false} />
          <div className="lb-cover-veil" />
          <div className="lb-cover-text">
            <div className="lb-cover-brand">blue•j</div>
            <div className="lb-cover-title">Catalogo</div>
            <div className="lb-cover-sub">
              {activeBrand || "tutte le linee"} — {total || "…"} capi
            </div>
          </div>
        </div>
      );
    }
    const items = pages[index - 1];
    return (
      <div className="lb-page">
        <div className="lb-page-head">
          blue•j — {activeBrand ? activeBrand.toLowerCase() : "collezione"}
        </div>
        {!items && (
          <div className="lb-empty">{loading ? "Caricamento…" : "—"}</div>
        )}
        {items && items.length === 0 && (
          <div className="lb-empty">Nessun capo trovato.</div>
        )}
        {items &&
          items.map((p) => (
            <a
              key={p.id}
              className="lb-item"
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="lb-item-top">
                <span className="lb-item-name">{p.name}</span>
                <span className="lb-item-price">{priceLabel(p)}</span>
              </div>
              <div className="lb-item-meta">
                {[attr(p, "marchio"), attr(p, "taglia")]
                  .filter(Boolean)
                  .join("  ·  ") || p.categories.map((c) => c.name).join(" · ")}
              </div>
            </a>
          ))}
        {pageNo && <div className="lb-pageno">{index}</div>}
      </div>
    );
  }

  // Indici pagina per le basi e per il foglio durante la voltata.
  // Il foglio ruota sul dorso: la faccia front atterra visibile a fine
  // voltata "prev", la back a fine voltata "next".
  let baseLeft = page;
  let baseRight = page + 1;
  let sheetFront = -1;
  let sheetBack = -1;
  if (flip) {
    if (single) {
      if (flip.dir === "next") {
        baseLeft = page + 1;
        sheetFront = page;
        sheetBack = page + 1;
      } else {
        baseLeft = page;
        sheetFront = page - 1;
        sheetBack = page;
      }
    } else if (flip.dir === "next") {
      baseRight = page + 3 <= lastIndex ? page + 3 : -1;
      sheetFront = page + 1;
      sheetBack = page + 2;
    } else {
      baseLeft = page - 2;
      sheetFront = page - 1;
      sheetBack = page;
    }
  }

  return (
    <div className="lb-overlay" data-lookbook>
      <div className="lb-topbar">
        <img
          src="/media/logo.png"
          alt="blue•j"
          style={{ width: 92, filter: "invert(1)" }}
          draggable={false}
        />
        <button className="lb-close" onClick={onClose}>
          ✕ chiudi
        </button>
      </div>

      <div className="lb-filters">
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category: e.target.value }))
          }
        >
          <option value="">Tutte le categorie</option>
          {cats.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <select
          value={filters.brand}
          onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
        >
          <option value="">Tutti i marchi</option>
          {brands.map((b) => (
            <option key={b.id} value={slug(b.name)}>
              {b.name} ({b.count})
            </option>
          ))}
        </select>
        <select
          value={filters.order}
          onChange={(e) => setFilters((f) => ({ ...f, order: e.target.value }))}
        >
          <option value="">Novità</option>
          <option value="asc">Prezzo crescente</option>
          <option value="desc">Prezzo decrescente</option>
        </select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilters((f) => ({ ...f, search: searchDraft.trim() }));
          }}
        >
          <input
            type="search"
            placeholder="Cerca un capo…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </form>
        <span className="lb-count">{total ? `${total} capi` : ""}</span>
      </div>

      <div
        className="lb-stage"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx < -40) turn("next");
          if (dx > 40) turn("prev");
        }}
      >
        <button
          className="lb-arrow"
          onClick={() => turn("prev")}
          disabled={page === 0 || !!flip}
          aria-label="Pagina precedente"
        >
          ‹
        </button>

        <div className={`lb-book${single ? " lb-single" : ""}`}>
          <div className="lb-half lb-left">
            {baseLeft >= 0 && baseLeft <= lastIndex && renderPage(baseLeft, true)}
          </div>
          {!single && (
            <div className="lb-half lb-right">
              {baseRight >= 0 &&
                baseRight <= lastIndex &&
                renderPage(baseRight, true)}
            </div>
          )}
          {flip && (
            <div
              className={`lb-sheet ${flip.dir === "next" ? (flip.started ? "lb-turn" : "") : flip.started ? "" : "lb-turn"}`}
            >
              <div className="lb-face lb-front">
                {sheetFront >= 0 &&
                  sheetFront <= lastIndex &&
                  renderPage(sheetFront, false)}
              </div>
              <div className="lb-face lb-back">
                {sheetBack >= 0 &&
                  sheetBack <= lastIndex &&
                  renderPage(sheetBack, false)}
              </div>
            </div>
          )}
        </div>

        <button
          className="lb-arrow"
          onClick={() => turn("next")}
          disabled={page + step > lastIndex || !!flip}
          aria-label="Pagina successiva"
        >
          ›
        </button>
      </div>

      <div className="lb-footer">
        pagina {Math.min(page + (single ? 1 : 2), pageCount)} di {pageCount} —
        sfoglia con le frecce{single ? " o scorri col dito" : ""}
      </div>
    </div>
  );
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
