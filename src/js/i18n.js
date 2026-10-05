import { api } from "./api.js";
import es from "../../public/i18n/es.json";
import en from "../../public/i18n/en.json";

const BUNDLED = { es, en };
const FALLBACK = "es";

let lang = FALLBACK;
let dict = flatten(BUNDLED[FALLBACK]);

function flatten(o, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

// Idioma de la app (ej. "es", "en"); si no está disponible, el de respaldo
export async function currentLanguage() {
  try { return String(await api().getCurrentLanguage() || FALLBACK).toLowerCase(); }
  catch (e) { return FALLBACK; }
}
export const getLang = () => lang;

// Pide cada clave al host (PluginAPI.translate); si no responde, usa los textos incluidos en el bundle
export async function loadI18n() {
  lang = await currentLanguage();
  const base = flatten(BUNDLED[lang.split("-")[0]] || BUNDLED[FALLBACK]);
  const next = { ...flatten(BUNDLED[FALLBACK]), ...base };
  try {
    const A = api();
    await Promise.all(Object.keys(base).map(async (k) => {
      const v = await A.translate(k);
      if (typeof v === "string" && v && v !== k) next[k] = v;
    }));
  } catch (e) {}
  dict = next;
}

export function t(key, params) {
  const s = dict[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (m, p) => (p in params ? params[p] : m)) : s;
}

// Textos del HTML estático: data-i18n="CLAVE" y data-i18n-attr="atributo:CLAVE,..."
export function applyStatic(root = document) {
  document.documentElement.lang = lang.split("-")[0];
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(",")) {
      const [attr, key] = pair.split(":");
      el.setAttribute(attr.trim(), t(key.trim()));
    }
  });
}

// Fechas con Intl según el idioma activo
function fmt(date, opts) {
  try { return new Intl.DateTimeFormat(lang, opts).format(date); }
  catch (e) { return new Intl.DateTimeFormat(FALLBACK, opts).format(date); }
}
export const monthName = (mo) => fmt(new Date(2024, mo, 1), { month: "long" });
export const monthShort = (mo) => fmt(new Date(2024, mo, 1), { month: "short" });
// i: 0 = lunes … 6 = domingo
export const weekdayShortMon = (i) => fmt(new Date(2024, 0, 1 + i), { weekday: "short" });
export const weekdayShortOf = (dateStr) => fmt(new Date(dateStr + "T12:00:00"), { weekday: "short" });
