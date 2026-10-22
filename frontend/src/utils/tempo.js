// "45s", "2min 16s" ou "1h 05min" — "—" quando não há tempo registrado.
export function formatarTempo(segundos) {
  if (segundos == null) return "—";
  const s = Math.round(segundos);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}min`;
}
