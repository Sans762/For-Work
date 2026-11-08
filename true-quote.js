/* True mobile pricing for For Work. Public fallbacks are MNP plans listed at True Store.
 * Private discounts from user's True_Promotions Sheet are NOT bundled publicly.
 * All prices are indicative until eligibility/stock/POS are confirmed.
 */
(function(root){
"use strict";
const REF="https://store.true.th/sims/mnp-postpaid/5gsupervalue";
const prices=[[399,"20 GB",100],[499,"40 GB",150],[599,"50 GB",200],[699,"60 GB",250],
[899,"80 GB",300],[999,"90 GB",400],[1199,"เน็ตไม่จำกัด",600],
[1499,"เน็ตไม่จำกัด",1000],[1699,"เน็ตไม่จำกัด",1200],
[1999,"เน็ตไม่จำกัด",1600],[2199,"เน็ตไม่จำกัด",1900]];
const publicPackages=prices.map(([p,data,voice])=>({
 id:"MNP-SV-"+p,name:"5G Super Value "+p,customerType:"MNP / ย้ายค่าย",
 monthly:p,data,voice,wifi:"TrueWiFi ไม่จำกัด",
 duration:"ตรวจเงื่อนไขก่อนสมัคร",source:REF,
 notes:"เฉพาะแพ็กเกจย้ายค่ายที่แสดงใน True Store; ไม่มีส่วนลดเครื่องอัตโนมัติ",
 discount:0,upfront:0
}));
function normalizePackages(rows){
 const map=new Map();
 for(const p of (Array.isArray(rows)&&rows.length?rows:publicPackages)){
  if(!p||!p.id||!Number.isFinite(Number(p.monthly))||Number(p.monthly)<=0)continue;
  map.set(String(p.id),{...p,id:String(p.id),monthly:Number(p.monthly),discount:0,upfront:0});
 }
 return [...map.values()].sort((a,b)=>a.monthly-b.monthly);
}
function eligiblePromos(product,rows){
 if(!product||!Array.isArray(rows))return [];
 return rows.filter(x=>x&&x.id&&String(x.category)===String(product.category)&&Number(x.minPrice||0)<=Number(product.price||0)&&Number(x.discount||0)<=Number(product.price||0)&&Number(x.discount||0)>=0&&Number(x.monthly||0)>0);
}
function options(product,promos,packages){
 return [
  ...normalizePackages(packages).map(x=>({...x,key:"package:"+x.id,kind:"package",label:x.name+" • "+x.data+" • "+x.monthly+" บาท/เดือน"})),
  ...eligiblePromos(product,promos).map(x=>({...x,key:"promo:"+x.id,kind:"promo",label:x.customerType+" • "+x.monthly+" บ./เดือน • ลดเครื่อง "+x.discount+" บ. (ตรวจสิทธิ์)"}))
 ];
}
const baht=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
function calculate(q){
 const device=Number(q.devicePrice),discount=Number(q.discount||0),care=Number(q.care||0),upfront=Number(q.upfront||0),monthly=Number(q.monthly||0);
 const errors=[];
 for(const [k,n] of [["ราคาเครื่อง",device],["ส่วนลด",discount],["ประกัน",care],["ล่วงหน้า",upfront],["แพ็กเกจ",monthly]]){
  if(!Number.isFinite(n)||n<0)errors.push(k+" ต้องเป็นตัวเลขตั้งแต่ 0");
 }
 if(Number.isFinite(device)&&device>0&&discount>device)errors.push("ส่วนลดสูงกว่าราคาเครื่อง");
 if(q.minimumPrice!=null&&Number.isFinite(device)&&device<Number(q.minimumPrice))errors.push("ราคาเครื่องไม่ถึงเกณฑ์โปร");
 if(q.requiredCategory&&q.category!==q.requiredCategory)errors.push("โปรนี้ไม่รองรับประเภทสินค้าปัจจุบัน");
 if(!Number.isFinite(device)||device<=0)errors.push("ยังไม่มีราคาเครื่องที่ถูกต้อง");
 if(errors.length)return {valid:false,errors,devicePrice:device,discount,care,upfront,monthly};
 const discounted=baht(device-discount);
 return {valid:true,errors:[],devicePrice:baht(device),discount:baht(discount),discounted,
  care:baht(care),upfront:baht(upfront),monthly:baht(monthly),
  monthlyWithVat:baht(monthly*1.07),dueNow:baht(discounted+care+upfront)};
}
root.ForWorkTrue={publicPackages,normalizePackages,eligiblePromos,options,calculate};
})(window);
