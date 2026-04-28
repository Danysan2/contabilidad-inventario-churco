import { google } from "googleapis";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendSaleToSheet(sale: {
  id: string;
  createdAt: Date;
  employeeName: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
  total: number;
}) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return;

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const rows = sale.items.map((item) => [
    sale.id,
    sale.createdAt.toISOString(),
    sale.employeeName,
    item.productName,
    item.quantity,
    item.unitPrice,
    item.quantity * item.unitPrice,
    sale.total,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Ventas!A:H",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

export async function syncProductsToSheet(
  products: { id: string; name: string; sku: string; category: string; price: number; stock: number }[]
) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return;

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const header = [["ID", "Nombre", "SKU", "Categoría", "Precio", "Stock", "Última Actualización"]];
  const rows = products.map((p) => [p.id, p.name, p.sku, p.category, p.price, p.stock, new Date().toISOString()]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Inventario!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [...header, ...rows] },
  });
}
