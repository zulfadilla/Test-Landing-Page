// Google Sheets > Extensions > Apps Script. Tampal, set SECRET, Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone). Salin URL ke SHEETS_WEBHOOK_URL di Netlify.
const SECRET = "tukar-rahsia-ini";
const COLS = ["id","createdAt","updatedAt","status","mode","item","qty","subtotal","shipping","total","name","phone","email","address","postcode","city","state","notes","billCode","refNo"];
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.secret !== SECRET) return ContentService.createTextOutput("forbidden");
  const o = body.order, sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(COLS);
  const ids = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues().flat();
  const row = COLS.map(c => o[c] ?? "");
  const i = ids.indexOf(o.id);
  if (i > 0) sh.getRange(i + 1, 1, 1, COLS.length).setValues([row]); else sh.appendRow(row);
  return ContentService.createTextOutput("ok");
}
