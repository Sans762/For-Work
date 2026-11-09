/* Private sales campaigns from True_Apple_Prebook sheet only: no offer data embedded here. */
(function(root){
"use strict";
const MODELS=["iPad mini","iPad8"];
function dateKey(d){
 const x=d||new Date();
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Bangkok",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(x);
 const find=t=>parts.find(p=>p.type===t)?.value||"";
 return [find("year"),find("month"),find("day")].join("-");
}
function byModel(all,model){
 return (Array.isArray(all)?all:[]).filter(x=>x&&x.model===model&&x.id&&Number(x.discount)>0);
}
function status(offer,today){
 const d=today||dateKey();
 if(!offer?.startDate||!offer?.endDate)return "unknown";
 if(d<offer.startDate)return "upcoming";
 if(d>offer.endDate)return "expired";
 return "in_window";
}
function calc(price,offer,advanceOverride,care,today){
 const amount=String(price??"").trim()?Number(price):NaN;
 const extra=String(care??"").trim()?Number(care):0;
 const errors=[];
 if(!offer)errors.push("กรุณาเลือกเงื่อนไขโปรจากชีต");
 if(!Number.isFinite(amount)||amount<=0)errors.push("กรุณาใส่ราคาเครื่องจริง");
 if(!Number.isFinite(extra)||extra<0)errors.push("ค่าบริการอื่นต้องเป็น 0 หรือมากกว่า");
 const discount=Number(offer?.discount||0),threshold=offer?.minPrice;
 if(offer&&Number.isFinite(amount)&&amount<discount)errors.push("ราคาเครื่องต่ำกว่าส่วนลดในโปร");
 if(offer&&threshold!=null&&threshold!==""&&Number.isFinite(amount)&&amount<Number(threshold))errors.push("ราคาเครื่องต่ำกว่า RRP ขั้นต่ำในภาพ");
 const windowStatus=status(offer,today);
 if(windowStatus==="expired")errors.push("เลยช่วงพรีบุ๊กในภาพแล้ว ต้องยืนยันโปรใหม่");
 if(windowStatus==="upcoming")errors.push("ยังไม่ถึงช่วงพรีบุ๊กในภาพ");
 let advance=offer?.advance==null||offer.advance===""?null:Number(offer.advance);
 const manual=advanceOverride==null||String(advanceOverride).trim()===""?null:Number(advanceOverride);
 if(advance===null&&manual!==null)advance=manual;
 if(advance!==null&&(!Number.isFinite(advance)||advance<0))errors.push("ค่าล่วงหน้าต้องเป็นตัวเลขไม่ติดลบ");
 if(manual!==null&&(!Number.isFinite(manual)||manual<0))errors.push("ค่าล่วงหน้าที่กรอกต้องเป็น 0 หรือมากกว่า");
 if(errors.length)return {valid:false,errors,discount,advance,deviceNet:null,dueNow:null,windowStatus};
 const deviceNet=Math.round((amount-discount)*100)/100;
 return {valid:true,errors:[],price:amount,discount,deviceNet,
 advance,missingAdvance:advance===null,other:extra,
 dueNow:advance===null?null:Math.round((deviceNet+advance+extra)*100)/100,
 rcLabel:String(offer.rcLabel||""),contract:Number(offer.contract||0),windowStatus};
}
function label(offer){
 const rrp=offer.minPrice==null?"RRP ไม่ระบุ":"RRP ≥"+Number(offer.minPrice).toLocaleString("th-TH");
 const adv=offer.advance==null?"ล่วงหน้าไม่ระบุ":"ล่วงหน้า "+Number(offer.advance).toLocaleString("th-TH");
 return [offer.campaign,rrp,"ลด "+Number(offer.discount).toLocaleString("th-TH"),adv,"RC "+offer.rcLabel].filter(Boolean).join(" · ");
}
root.ForWorkApplePrebook={MODELS,dateKey,byModel,status,calc,label};
})(window);
