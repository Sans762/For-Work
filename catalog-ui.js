/* Dynamic, on-device catalog breakdown. Never embeds private stock values. */
(function(root){
"use strict";
const order=["Smartphone","Notebook","Tablet","Smartwatch","Accessory","Gadget","Network","Gaming","Printer","SIM","Service","Demo","Other","Store Supplies"];
const labels={Smartphone:"มือถือ",Notebook:"โน้ตบุ๊ก",Tablet:"แท็บเล็ต",Smartwatch:"สมาร์ตวอตช์",Accessory:"อุปกรณ์เสริม",Gadget:"แกดเจ็ต",Network:"อุปกรณ์เน็ตเวิร์ก",Gaming:"เกมมิ่ง",Printer:"เครื่องพิมพ์",SIM:"ซิม",Service:"บริการ",Demo:"เครื่องสาธิต",Other:"อื่น ๆ","Store Supplies":"ของใช้ร้าน"};
const icons={Smartphone:"📱",Notebook:"💻",Tablet:"▣",Smartwatch:"⌚",Accessory:"⌁",Gadget:"🎧",Network:"◉",Gaming:"🎮",Printer:"▤",SIM:"▧",Service:"✦",Demo:"◫",Other:"▦","Store Supplies":"▥"};
function stats(items){
 const byDevice=new Map(),byBrand=new Map(),byPair=new Map();
 for(const x of items||[]){
  const cat=String(x.category||"Other"),brand=String(x.brand||"อื่น ๆ"),qty=Math.max(0,Number(x.qty)||0);
  for(const [map,key] of [[byDevice,cat],[byBrand,brand],[byPair,cat+"|"+brand]]){
   if(!map.has(key))map.set(key,{count:0,qty:0});
   const item=map.get(key);item.count++;item.qty+=qty;
  }
 }
 return {byDevice,byBrand,byPair};
}
function render(items,state,escape,fmt,compact){
 if(!Array.isArray(items)||!items.length)return "";
 const st=stats(items);
 const types=[...st.byDevice.keys()].sort((a,b)=>{
  const x=order.indexOf(a),y=order.indexOf(b);
  return (x<0?99:x)-(y<0?99:y)||a.localeCompare(b,"th");
 });
 const brands=[...st.byBrand.entries()].sort((a,b)=>b[1].qty-a[1].qty||a[0].localeCompare(b[0],"th"));
 let h='<section class="card" style="margin-top:14px"><div class="brand-head"><div><h3 class="section" style="margin:0">แยกตามประเภทอุปกรณ์</h3><div class="small">'+fmt(types.length)+' หมวด · '+fmt(brands.length)+' แบรนด์</div></div></div>';
 h+='<div class="device-grid" style="margin-top:13px">'+types.map(cat=>{
  const row=st.byDevice.get(cat);
  return '<button class="device-tile '+(state.type===cat?"on":"")+'" data-device-facet="'+escape(cat)+'"><span class="dev-icon">'+(icons[cat]||"▦")+'</span><span class="dev-name">'+escape(labels[cat]||cat)+'</span><span class="dev-data">'+fmt(row.count)+' รุ่น · '+fmt(row.qty)+' หน่วย</span></button>';
 }).join("")+'</div>';
 h+='<div class="notice" style="margin-top:12px">Demo, บริการ และของใช้ร้านแยกเป็นหมวดเฉพาะ ไม่ใช่สต็อกพร้อมขายใน POS ทั้งหมด</div>';
 h+='<details style="margin-top:14px" '+(compact?'':'open')+'><summary style="cursor:pointer;font-weight:850">ดูแบรนด์ทั้งหมด ('+fmt(brands.length)+')</summary>';
 h+='<div class="brand-badges" style="margin-top:10px">'+brands.map(([brand,x])=>'<button class="brand-chip" data-brand-facet="'+escape(brand)+'">'+escape(brand)+' <b>'+fmt(x.qty)+'</b><span class="small"> · '+fmt(x.count)+' รุ่น</span></button>').join("")+'</div>';
 if(!compact){
  h+='<h3 class="section" style="margin-top:18px">แบรนด์ในแต่ละหมวด</h3>';
  for(const cat of types){
   const entries=[...st.byPair.entries()].filter(([key])=>key.startsWith(cat+"|")).map(([key,x])=>[key.slice(cat.length+1),x]).sort((a,b)=>b[1].qty-a[1].qty);
   h+='<div class="brand-set"><div class="small" style="font-weight:850;margin-bottom:8px">'+(icons[cat]||"▦")+' '+escape(labels[cat]||cat)+' · '+fmt(entries.length)+' แบรนด์</div><div class="brand-badges">'+entries.map(([brand,x])=>'<button class="brand-chip" data-brand-facet="'+escape(brand)+'" data-device="'+escape(cat)+'">'+escape(brand)+' <b>'+fmt(x.qty)+'</b></button>').join("")+'</div></div>';
  }
 }
 return h+'</details></section>';
}
// Names and equipment types only, no SKU, stock amounts, prices, or sales.
// Snapshot of supported catalog facets; signed-in Stock_View is authoritative for quantities.
const directory={"Smartphone":["Apple","HONOR","Infinix","iQOO","Nothing","OPPO","realme","Samsung","TECNO","vivo","Xiaomi","ZTE"],"Notebook":["Acer","Apple","ASUS","HP","Lenovo"],"Tablet":["ALLDOCUBE","Apple","BLUE BOX","HONOR","Huawei","Lenovo","OPPO","Samsung","TCL","TECNO","Xiaomi"],"Smartwatch":["AMAZFIT","Apple","HONOR","Huawei","IMOO","MIBRO","Xiaomi"],"Accessory":["7DEGREE","Acer","ALLDOCUBE","ALPHA","ANITECH","APC","Apple","BASEUS","BLUE BOX","BRIGHT","COM7","CYBER","DINO","EPSON","FOX","HERO CAT","HONOR","HP","Huawei","Infinix","iQOO","JOYROOM","JTL","Lenovo","LEXAR","Logitech","MARSHALL","MIBRO","MICROSOFT","Nothing","OPPO","PHILIPS","QPLUS","realme","Samsung","SanDisk","SCREEN CARE","SHEEP","TCL","TECHPRO","TECNO","TOSHINO","UAG","UGREEN","UKIKI","UNIQ","UVOLT","VEGER","VENTION","vivo","WD","WHY","Xiaomi","ZTE"],"Gadget":["BASEUS","BLUE BOX","DJI","FOX","Huawei","JBL","JISULIFE","JLAB","MARSHALL","QPLUS","TECHPRO","TITANV","UGREEN","WHOOP","Xiaomi"],"Gaming":["FANTECH","Logitech","SIGNO","SONY"],"Network":["D-LINK","TP-LINK","UGREEN"],"Printer":["BROTHER","EPSON","HP"],"SIM":["TRUEMOVE"],"Service":["7 SCREEN CARE","Apple","BANANA","BANANA IT","BANANA NOTEBOOK","GADGET","SOCIAL","TRUEMOVE"],"Demo":["70MAI","Acer","ALLDOCUBE","Apple","ASUS","BRIGHT","CMF","DJI","HONOR","HP","Huawei","Infinix","iQOO","JBL","JISULIFE","Lenovo","MARSHALL","MIBRO","Nothing","OPPO","realme","Samsung","SONY","TECHPRO","TECNO","vivo","Xiaomi","ZTE"],"Store Supplies":["BANANA"]};
function allTypes(){return Object.keys(directory)}
function brandsFor(type){return type==="ทั้งหมด"?[...new Set(Object.values(directory).flat())].sort((a,b)=>a.localeCompare(b,"th",{sensitivity:"base"})):(directory[type]||[]).slice()}
root.ForWorkCatalog={render,stats,directory,allTypes,brandsFor};
})(window);
