/* For Work — private Google Sheets sync via Google Identity Services.
   OAuth access tokens remain in memory, never stored or sent to this host.
   The Google OAuth client ID is a public configuration value, not a secret.
*/
(function (root) {
  "use strict";
  const READ_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
  const WRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
  const PREF_KEY = "for-work-google-oauth-client-id";
  const sheetIdOK = /^[a-zA-Z0-9_-]{20,130}$/;
  const clientIdOK = /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/;
  let readAccess = "", readUntil = 0, writeAccess = "", writeUntil = 0, running = false;
  const now = () => Date.now();
  const number = v => {
    if (typeof v === "number") return v;
    const n = Number(String(v ?? "").replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  };
  const text = v => String(v ?? "").trim();
  const getClientId = () => {
    try { return localStorage.getItem(PREF_KEY) || ""; } catch (_) { return ""; }
  };
  function setClientId(value) {
    const clientId = text(value);
    if (!clientIdOK.test(clientId)) throw new Error("OAuth Client ID ไม่ถูกต้อง ต้องลงท้ายด้วย .apps.googleusercontent.com");
    try { localStorage.setItem(PREF_KEY, clientId); } catch (e) { throw new Error("เบราว์เซอร์บันทึกการตั้งค่าไม่ได้"); }
    readAccess = ""; writeAccess = "";
  }
  function disconnect() { readAccess = ""; writeAccess = ""; readUntil = 0; writeUntil = 0; }
  function hasAccess(write) {
    return write ? Boolean(writeAccess && writeUntil > now() + 30000) :
      Boolean((writeAccess && writeUntil > now() + 30000) || (readAccess && readUntil > now() + 30000));
  }
  function signIn(mode) {
    /* Call directly from a user click. Do not put an await before requestAccessToken. */
    const clientId = getClientId();
    if (!clientId) throw new Error("ต้องตั้ง OAuth Client ID ก่อนเชื่อมบัญชี Google");
    if (!root.google || !root.google.accounts || !root.google.accounts.oauth2)
      throw new Error("โหลด Google Sign-In ไม่สำเร็จ ให้เปิดใน Chrome และตรวจการเชื่อมต่ออินเทอร์เน็ต");
    return new Promise((resolve, reject) => {
      try {
        const write = mode === "write";
        const tokenClient = root.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: write ? WRITE_SCOPE : READ_SCOPE,
          include_granted_scopes: true,
          callback: function (res) {
            if (!res || res.error || !res.access_token) return reject(new Error(res?.error_description || res?.error || "Google ไม่อนุญาตให้เข้าถึงข้อมูล"));
            if (!root.google.accounts.oauth2.hasGrantedAllScopes(res, write ? WRITE_SCOPE : READ_SCOPE))
              return reject(new Error("บัญชี Google ไม่ได้อนุญาตขอบเขตสิทธิ์ที่จำเป็น"));
            const expiration = now() + (Math.max(60, Number(res.expires_in || 3500)) - 30) * 1000;
            if (write) { writeAccess = res.access_token; writeUntil = expiration; }
            else { readAccess = res.access_token; readUntil = expiration; }
            resolve(true);
          },
          error_callback: function (err) { reject(new Error("ไม่สามารถเปิดหน้าต่าง Google ได้: " + (err?.type || "popup blocked"))); }
        });
        tokenClient.requestAccessToken({ prompt: hasAccess(write) ? "" : "select_account" });
      } catch (e) { reject(e); }
    });
  }
  const validSheet = id => {
    if (!sheetIdOK.test(String(id || ""))) throw new Error("ยังไม่ได้เลือก Google Sheets ที่จะซิงก์");
    return id;
  };
  function apiURL(id, path) {
    return "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(validSheet(id)) + path;
  }
  async function request(url, options, write) {
    const token = write ? writeAccess : (hasAccess(true) ? writeAccess : readAccess);
    if (!hasAccess(Boolean(write))) throw new Error("Google Session หมดอายุ กรุณากดเชื่อม Google อีกครั้ง");
    const res = await fetch(url, {
      ...options,
      headers: { "Authorization": "Bearer " + token, ...(options?.body ? { "Content-Type": "application/json" } : {}) }
    });
    if (!res.ok) {
      if (res.status === 401) disconnect();
      let error = "";
      try { error = (await res.json()).error?.message || ""; } catch (_) {}
      if (res.status === 403) throw new Error("ไม่มีสิทธิ์อ่าน/แก้ชีต หรือ Sheets API ยังไม่เปิดใช้ (" + (error || "403") + ")");
      if (res.status === 404) throw new Error("ไม่พบ Google Sheets นี้ กรุณาตรวจลิงก์และบัญชีที่ใช้");
      if (res.status === 401) throw new Error("Google Session หมดอายุ กรุณาเชื่อมบัญชีใหม่");
      throw new Error("Google Sheets ตอบกลับ " + res.status + ": " + (error || "ลองใหม่"));
    }
    return res.json();
  }
  function value(x) { return text(x); }
  function rowObjects(matrix) {
    if (!Array.isArray(matrix) || !matrix.length) return [];
    const keys = matrix[0].map(value);
    return matrix.slice(1).map(r => {
      const v = {};
      keys.forEach((k, i) => { if (k) v[k] = r[i] ?? ""; });
      return v;
    });
  }
  function inferBrand(name) {
    return /samsung/i.test(name) ? "Samsung" :
      /oppo/i.test(name) ? "OPPO" : /vivo/i.test(name) ? "vivo" :
      /notebook|laptop|lenovo|asus|acer|macbook|ideapad|victus/i.test(name) ? "Notebook" : "อื่นๆ";
  }
  function normalize(x, i) {
    const name = text(x.ProductName || x.Name);
    const qty = number(x.Quantity ?? x.Number);
    const price = number(x.SetPriceTHB ?? x["Set Price"]);
    if (!name || qty < 0 || price < 0 || !Number.isFinite(qty) || !Number.isFinite(price)) return null;
    const brand = text(x.Brand) || inferBrand(name);
    return {
      id: text(x.RecordID) || "GS:" + i,
      sku: text(x.SKU), name,
      brand,
      category: text(x.Category) || (brand === "Notebook" ? "Notebook" : "Smartphone"),
      qty: Math.floor(qty), price,
      snapshotDate: text(x.SnapshotDate)
    };
  }
  async function sync(sheetId) {
    if (running) throw new Error("กำลังซิงก์อยู่แล้ว");
    running = true;
    try {
      const params = new URLSearchParams();
      ["Stock_View!A1:H1500", "Sales_Targets!A1:I12", "Attach_KPI!A1:H25", "Start_Here!A5:B9"].forEach(r => params.append("ranges", r));
      params.set("valueRenderOption", "UNFORMATTED_VALUE");
      const response = await request(apiURL(sheetId, "/values:batchGet?" + params.toString()), { method: "GET" }, false);
      const a = response.valueRanges || [];
      const rows = rowObjects(a[0]?.values);
      if (!rows.length) throw new Error("ชีต Stock_View ยังไม่มีรายการ ให้ตรวจ Start_Here");
      const items = rows.map(normalize).filter(Boolean);
      if (!items.length) throw new Error("Stock_View ไม่มีข้อมูลสินค้าที่ถูกต้อง");
      if (items.length !== rows.filter(x => text(x.ProductName)).length)
        throw new Error("มีข้อมูลสินค้าไม่ครบหรือจำนวนติดลบ โปรดตรวจ Stock_Input");
      const seen = new Set();
      for (const product of items) {
        if (seen.has(product.id)) throw new Error("RecordID ซ้ำใน Stock_View: " + product.id);
        seen.add(product.id);
      }
      const salesRows = rowObjects(a[1]?.values);
      const total = salesRows.find(x => text(x.Category).toUpperCase() === "TOTAL");
      const kpiRows = rowObjects(a[2]?.values);
      const kpi = kpiRows.filter(x => text(x.Product) && x.TargetPct !== "").map(x => {
        const group = text(x.Group), name = text(x.Product);
        const label = group.toLowerCase() === "insurance" ? "ประกัน " + name : group.toLowerCase() === "ufund" ? "Ufund " + name : name;
        const p = number(x.TargetPct);
        return [label, p <= 1 ? Math.round(p * 10000) / 100 : p, number(x.EligibleSales), number(x.AttachCount)];
      });
      let sourceLabel = "", snapshotDate = "";
      const statusRows = a[3]?.values || [];
      for (const row of statusRows) {
        if (text(row[0]) === "แหล่งข้อมูลปัจจุบัน") sourceLabel = text(row[1]);
        if (text(row[0]).includes("วันที่สต็อกใหม่")) snapshotDate = text(row[1]);
      }
      return {
        products: items, stockQty: items.reduce((sum,p) => sum + p.qty,0),
        target: total ? number(total.MonthlyTargetTHB) : null,
        sales: total ? number(total.SalesAtSnapshotTHB) : null,
        salesDate: total ? text(total.SnapshotDate) : "",
        kpi, sourceLabel, snapshotDate,
        syncedAt: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
      };
    } finally { running = false; }
  }
  async function writeValues(sheetId, range, values, input="RAW") {
    const url = apiURL(sheetId, "/values/" + encodeURIComponent(range) + "?valueInputOption=" + encodeURIComponent(input));
    return request(url, { method: "PUT", body: JSON.stringify({ range, majorDimension: "ROWS", values }) }, true);
  }
  async function upload(sheetId, products, snapshotDate) {
    if (!hasAccess(true)) throw new Error("กรุณายืนยันสิทธิ์แก้ไข Google Sheets ก่อนอัปโหลด");
    if (!Array.isArray(products) || !products.length) throw new Error("ยังไม่มีสินค้าในเว็บให้ส่งไป Google Sheets");
    if (products.length > 1499) throw new Error("รองรับสินค้าได้สูงสุด 1,499 รายการต่อชุด");
    /* The simple Stock_Input layout is: Name, Qty, Price, Brand, Category, SKU, SnapshotDate. Disable the new source until the replacement succeeds. */
    await writeValues(sheetId, "Start_Here!B5", [[false]], "USER_ENTERED");
    await request(apiURL(sheetId, "/values:batchClear"), {
      method: "POST",
      body: JSON.stringify({ ranges: ["Stock_Input!A2:G1500"] })
    }, true);
    const rows = products.map(p => [
      text(p.name), Math.max(0, Math.floor(number(p.qty))),
      Math.max(0,number(p.price)), text(p.brand),text(p.category),
      text(p.sku),text(snapshotDate || p.snapshotDate)
    ]);
    await writeValues(sheetId, "Stock_Input!A2:G" + (rows.length + 1), rows, "RAW");
    if (snapshotDate) await writeValues(sheetId, "Start_Here!B6", [[snapshotDate]], "RAW");
    await writeValues(sheetId, "Start_Here!B5", [[true]], "USER_ENTERED");
    return { rows: rows.length, units: rows.reduce((n, row) => n + number(row[2]), 0) };
  }

  const PHOTO_FIELDS=["target","sales","lastMonth","lastYear","forecast","achieve","forecastPct","mom","yoy","targetDay","commission"];
  async function appendPhotoReport(sheetId, snapshot){
    if(!hasAccess(true))throw new Error("กรุณากดอนุญาตสิทธิ์แก้ไข Google Sheets ก่อน");
    if(!snapshot||!snapshot.verified||!snapshot.rows||!snapshot.rows.length)
      throw new Error("กรุณาตรวจสอบตัวเลขในภาพก่อนบันทึก");
    const date=text(snapshot.reportDate),captured=text(snapshot.capturedAt);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("กรุณาใส่วันที่รายงาน (YYYY-MM-DD)");
    if(snapshot.rows.length>20)throw new Error("จำนวนแถวมากผิดปกติ");
    const ids=new Set();
    const values=snapshot.rows.map(row=>{
      const category=text(row.category);
      if(!category||ids.has(category))throw new Error("พบหมวดสินค้าซ้ำหรือหมวดว่าง");
      ids.add(category);
      return [
        captured,date,"PIA",category,
        ...PHOTO_FIELDS.map(key=>{
          const val=row[key];
          if(val===null||val===""||val===undefined)return "";
          const n=Number(val);
          if(!Number.isFinite(n)||n<0||n>1000000000)throw new Error("ตัวเลขผิดปกติในหมวด "+category+": "+key);
          return n;
        }),
        true,"Photo OCR (reviewed)",text(snapshot.note||"")
      ];
    });
    const url=apiURL(sheetId,"/values/"+encodeURIComponent("PIA_Photo_Log!A:R")+":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS");
    const response=await request(url,{method:"POST",body:JSON.stringify({majorDimension:"ROWS",values})},true);
    return {count:values.length,updatedRange:response.updates?.updatedRange||""};
  }
  function isClientId(v) { return clientIdOK.test(text(v)); }
  root.ForWorkGoogle = { signIn, hasAccess, sync, upload, appendPhotoReport, disconnect, getClientId, setClientId, isClientId };
})(window);
