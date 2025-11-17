// Minimal CSV parser for server-side use.
// Supports:
// - Comma-separated values
// - Double-quoted fields with commas/newlines inside
// - First row as header

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField);
    currentField = "";
  };

  const pushRow = () => {
    // Skip completely empty rows
    if (currentRow.length > 0 && currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
    currentRow = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        // Look ahead for escaped quote
        const next = text[i + 1];
        if (next === '"') {
          currentField += '"';
          i++; // skip next
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        pushField();
      } else if (char === "\n" || char === "\r") {
        // Handle CRLF and LF
        // If CRLF, skip the LF
        if (char === "\r" && text[i + 1] === "\n") {
          i++;
        }
        pushField();
        pushRow();
      } else {
        currentField += char;
      }
    }
  }

  // Push last field/row if any
  pushField();
  if (currentRow.length > 0) pushRow();

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);
  const result: CsvRow[] = dataRows.map((fields) => {
    const row: CsvRow = {};
    header.forEach((key, idx) => {
      row[key] = fields[idx] ?? "";
    });
    return row;
  });
  return result;
}
