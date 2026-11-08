/* Brand catalog browser: names and categories only. Never claim that cached counts are live. */
(function(root){
"use strict";
const labels={Smartphone:"มือถือ",Notebook:"โน้ตบุ๊ก",Tablet:"แท็บเล็ต",Smartwatch:"สมาร์ตวอตช์",Accessory:"อุปกรณ์เสริม",Gadget:"แกดเจ็ต",Gaming:"เกมมิ่ง",Network:"เน็ตเวิร์ก",Printer:"เครื่องพิมพ์",SIM:"ซิม",Service:"บริการ",Demo:"เครื่องสาธิต","Store Supplies":"ของใช้ร้าน",Other:"อื่น ๆ"};
const icons={Smartphone:"📱",Notebook:"💻",Tablet:"▣",Smartwatch:"⌚",Accessory:"⌁",Gadget:"🎧",Gaming:"🎮",Network:"◉",Printer:"▤",SIM:"▧",Service:"✦",Demo:"◫","Store Supplies":"▥",Other:"▦"};
function render(data,state,esc,fmt){
 const catalog=root.ForWorkCatalog?.directory||{};
 const types=[...new Set([...Object.keys(catalog),...(data.products||[]).map(x=>x.category).filter(Boolean)])];
 const category=types.includes(state.catalogType)?state.catalogType:types[0]||"Smartphone";
 const brands=[...(catalog[category]||[]),...(data.products||[]).filter(x=>x.category===category).map(x=>x.brand),...(data.customBrands||[]).filter(x=>x.category===category).map(x=>x.brand)];
 const seen=new Set(),all=brands.filter(b=>{const key=String(b||"").toLocaleLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>a.localeCompare(b,"th"));
 const query=String(state.brandSearch||"").toLocaleLowerCase();
 const filtered=all.filter(b=>b.toLocaleLowerCase().includes(query));
 const saved=(data.products||[]).filter(x=>x.category===category),incomplete=!!state.inventoryIncomplete;
 const gidMap={Smartphone:{Samsung:501701,Xiaomi:501702,OPPO:501703,TECNO:501704,HONOR:501705,ZTE:501706,vivo:501707,Apple:501708,Infinix:501709,iQOO:501710,realme:501711,Nothing:501712},Notebook:{HP:501713,ASUS:501714,Acer:501715,Lenovo:501716,Apple:501717}};
 const base=data.sheetId?"https://docs.google.com/spreadsheets/d/"+encodeURIComponent(data.sheetId)+"/edit#gid=":"";
 let h='<div class="category-tabs" role="group" aria-label="ประเภทอุปกรณ์">'+types.map(c=>'<button type="button" class="'+(c===category?"on":"")+'" data-catalog-type="'+esc(c)+'">'+(icons[c]||"▦")+' '+esc(labels[c]||c)+'</button>').join("")+'</div>';
 h+='<div class="brand-list-head"><b>'+(icons[category]||"▦")+' '+esc(labels[category]||category)+'</b><span>'+fmt(all.length)+' แบรนด์ · '+fmt(saved.length)+' รุ่นที่เก็บในมือถือ'+(incomplete?' (ยังไม่ครบ)':'')+'</span></div>';
 h+='<input id="brandSearch" class="search" type="search" placeholder="ค้นหาชื่อแบรนด์..." value="'+esc(state.brandSearch||"")+'">';
 h+='<div class="brand-cards" style="margin-top:13px">';
 if(!filtered.length)h+='<div class="empty">ไม่พบแบรนด์ที่ค้นหา</div>';
 for(const b of filtered){
   const items=saved.filter(x=>String(x.brand||"").toLocaleLowerCase()===b.toLocaleLowerCase());
   const qty=items.reduce((v,x)=>v+(Number(x.qty)||0),0);
   const gid=gidMap[category]?.[b];
   const text=items.length?fmt(items.length)+' รุ่น · '+fmt(qty)+' หน่วย'+(incomplete?' (ในเครื่อง)':''):'ยังไม่มีรุ่นในข้อมูลที่โหลด';
   h+='<div class="brand-card-wrap"><button type="button" class="brand-big" data-brand-facet="'+esc(b)+'" data-device="'+esc(category)+'"><b>'+esc(b)+'</b><span class="brand-number">'+text+'</span><span class="brand-detail">กดเพื่อดูรุ่น / สเปก</span></button>'+(base&&gid?'<a class="brand-sheet-link" target="_blank" rel="noopener noreferrer" href="'+base+gid+'">เปิดชีตแบรนด์</a>':'')+'</div>';
 }
 h+='</div>';
 if(base)h+='<div class="quick-actions" style="margin-top:15px"><a class="btn" href="'+base+'501700" target="_blank" rel="noopener">ดู Brand_Hub ใน Google Sheets</a><a class="btn" href="'+base+'501503" target="_blank" rel="noopener">ค้นหา SKU</a></div>';
 return h;
}
root.ForWorkBrandBrowser={render,labels,icons};
})(window);
