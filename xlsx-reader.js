/* Local-only XLSX reader for simple stock workbooks. No third-party services. */
(function (root) {
  "use strict";
  const TD = new TextDecoder("utf-8");
  const parseXml = (text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) throw new Error("อ่าน XML ภายใน Excel ไม่สำเร็จ");
    return doc;
  };
  const tags = (node, name) => Array.from(node.getElementsByTagNameNS("*", name));
  function makeZip(bytes) {
    const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let eocd = -1;
    for (let at = buf.length - 22; at >= Math.max(0, buf.length - 65557); at--) {
      if (dv.getUint32(at, true) === 0x06054b50) { eocd = at; break; }
    }
    if (eocd < 0) throw new Error("ไฟล์ไม่ใช่ Excel (.xlsx) ที่ถูกต้อง");
    let offset = dv.getUint32(eocd + 16, true);
    const count = dv.getUint16(eocd + 10, true);
    if (count > 4000) throw new Error("ไฟล์มีข้อมูลภายในมากเกินไป");
    const entries = new Map();
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(offset, true) !== 0x02014b50) throw new Error("โครงสร้างไฟล์ ZIP ไม่ถูกต้อง");
      const method = dv.getUint16(offset + 10, true);
      const size = dv.getUint32(offset + 20, true);
      const nameLen = dv.getUint16(offset + 28, true);
      const extraLen = dv.getUint16(offset + 30, true);
      const commentLen = dv.getUint16(offset + 32, true);
      const localAt = dv.getUint32(offset + 42, true);
      const name = TD.decode(buf.subarray(offset + 46, offset + 46 + nameLen)).replace(/^\/+/, "");
      entries.set(name, { method, size, localAt });
      offset += 46 + nameLen + extraLen + commentLen;
    }
    async function read(name) {
      const e = entries.get(name);
      if (!e) return null;
      const at = e.localAt;
      if (dv.getUint32(at, true) !== 0x04034b50) throw new Error("ไฟล์ ZIP เสียหาย");
      const start = at + 30 + dv.getUint16(at + 26, true) + dv.getUint16(at + 28, true);
      const compressed = buf.subarray(start, start + e.size);
      if (e.method === 0) return TD.decode(compressed);
      if (e.method !== 8 || !root.DecompressionStream) throw new Error("เบราว์เซอร์นี้อ่าน Excel ไม่ได้ ลอง Chrome รุ่นใหม่ หรือใช้ CSV");
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return TD.decode(await new Response(stream).arrayBuffer());
    }
    return { read, has: name => entries.has(name) };
  }
  function decodeSheet(doc, strings) {
    const out = [];
    const rows = tags(doc, "sheetData")[0];
    if (!rows) return out;
    for (const row of tags(rows, "row")) {
      const vals = [];
      for (const c of tags(row, "c")) {
        const ref = c.getAttribute("r") || "";
        const m = /^([A-Z]+)/.exec(ref);
        if (!m) continue;
        let col = 0;
        for (const ch of m[1]) col = col * 26 + ch.charCodeAt(0) - 64;
        col--;
        if (col < 0 || col > 150) continue;
        const type = c.getAttribute("t");
        const v = tags(c, "v")[0];
        let text = v ? v.textContent : "";
        if (type === "s") text = strings[Number(text)] || "";
        else if (type === "inlineStr") text = tags(c, "t").map(t => t.textContent).join("");
        else if (type === "b") text = text === "1" ? "TRUE" : "FALSE";
        vals[col] = text;
      }
      if (vals.some(x => String(x ?? "").trim())) out.push(vals);
    }
    return out;
  }
  function toObjects(table, sheetName) {
    const N = s => String(s || "").toLowerCase().replace(/[\s_-]/g, "");
    const has = (h, list) => list.some(x => h.some(col => col === N(x) || col.startsWith(N(x))));
    let start = -1;
    for (let i = 0; i < Math.min(10, table.length); i++) {
      const h = table[i].map(N);
      if (has(h, ["ProductName", "Name", "โน๊ตบุ๊ค", "ชื่อสินค้า"]) &&
          has(h, ["Quantity", "Number", "จำนวน"]) &&
          has(h, ["SetPriceTHB", "Set Price", "Price", "ราคาขาย", "ราคา"])) {
        start = i; break;
      }
    }
    if (start < 0) return [];
    const headers = table[start].map(x => String(x || "").trim());
    const canonical = h => {
      const a = N(h);
      if (a.includes("ชื่อสินค้า")) return "ProductName";
      if (a.includes("จำนวน")) return "Quantity";
      if (a.includes("ราคา")) return "SetPriceTHB";
      if (a.includes("แบรนด์")) return "Brand";
      if (a.includes("หมวด")) return "Category";
      if (a.includes("วันที่")) return "SnapshotDate";
      if (a === "sku" || a.startsWith("sku(")) return "SKU";
      return h;
    };
    return table.slice(start + 1).map((r, i) => {
      const obj = {};
      headers.forEach((name, j) => { if (name) obj[canonical(name)] = String(r[j] ?? ""); });
      if (!obj.RecordID) obj.RecordID = sheetName + ":" + (start + i + 2);
      return obj;
    }).filter(row => Object.values(row).some(v => String(v).trim()));
  }
  async function read(file) {
    if (!file || !/\.xlsx$/i.test(file.name)) throw new Error("รองรับไฟล์ Excel .xlsx เท่านั้น");
    if (file.size > 12 * 1024 * 1024) throw new Error("ไฟล์ใหญ่เกิน 12 MB");
    const zip = makeZip(await file.arrayBuffer());
    const wbXML = await zip.read("xl/workbook.xml");
    if (!wbXML) throw new Error("ไม่พบข้อมูล Workbook ใน Excel");
    const relXML = await zip.read("xl/_rels/workbook.xml.rels");
    const rels = new Map();
    if (relXML) for (const rel of tags(parseXml(relXML), "Relationship"))
      rels.set(rel.getAttribute("Id"), rel.getAttribute("Target"));
    const sharedXML = await zip.read("xl/sharedStrings.xml");
    const strings = sharedXML ? tags(parseXml(sharedXML), "si").map(si => tags(si, "t").map(t => t.textContent).join("")) : [];
    const sheets = tags(parseXml(wbXML), "sheet").map((sh, i) => {
      const name = sh.getAttribute("name");
      const rid = sh.getAttribute("r:id") || sh.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
      let target = rels.get(rid) || ("worksheets/sheet" + (i + 1) + ".xml");
      let path = target.startsWith("/") ? target.replace(/^\/+/, "") : new URL(target, "https://work.local/xl/").pathname.replace(/^\/+/, "");
      return { name, path };
    });
    if (sheets.length > 100) throw new Error("Workbook มีจำนวนชีตมากเกินไป");
    const preferred = sheets.find(s => s.name.toLowerCase() === "stock_view") || sheets.find(s => s.name.toLowerCase() === "inventory");
    const selected = preferred ? [preferred] : sheets;
    let all = [], used = [];
    for (const sh of selected) {
      const source = await zip.read(sh.path);
      if (!source) continue;
      const rows = toObjects(decodeSheet(parseXml(source), strings), sh.name);
      if (rows.length) { all = all.concat(rows); used.push(sh.name); }
    }
    if (!all.length) throw new Error("ไม่พบตารางสินค้าที่มีคอลัมน์ชื่อสินค้า จำนวน และราคา");
    async function getSheet(name) {
      const found = sheets.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (!found) return [];
      const xml = await zip.read(found.path);
      return xml ? decodeSheet(parseXml(xml), strings) : [];
    }
    const targetRows = await getSheet("Sales_Targets");
    const totalRow = targetRows.find(r => String(r[1] || "").trim().toUpperCase() === "TOTAL");
    const salesTarget = totalRow ? { target: Number(totalRow[2]) || 0, sales: Number(totalRow[3]) || 0, snapshot: String(totalRow[7] || "") } : null;
    const kpiRows = await getSheet("Attach_KPI");
    const kpi = kpiRows.slice(1).filter(r => r[1] && r[2] !== "").map(r => {
      const group = String(r[0] || ""), name = String(r[1]);
      const label = group.toLowerCase() === "insurance" ? "ประกัน " + name : group.toLowerCase() === "ufund" ? "Ufund " + name : name;
      const rate = Number(r[2]); const eligible = Number(r[3]); const count = Number(r[4]);
      return [label, rate <= 1 ? rate * 100 : rate, Number.isFinite(eligible) ? eligible : 0, Number.isFinite(count) ? count : 0];
    });
    const specRows = await getSheet("Specs_Entry");
    const specs = Object.create(null);
    for(const row of specRows.slice(1)){
      const sku=String(row[0]||"").trim();
      if(!sku || specs[sku])continue;
      specs[sku]={
        ram:String(row[4]??""),storage:String(row[5]??""),chip:String(row[6]??""),
        display:String(row[7]??""),rear:String(row[8]??""),front:String(row[9]??""),
        battery:String(row[10]??""),charging:String(row[11]??""),os:String(row[12]??""),
        connectivity:String(row[13]??""),other:String(row[14]??""),source:String(row[15]??""),
        checked:String(row[16]??""),status:String(row[17]??"")||"รอข้อมูล",
        notes:String(row[18]??"")
      };
    }
    const promoSource=await getSheet("True_Promotions"),packageSource=await getSheet("True_Packages");
    const truePromos=promoSource.slice(1).map((r,i)=>({
      id:"TP-"+(i+2),customerType:String(r[0]??""),category:String(r[1]??""),
      minPrice:Number(r[2]||0),monthly:Number(r[3]||0),discount:Number(r[4]||0),
      upfront:Number(r[5]||0),duration:String(r[6]??""),conditions:String(r[7]??""),
      source:"ร้าน / True_Promotions (ต้องยืนยันสิทธิ์และวันหมดโปร)",verified:false
    })).filter(x=>x.category&&x.monthly>0);
    const truePackages=packageSource.slice(1).map(r=>({
      id:String(r[0]??""),name:String(r[1]??""),customerType:String(r[2]??""),
      monthly:Number(r[3]||0),data:String(r[4]??""),voice:Number(r[5]||0),
      wifi:String(r[6]??""),duration:String(r[7]??""),source:String(r[8]??""),
      checked:String(r[9]??""),notes:String(r[10]??""),discount:0,upfront:0
    })).filter(x=>x.id&&x.monthly>0);
    return { rows: all, sheets: used, salesTarget, kpi, specs, truePromos, truePackages };

  }
  root.PIAExcel = { read };
})(window);
