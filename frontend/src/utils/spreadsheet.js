import * as XLSX from "xlsx";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export async function parseSpreadsheetPreview(file) {
  if (!file) {
    return [];
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  return XLSX.utils
    .sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    })
    .map((row) => {
      const normalized = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[normalizeHeader(key)] = value;
      });
      return normalized;
    });
}
