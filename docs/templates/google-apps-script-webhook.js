/**
 * Numapetstore — Google Sheets Webhook (Apps Script)
 *
 * Receives orders from the FastAPI backend and appends them as rows.
 * Auto-creates the "Orders" tab and header row on first call.
 *
 * Setup:
 *   1. Open https://sheets.google.com → create a new sheet (or open existing).
 *   2. Extensions → Apps Script. Paste this entire file. Save (Ctrl+S).
 *   3. (Optional) Set a secret: Project Settings → Script properties →
 *      Add property `WEBHOOK_SECRET` with a long random string.
 *   4. Deploy → New deployment → Type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *      - Click Deploy → copy the Web app URL.
 *   5. Paste that URL in Easypanel backend env as GOOGLE_SHEETS_WEBHOOK_URL
 *      and the same secret as GOOGLE_SHEETS_WEBHOOK_SECRET (if you set one).
 *   6. Redeploy backend. Place a test order. The Orders tab fills up.
 *
 * Re-deploy after editing: Deploy → Manage deployments → pencil icon → New version.
 */

const ORDERS_SHEET = "Orders";

const HEADERS = [
  "Created At",
  "Order Number",
  "Status",
  "Customer Name",
  "Phone (E.164)",
  "Phone (raw)",
  "Address",
  "City",
  "Country",
  "Geo City",
  "Total",
  "Currency",
  "Items",
  "Fast Shipping",
  "Shipping Total",
  "IP",
  "Event ID",
  "Order ID",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    const expectedSecret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
    if (expectedSecret && body.secret !== expectedSecret) {
      return json({ ok: false, error: "unauthorized" });
    }

    if (body.type !== "order" || !body.order) {
      return json({ ok: false, error: "invalid_payload" });
    }

    appendOrder(body.order);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  // Health check — visit the deployment URL in a browser to confirm it's live.
  return json({ ok: true, service: "numapet-sheets-webhook" });
}

function appendOrder(order) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ORDERS_SHEET);
  }

  // Ensure header row exists.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    order.created_at || new Date().toISOString(),
    order.order_number || "",
    order.status || "pending_confirmation",
    order.customer_name || "",
    order.phone_e164 || "",
    order.phone_raw || "",
    order.address || "",
    order.city || "",
    order.geo_country || "",
    order.geo_city || "",
    order.total || 0,
    order.currency || "USD",
    order.items_summary || "",
    order.fast_shipping ? "yes" : "no",
    order.shipping_total || 0,
    order.ip_address || "",
    order.event_id || "",
    order.order_id || "",
  ]);
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
