/* For Work – device specifications renderer. No hardcoded private product inventory.
 * A SKU match from the private Specs_Entry sheet takes precedence.
 * Any variant derived from the stock name is clearly marked unverified.
 */
(function(root){
"use strict";
const labels={
 ram:"RAM",storage:"ความจุ",chip:"ชิป / CPU",display:"หน้าจอ",rear:"กล้องหลัง",
 front:"กล้องหน้า",battery:"แบตเตอรี่",charging:"การชาร์จ",os:"ระบบปฏิบัติการ",
 connectivity:"การเชื่อมต่อ",other:"สเปกเพิ่มเติม"
};
const ordered=Object.keys(labels);
const validUrl=url=>/^https:\/\/[^\s"'<>]+$/i.test(String(url||"").trim())?String(url).trim():"";
function fromName(name){
 const s=String(name||"");
 const m=s.match(/\(\s*(\d{1,2})\s*\+\s*(\d{2,4})\s*(TB|GB|G)?\s*\)/i);
 if(!m)return null;
 const ram=Number(m[1]),storage=Number(m[2])*(m[3]?.toUpperCase()==="TB"?1024:1);
 if(ram<1||ram>64||storage<16||storage>4096)return null;
 return {ram:String(ram),storage:String(storage)};
}
function get(product,specIndex){
 const raw=(specIndex&&product&&product.sku?specIndex[String(product.sku)]:null)||null;
 const nameMemory=fromName(product?.name);
 if(raw){
  const output={...raw};
  if((output.ram===""||output.ram==null)&&nameMemory)output.ram=nameMemory.ram;
  if((output.storage===""||output.storage==null)&&nameMemory)output.storage=nameMemory.storage;
  const official=["ยืนยันจากผู้ผลิต","ตรวจจากเอกสารผู้จำหน่าย"].includes(String(output.status||""));
  return {fields:output,status:output.status||"รอข้อมูล",official,source:validUrl(output.source),
          inferred:!official&&Boolean(nameMemory),hasDetails:ordered.some(key=>String(output[key]??"").trim())};
 }
 if(nameMemory){
  return {fields:{...nameMemory},status:"จากชื่อรุ่น (ยังไม่ยืนยัน)",official:false,source:"",inferred:true,hasDetails:true};
 }
 return {fields:{},status:"รอข้อมูล",official:false,source:"",inferred:false,hasDetails:false};
}
function getText(product,specIndex){
 const r=get(product,specIndex);
 const value=(key)=>key==="ram"?r.fields[key]+" GB":key==="storage"?r.fields[key]+" GB":r.fields[key];
 const lines=[product?.name||"สินค้า","SKU: "+(product?.sku||"—"),
             "สถานะสเปก: "+r.status];
 for(const key of ordered){if(String(r.fields[key]??"").trim())lines.push(labels[key]+": "+value(key));}
 if(r.source)lines.push("อ้างอิง: "+r.source);
 if(r.fields.checked)lines.push("ตรวจเมื่อ: "+r.fields.checked);
 if(r.fields.notes)lines.push("หมายเหตุ: "+r.fields.notes);
 if(!r.official)lines.push("ต้องตรวจสอบรายละเอียดกับผู้ผลิตก่อนนำเสนอแก่ลูกค้า");
 return lines.join("\n");
}
function preview(product,specs,esc){
 const v=get(product,specs);
 if(!v.hasDetails)return '<span class="spec-mini">ยังไม่มีสเปก</span>';
 const parts=[];
 for(const key of ["ram","storage"]){if(v.fields[key])parts.push((key==="ram"?"RAM ":"ROM ")+esc(v.fields[key])+"GB");}
 if(!parts.length&&v.fields.chip)parts.push(esc(String(v.fields.chip)));
 if(!parts.length)return '<span class="spec-mini">มีข้อมูลสเปก</span>';
 return '<span class="spec-mini">'+parts.join(" · ")+(v.official?' · อ้างอิงผู้ผลิต':' · จากชื่อรุ่น*')+'</span>';
}
function render(product,specs,esc,fmt,sheetId){
 const x=get(product,specs),f=x.fields;
 const source=x.source;
 const q=encodeURIComponent((product.brand||"")+" "+(product.name||"")+" official specifications");
 const search="https://www.google.com/search?q="+q;
 const sheet=/^[A-Za-z0-9_-]{20,130}$/.test(String(sheetId||""))?
   "https://docs.google.com/spreadsheets/d/"+encodeURIComponent(sheetId)+"/edit#gid=501601":"";
 let h='<div class="card spec-info-card"><div class="row" style="justify-content:space-between"><button class="btn" data-page="stock">← กลับไปสินค้า</button><span class="small">SKU: '+esc(product.sku||"—")+'</span></div>';
 h+='<h2 style="margin:13px 0 7px;font-size:21px;line-height:1.35">'+esc(product.name)+'</h2>';
 h+='<div class="row" style="flex-wrap:wrap"><span class="small">'+esc(product.brand)+' · '+esc(product.category)+'</span><span class="small">ราคาในสต็อก '+fmt(product.price)+' ฿ · คงเหลือ '+fmt(product.qty)+'</span></div>';
 h+='<div class="spec-state"><b>สถานะข้อมูล</b><span>'+esc(x.status)+'</span></div>';
 if(x.inferred)h+='<div class="photo-note" style="margin:12px 0">RAM และความจุที่แสดงอ่านจากชื่อรุ่นในไฟล์สต็อก ยังไม่ใช่สเปกที่ตรวจยืนยัน และอาจมี RAM เสมือน</div>';
 if(!x.hasDetails)h+='<div class="empty">ยังไม่ได้บันทึกสเปกของ SKU นี้<br>สามารถค้นหาจากผู้ผลิตแล้วกรอกเพิ่มใน Google Sheets ได้</div>';
 else{
  h+='<div class="specs-grid">'+ordered.filter(k=>String(f[k]??"").trim()).map(key=>{
   const val=(key==="ram"||key==="storage")?String(f[key])+" GB":String(f[key]);
   return '<div class="specs-cell"><div class="small">'+labels[key]+'</div><b>'+esc(val)+'</b></div>';
  }).join("")+'</div>';
 }
 if(f.notes)h+='<div class="notice" style="margin-top:14px">'+esc(f.notes)+'</div>';
 if(source)h+='<div class="small" style="margin-top:12px">แหล่งอ้างอิง: <a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">เว็บไซต์ผู้ผลิต / เอกสารอ้างอิง</a>'+(f.checked?' · ตรวจ '+esc(f.checked):'')+'</div>';
 h+='<div class="quick-actions" style="margin-top:15px">';
 h+='<button class="btn dark" id="copySpecs" data-copy-sku="'+esc(product.sku||"")+'">คัดลอกสเปก</button>';
 if(sheet)h+='<a class="btn" href="'+esc(sheet)+'" target="_blank" rel="noopener noreferrer">✎ เติมสเปกในชีต</a>';
 h+='<a class="btn" href="'+search+'" target="_blank" rel="noopener noreferrer">ค้นหาสเปกจากผู้ผลิต</a>';
 h+='</div><div class="small" style="margin-top:12px">โปรดเทียบ SKU / รุ่นย่อย / ภูมิภาคก่อนใช้อธิบายหรือเสนอขาย สเปกอาจแตกต่างกันตามรุ่น</div></div>';
 return h;
}

function renderModal(product,index,esc,fmt,sheetId){
 const info=get(product,index),fields=info.fields;
 const verified=info.official && !!info.source;
 const pic=validUrl(fields.photo),photoSource=validUrl(fields.photoSource),specSource=validUrl(info.source);
 const q=encodeURIComponent(String(product.brand||"")+" "+String(product.name||"")+" product picture front back");
 const search="https://www.google.com/search?tbm=isch&q="+q;
 const gid=/^[A-Za-z0-9_-]{20,130}$/.test(String(sheetId||""))?
  "https://docs.google.com/spreadsheets/d/"+encodeURIComponent(sheetId)+"/edit#gid=501601":"";
 let html='<div class="spec-modal" role="dialog" aria-modal="true" aria-labelledby="specModalTitle" aria-describedby="specModalExplain">';
 html+='<div class="spec-modal-head"><div class="spec-heading"><span class="small">รายละเอียดสินค้า / '+esc(product.brand||"")+'</span><b id="specModalTitle">'+esc(product.name||"สินค้า")+'</b></div><button class="spec-close" type="button" id="closeSpecModal" aria-label="ปิดรายละเอียดสเปก">×</button></div>';
 html+='<div class="spec-modal-body">';
 html+='<div class="spec-visual">';
 if(pic){
  html+='<img id="specProductPhoto" src="'+esc(pic)+'" alt="รูปตัวอย่าง '+esc(product.name||"")+'" loading="eager" decoding="async">';
  html+='<div class="spec-img-fallback" id="specPhotoFallback" hidden><span>▣</span><b>ไม่สามารถโหลดภาพตัวเครื่อง</b><span>เปิดแหล่งภาพด้านล่างได้</span></div>';
 }else{
  html+='<div class="spec-img-fallback"><span>'+(String(product.category||"")==="Notebook"?'💻':'📱')+'</span><b>ยังไม่มีรูปยืนยันรุ่นนี้</b><span>เพิ่มลิงก์ Photo_URL ใน Specs_Entry หรือค้นหารูปจากผู้ผลิต</span></div>';
 }
 html+='<div class="spec-photo-foot">'+(pic?"รูปตัวอย่างสินค้า: สี/ความจุอาจต่างจาก SKU ที่เลือก":"จะไม่ใช้รูปของรุ่นอื่นแทน")+
 (photoSource?' · <a href="'+esc(photoSource)+'" target="_blank" rel="noopener noreferrer">แหล่งภาพ</a>':'')+'</div>';
 if(fields.photoNotes)html+='<div class="small">'+esc(fields.photoNotes)+'</div>';
 html+='</div>';
 html+='<div class="spec-meta"><span>SKU: '+esc(product.sku||"—")+'</span><span>ราคาในไฟล์ '+fmt(product.price)+' บาท</span><span>คงเหลือ '+fmt(product.qty)+' หน่วย</span></div>';
 html+='<div id="specModalExplain" class="spec-verified '+(verified?'yes':'no')+'"><b>'+(verified?'✓ มีแหล่งอ้างอิง':'⚠ ข้อมูลยังไม่ยืนยันครบ')+'</b><span>'+esc(info.status)+(fields.checked?' · ตรวจเมื่อ '+esc(fields.checked):'')+'</span></div>';
 if(info.inferred||(/จากชื่อรุ่น/i.test(info.status)))html+='<div class="spec-caution">RAM/ROM บางค่าอ่านจากชื่อสินค้า ยังไม่ได้ยืนยันจากเอกสารรุ่นย่อย และอาจมี RAM เสมือน</div>';
 if(info.hasDetails){
  html+='<div class="specs-grid spec-modal-grid">'+ordered.filter(k=>String(fields[k]??"").trim()).map(k=>{
   const val=(k==="ram"||k==="storage")?String(fields[k])+" GB":String(fields[k]);
   return '<div class="specs-cell"><span class="small">'+labels[k]+'</span><b>'+esc(val)+'</b></div>';
  }).join("")+'</div>';
 }else html+='<div class="spec-caution">ยังไม่มีรายละเอียดสเปกที่ตรวจสอบได้ ให้ตรวจรุ่นและรหัสบนกล่องก่อนเสนอขาย</div>';
 if(fields.notes)html+='<div class="spec-notes">'+esc(fields.notes)+'</div>';
 if(specSource)html+='<a class="spec-source" target="_blank" rel="noopener noreferrer" href="'+esc(specSource)+'">ตรวจสเปกที่เว็บไซต์อ้างอิง</a>';
 html+='<div class="spec-caution">โปรดตรวจ SKU / รุ่นย่อย / ความจุ / สีจริง และเทียบข้อมูลผู้ผลิตก่อนใช้อธิบายลูกค้า ภาพเป็นภาพตัวอย่าง ไม่ใช่รูปยืนยันของสินค้าชิ้นนั้น</div>';
 html+='</div><div class="spec-modal-foot"><button type="button" class="btn dark" id="copySpecs">คัดลอกสเปก</button>'+
 (gid?'<a class="btn" target="_blank" rel="noopener" href="'+esc(gid)+'">✎ แก้สเปก / ภาพ</a>':'')+
 '<a class="btn" href="'+search+'" target="_blank" rel="noopener noreferrer">ค้นหารูปเพิ่มเติม</a></div></div>';
 return html;
}
root.ForWorkSpecs={get,render,renderModal,preview,getText,fromName};
})(window);
