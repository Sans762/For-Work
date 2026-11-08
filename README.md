# For Work — PIA Desk (v0.4)

เว็บแอปส่วนตัวสำหรับช่วยงานขายและสรุป KPI ที่ใช้งานบนมือถือและคอม

## ฟีเจอร์
- Dashboard เป้ายอดขาย 70%, ยอดยังขาด, ยอดขายเฉลี่ยต่อวันที่ต้องทำ
- สินค้า: ค้นหาชื่อรุ่น/SKU, กรอง Smartphone / Notebook / Gadget, แบรนด์ และมีของ
- เครื่องคิดราคา: ส่วนลดมือถือ, ราคา Ultra Care+, ค่าล่วงหน้า, ค่ารายเดือน (ค่าบริการเดือน VAT โดยประมาณ 7%)
- Attach Rate: ตัวหาร / ตัวตั้ง / เป้าของแต่ละรายการ
- นำเข้า CSV จาก Google Sheets แบบ **local-only**, สำรอง/กู้คืนเป็น JSON
- จอเล็ก/ใหญ่ปรับตามอุปกรณ์, มี PWA manifest, offline app shell

## เปิดเว็บออนไลน์
1. เปิด [Pages Settings](https://github.com/Sans762/For-Work/settings/pages) ของรีโป (จำเป็นต้องกดด้วยบัญชีเจ้าของ)
2. ใต้ **Build and deployment**, เลือก **Source: Deploy from a branch**
3. เลือก Branch **main**, Folder **/(root)** และกด **Save**
4. รอ GitHub ยืนยันการเผยแพร่และเปิด URL ที่แสดงในหน้า Pages (โดยทั่วไปเป็น `https://sans762.github.io/For-Work/` แต่โปรดตรวจผลการเผยแพร่จริง)

เมื่อตั้งค่านี้แล้ว การแก้ไฟล์บนสาขา main จะทำให้ GitHub Pages สร้างเวอร์ชันใหม่ให้อัตโนมัติ

## ข้อมูลสินค้าและ Google Sheets
Google Sheets ส่วนตัวจากงานนี้: `Inventory` ถูกออกแบบให้ส่งออกเป็น CSV ได้ใน Google Sheets → เปิดแท็บ Inventory → File → Download → CSV. จากนั้นในเว็บ For Work → ตั้งค่า → เลือกไฟล์ CSV.

**ยังไม่ใช่การซิงก์ Google Sheets อัตโนมัติ**: เว็บสาธารณะไม่สามารถอ่าน Google Sheets ส่วนตัวอย่างปลอดภัยโดยไม่ต้องมี backend และระบบยืนยันตัวตน จึงใช้การนำเข้าไฟล์บนอุปกรณ์แทนใน v0.4

## ความปลอดภัย
- GitHub Repository นี้เป็นสาธารณะ; อย่าเพิ่มสต็อก/เอกสารภายใน ราคาเป็นความลับ รหัสผ่าน หรือ API key
- ไฟล์นำเข้าถูกประมวลผลในเบราว์เซอร์ ไม่มีการส่งไปเซิร์ฟเวอร์จากโค้ด v0.4
- localStorage เป็นพื้นที่จัดเก็บในเบราว์เซอร์ของแต่ละอุปกรณ์; ไม่ใช่ฐานข้อมูลเข้ารหัสหรือระบบสำรองอัตโนมัติ
- หากข้อมูลร้านมีข้อจำกัดด้านการใช้ภายนอก ต้องได้รับอนุญาตก่อนส่งออก Google Sheets หรือโหลดลงเครื่องส่วนตัว
- ราคาจริง โปรโมชัน/สิทธิ์ True และสต็อกต้องตรวจใน POS ร้านก่อนยืนยันลูกค้า
- For Work ไม่ใช่แอปทางการของ BaNANA หรือ COM7

## ไฟล์
`index.html` — เว็บแอปในไฟล์เดียว
`manifest.webmanifest` — การติดตั้งเป็นเว็บแอป
`sw.js` — การเก็บหน้าเว็บสาธารณะไว้เปิดออฟไลน์
`icon.svg` — ไอคอน

## นำเข้า Google Sheets ที่มีสต็อกเดิม (v0.5)

1. เปิดเว็บ For Work ผ่านลิงก์เฉพาะของคุณที่มี `?sheet=<SheetID>` หรือวางลิงก์ Google Sheets ครั้งเดียวที่แท็บ **นำเข้า** (ลิงก์เก็บในเบราว์เซอร์ ไม่ใส่ไว้ใน GitHub)
2. แตะ **ดาวน์โหลด Excel** ขณะล็อกอิน Google ที่มีสิทธิ์เข้าถึงชีต
3. แตะ **เลือกไฟล์จากเครื่อง** หรือ drag & drop ไฟล์ `.xlsx` ลงหน้าเว็บ
4. เว็บอ่านชีต `Inventory` (ไม่รวมซ้ำกับ Sheet1–Sheet4) และอ่าน `Sales_Targets`, `Attach_KPI` ถ้ามี
5. หลังแก้จำนวนใน Google Sheets ให้ดาวน์โหลด Excel ใหม่และอัปโหลดซ้ำ เพื่อ **แทนที่** สต็อก ไม่บวกสะสม

ข้อมูล 247 เครื่องของบริษัทไม่ได้ฝังในเว็บสาธารณะ และระบบนี้ยังไม่ได้อ่าน Google Sheets ส่วนตัวโดยอัตโนมัติ การอัปโหลดประมวลผลในเบราว์เซอร์เท่านั้น

## เชื่อม Google Sheets ส่วนตัว (v0.6)

### ทำได้แล้ว
- Google Sheets มี 3 แท็บใหม่: **Start_Here** (คู่มือ/เปิดใช้), **Stock_Input** (วางสต็อกดิบ 7 คอลัมน์), **Stock_View** (ผลลัพธ์สูตรสำหรับเว็บ)
- Stock_View ใช้ Inventory เดิม (143 รายการ/247 เครื่อง) จนกว่า `Start_Here!B5` ถูกติ๊กและ Stock_Input มีสินค้า แล้วสลับเป็นสต็อกที่วางเข้ามาใหม่
- For Work สามารถดึง `Stock_View`, `Sales_Targets` และ `Attach_KPI` จาก Google Sheets **ส่วนตัว** ได้ด้วย OAuth read-only โดยกดปุ่มเชื่อม Google แล้วกดซิงก์ และรีเฟรชทุก 5 นาทีขณะเซสชันใช้งานได้
- หลังนำเข้าไฟล์ Excel/CSV ในเว็บ สามารถเลือกวันที่แล้วกดอัปโหลดเข้า `Stock_Input` เพื่อแทนที่ข้อมูลเดิม (ต้องยืนยันสิทธิ์ OAuth write แยกต่างหาก) ก่อนนำเข้าจะปิดสวิตช์ใช้สต็อกใหม่ไว้ และเปิดใหม่เมื่อส่งสำเร็จ

### ตั้งค่า Google Cloud ครั้งแรก (ผู้ใช้เป็นเจ้าของบัญชี)
1. เปิด [Google Cloud Console](https://console.cloud.google.com/) เลือกหรือสร้าง Project ที่คุณควบคุม
2. เปิดใช้ [Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
3. ตั้งค่า Google Auth Platform (OAuth consent screen) และในช่วงทดสอบเพิ่มบัญชี Google ที่เป็นเจ้าของชีตเป็น Test user (ถ้าจำเป็น)
4. สร้าง OAuth Client ID ประเภท **Web application** โดย Authorized JavaScript origin เป็น **https://sans762.github.io** (ไม่ใส่ path `/For-Work/`)
5. เปิด [For Work](https://sans762.github.io/For-Work/) → นำเข้า → วางลิงก์/ID ของ Google Sheets และ OAuth Client ID → บันทึก → เชื่อม Google → ดึงจากชีต

Client ID (public metadata) อยู่ใน localStorage ของอุปกรณ์นั้น; access token อยู่ในหน่วยความจำขณะเว็บเปิดเท่านั้น ไม่มี Google password หรือ token เก็บลง GitHub หรือส่งไป server เจ้าของ repo

**ข้อจำกัด:** เวอร์ชันเว็บไม่มีทางอ่าน Google Sheets แบบ private โดยไม่ตั้งค่า OAuth / ล็อกอิน Google ที่ได้รับสิทธิ์ก่อน เซสชัน OAuth มีอายุจำกัดและอาจต้องกดเชื่อมใหม่ การทดสอบบนเว็บจริงต้องใช้ Client ID ของเจ้าของบัญชี จึงยังตรวจ E2E OAuth แบบจริงไม่ได้จากแชตนี้

**ระวังข้อมูล:** ไฟล์ที่มีข้อมูลสต็อกภายในบริษัทจะถูกส่งไปบัญชี Google Drive ส่วนตัวได้เฉพาะเมื่อบริษัทอนุญาต ห้ามเปลี่ยนแชร์ชีตเป็น Anyone หรือ Publish to web
