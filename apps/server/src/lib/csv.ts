export function toCsv<T extends Record<string, any>>(
  rows: T[],
  headers?: string[]
): string {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const keys = headers && headers.length ? headers : Object.keys(rows[0] || {});
  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes("\n") || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const head = keys.join(",");
  const body = rows
    .map((r) => keys.map((k) => escape(r[k])).join(","))
    .join("\n");
  return `${head}\n${body}\n`;
}
