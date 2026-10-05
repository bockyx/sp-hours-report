import { hm } from "./utils.js";

const cell = (v) => (/[",\r\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

// Una fila por proyecto, día y tarea. Encabezados en inglés, igual que el Markdown.
export function buildCsv(all) {
  const rows = [];
  for (const x of all) for (const r of x.rows) for (const it of r.items) {
    rows.push([r.date, x.name, it.title, (it.min / 60).toFixed(2), hm(it.min)]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]) || a[2].localeCompare(b[2]));
  return [["Date", "Project", "Task", "Hours", "Time"], ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

// Guarda con la API del plugin; si no existe, descarga con un enlace temporal
export async function saveFile(name, text, api) {
  try { await api().downloadFile(name, "\ufeff" + text); return true; } catch (e) {}
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    return true;
  } catch (e) { return false; }
}
