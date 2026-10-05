import { hm } from "./utils.js";

const cell = (v) => (/[",\r\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

// Una fila por proyecto, día y tarea, agrupadas por proyecto (mismo orden que el reporte) y por fecha.
// Encabezados en inglés, igual que el Markdown.
export function buildCsv(all) {
  const rows = [];
  for (const x of all) for (const r of x.rows) for (const it of r.items) {
    rows.push([x.name, r.date, it.title, (it.min / 60).toFixed(2), hm(it.min)]);
  }
  return [["Project", "Date", "Task", "Hours", "Time"], ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
