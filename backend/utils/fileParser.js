const xlsx = require("xlsx");

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeRow = (row) => {
  const normalized = {};

  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] =
      typeof value === "string" ? value.trim() : value;
  });

  return normalized;
};

const parseSpreadsheet = (file) => {
  if (!file?.buffer) {
    throw new Error("No file uploaded");
  }

  const workbook = xlsx.read(file.buffer, {
    type: "buffer",
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  return xlsx.utils
    .sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    })
    .map(normalizeRow);
};

module.exports = {
  parseSpreadsheet,
};
