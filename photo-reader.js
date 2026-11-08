/* For Work Photo PIA Reader v1 — all image recognition happens in the browser.
   The photo is never uploaded; browser fetches the OCR engine and language model.
   Numeric values must always be reviewed by the user before saving.
*/
(function(root){
"use strict";
const CATEGORIES=[
{key:"Mac",match:/^mac$/i},{key:"iPad",match:/^ipad$/i},{key:"iPhone",match:/^iphone$/i},
{key:"BTB(Apple)",match:/^btb.?apple/i},{key:"BTB",match:/^btb$/i},
{key:"Desktop",match:/^desktop$/i},{key:"DIY",match:/^diy$/i},
{key:"NB",match:/^n[8b]$/i},{key:"Smartphone",match:/^smart.?phone$/i},
{key:"Tablet",match:/^tab[l1]et$/i},{key:"Apple Watch",match:/^apple.?watch$/i},
{key:"Sim",match:/^sim$/i},{key:"Total",match:/^tot[ae]l$/i}
];
const COLUMNS=[
["target",.162],["sales",.260],["lastMonth",.345],["lastYear",.425],["forecast",.497],
["achieve",.564],["forecastPct",.633],["mom",.704],["yoy",.775],["targetDay",.854],["commission",.938]
];
const FIELDS=COLUMNS.map(c=>c[0]);
const numericFields=FIELDS.filter(x=>!["achieve","forecastPct","mom","yoy"].includes(x));
const isPct=x=>["achieve","forecastPct","mom","yoy"].includes(x);
const clean=x=>String(x??"").replace(/[\u200b\u00a0]/g,"").trim();
function extractNumber(text,percent){
 const t=clean(text).replace(/[฿]/g,"").replace(/[Oo]/g,"0");
 if(!t||/^(?:-+|—|–|_)$/.test(t))return null;
 const m=t.match(/-?\d[\d,]*(?:\.\d+)?/);
 if(!m)return null;
 const n=Number(m[0].replace(/,/g,""));
 if(!Number.isFinite(n)||n<0)return null;
 if(percent && n>1000)return null;
 return n;
}
function normalizeCategory(source){
 const s=clean(source).toLowerCase().replace(/[(){}\[\]\s_.-]/g,"");
 if(!s)return null;
 for(const c of CATEGORIES)if(c.match.test(s))return c.key;
 if(/^smartphone/.test(s))return "Smartphone";
 if(/^btbapple/.test(s))return "BTB(Apple)";
 if(/^applewatch/.test(s))return "Apple Watch";
 return null;
}
function blankRow(name){const r={category:name};for(const f of FIELDS)r[f]=null;return r}
function parseText(text){
 const rows={};const lines=String(text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 for(const line of lines){
  const m=line.match(/^(BTB\s*\(?Apple\)?|Apple\s*Watch|Smartphone|Desktop|Tablet|iPhone|iPad|Mac|DIY|NB|Sim|Total|BTB)\b\s*(.*)$/i);
  if(!m)continue;
  const category=normalizeCategory(m[1]);if(!category)continue;
  const result=blankRow(category);
  const nums=(m[2].match(/-?\d[\d,]*(?:\.\d+)?%?/g)||[]);
  if(nums.length>=7){
   /* Last-resort plain-text fallback: do not guess missing columns. */
   if(nums.length===11){
    FIELDS.forEach((key,i)=>{result[key]=extractNumber(nums[i],isPct(key))});
   }else if(category==="Total"){
    result.target=extractNumber(nums[0],false);
    result.sales=extractNumber(nums[1],false);
    const ach=nums.find(x=>x.includes("%"));
    result.achieve=ach?extractNumber(ach,true):null;
   }
  }
  rows[category]=result;
 }
 return CATEGORIES.map(c=>rows[c.key]).filter(Boolean);
}
function parseWords(words,width,height,rawText){
 const valid=(Array.isArray(words)?words:[]).filter(w=>w&&w.bbox&&clean(w.text)&&Number(w.confidence??60)>8).map(w=>({
  text:clean(w.text),
  x:(Number(w.bbox.x0)+Number(w.bbox.x1))/2,
  y:(Number(w.bbox.y0)+Number(w.bbox.y1))/2,
  x0:Number(w.bbox.x0),x1:Number(w.bbox.x1),
  conf:Number(w.confidence??50)
 })).filter(w=>Number.isFinite(w.x)&&Number.isFinite(w.y));
 if(valid.length<14)return parseText(rawText);
 valid.sort((a,b)=>a.y-b.y||a.x-b.x);
 const lineGroups=[],tolerance=Math.max(9,height*.017);
 for(const w of valid){
  let line=lineGroups.find(g=>Math.abs(g.y-w.y)<tolerance);
  if(!line){line={y:w.y,words:[]};lineGroups.push(line)}
  line.words.push(w);line.y=line.words.reduce((sum,x)=>sum+x.y,0)/line.words.length;
 }
 lineGroups.sort((a,b)=>a.y-b.y);
 // The uploaded example contains a store table above a PIA table. Always choose
 // the LAST "Category / Target / Sale" header to isolate the PIA section.
 const headers=lineGroups.filter(g=>g.words.some(w=>/^categor[yv]$/i.test(w.text))&&g.words.some(w=>/targ[e]?t/i.test(w.text)));
 const headerY=headers.length?headers[headers.length-1].y:0;
 const candidates=[];
 for(const g of lineGroups){
  if(g.y<=headerY+tolerance*.75)continue;
  const words=g.words.sort((a,b)=>a.x-b.x);
  const left=words.filter(w=>w.x0<width*.163);
  let name=null;
  for(let i=0;i<Math.min(4,left.length);i++){
   const piece=left.slice(0,i+1).map(w=>w.text).join("");
   name=normalizeCategory(piece);if(name)break;
  }
  if(!name)continue;
  const row=blankRow(name),cells={};
  for(const [f] of COLUMNS)cells[f]=[];
  for(const w of words){
   if(w.x<width*.10)continue;
   let nearest=null,best=Infinity;
   for(const [key,center] of COLUMNS){
    const dist=Math.abs((w.x/width)-center);
    if(dist<best){best=dist;nearest=key}
   }
   if(best<.074)cells[nearest].push(w);
  }
  for(const field of FIELDS){
   const chunks=cells[field].sort((a,b)=>a.x-b.x).map(w=>w.text);
   row[field]=extractNumber(chunks.join(""),isPct(field));
  }
  row._y=g.y;row._confidence=Math.round(words.reduce((s,w)=>s+w.conf,0)/Math.max(1,words.length));
  candidates.push(row);
 }
 // If there are duplicate "Total" or "NB" rows, the lower one is the PIA section.
 const unique=new Map();for(const row of candidates)unique.set(row.category,row);
 const result=CATEGORIES.map(c=>unique.get(c.key)).filter(Boolean);
 if(!result.length)return parseText(rawText);
 return result;
}
function validate(rows){
 const warnings=[],t=(rows||[]).find(r=>r.category==="Total");
 if(!t){warnings.push("ไม่พบแถว Total ของ PIA — ให้กรอกยอดรวมเองก่อนบันทึก");return warnings}
 if(t.target==null||t.sales==null)warnings.push("ช่อง Target หรือ Sale ไม่ชัด ต้องตรวจและกรอกเอง");
 if(t.target>0&&t.sales!=null&&t.achieve!=null){
  const diff=Math.abs(t.sales/t.target*100-t.achieve);
  if(diff>1.25)warnings.push("เปอร์เซ็นต์ Achieve ไม่ตรงกับ Target/Sale: กรุณาตรวจค่าที่อ่านได้");
 }
 if(t.target>0&&t.forecast!=null&&t.forecastPct!=null){
  const diff=Math.abs(t.forecast/t.target*100-t.forecastPct);
  if(diff>2.5)warnings.push("เปอร์เซ็นต์ Forecast ไม่ตรงกับยอด Forecast");
 }
 return warnings;
}
async function loadEngine(){
 if(root.Tesseract&&root.Tesseract.createWorker)return root.Tesseract;
 return new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
  script.crossOrigin="anonymous";script.async=true;
  script.onload=()=>root.Tesseract&&root.Tesseract.createWorker?resolve(root.Tesseract):reject(Error("โหลด OCR engine ไม่สำเร็จ"));
  script.onerror=()=>reject(Error("โหลด OCR ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ต"));
  document.head.appendChild(script);
 });
}
function imageFromFile(file){
 return new Promise((resolve,reject)=>{
  const u=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{URL.revokeObjectURL(u);resolve(image)};
  image.onerror=()=>{URL.revokeObjectURL(u);reject(Error("อ่านไฟล์รูปภาพไม่ได้"))};
  image.src=u;
 });
}
function enhance(image, options={}){
 const ratio=Math.min(2,3000/image.naturalWidth,3000/image.naturalHeight);
 const w=Math.max(1,Math.round(image.naturalWidth*ratio)),h=Math.max(1,Math.round(image.naturalHeight*ratio));
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext("2d",{willReadFrequently:true});
 if(!ctx)throw Error("Canvas ไม่พร้อมใช้งาน");
 ctx.drawImage(image,0,0,w,h);
 if(options.contrast!==false){
  const img=ctx.getImageData(0,0,w,h),p=img.data;
  for(let i=0;i<p.length;i+=4){
   const lum=(p[i]*.299+p[i+1]*.587+p[i+2]*.114);
   const v=Math.max(0,Math.min(255,(lum-128)*1.52+138));
   p[i]=p[i+1]=p[i+2]=v;
  }
  ctx.putImageData(img,0,0);
 }
 return canvas;
}
async function scanFile(file,onProgress){
 if(!file||!/^image\//.test(file.type))throw Error("กรุณาเลือกไฟล์ภาพ JPEG/PNG");
 if(file.size>16*1024*1024)throw Error("ภาพต้องไม่เกิน 16 MB");
 const t=await loadEngine();
 const img=await imageFromFile(file),canvas=enhance(img);
 let worker;
 try{
  worker=await t.createWorker("eng",1,{logger:m=>{if(typeof onProgress==="function"&&m.status)onProgress(m.status,Number(m.progress||0))}});
  const response=await worker.recognize(canvas);
  const d=response.data||{};
  const rows=parseWords(d.words,canvas.width,canvas.height,d.text||"");
  return {rows,warnings:validate(rows),recognizedText:d.text||"",confidence:d.confidence||0,width:canvas.width,height:canvas.height};
 }finally{if(worker)await worker.terminate()}
}
root.ForWorkPhoto={CATEGORIES:CATEGORIES.map(x=>x.key),FIELDS,blankRow,parseText,parseWords,validate,scanFile};
})(window);
