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

## For Work v0.7 — Google setup guide & self-check

- เข้า `https://sans762.github.io/For-Work/` → **นำเข้า** → ทำตามคู่มือ 4 ขั้นตอนในหน้าแอป
- ต้องใช้ Google OAuth Client ID (Web application) ของโปรเจกต์ Google Cloud ของเจ้าของบัญชีเอง; **Authorized JavaScript origin** คือ `https://sans762.github.io` โดยไม่มี path
- เปิด Google Sheets API; ตั้งค่า Auth Platform → Branding และ Audience, เพิ่มบัญชีตัวเองใน Test users หากใช้โหมด Testing; สร้าง Client ID แล้วใส่หน้าแอป
- ปุ่ม **ตรวจระบบ** ตรวจว่ามี HTTPS, Sheet ID, Client ID, Google Identity library, และสิทธิ์ Google หรือยัง
- ปุ่ม **ซิงก์** ที่ยังไม่ได้ล็อกอินจะนำไปหน้าตั้งค่าหรือเปิดคำขอสิทธิ์ เมื่อพร้อมจะอ่าน `Stock_View` และข้อมูล KPI จากชีตส่วนตัวโดยตรง
- ตัวเว็บไซต์และข้อมูลธุรกิจแยกกัน: โค้ด public บน GitHub Pages แต่ข้อมูลสต็อกยังเป็น private บน Google Sheets และ localStorage ของอุปกรณ์ที่ใช้งาน

Google Sheets `PIA_Home`, `PIA_Search`, `PIA_Calculator`, และ `Start_Here` ใช้สต็อก `Stock_View` ที่เปลี่ยนได้จาก `Stock_Input`; สูตรใน `Start_Here!B10:B13` คำนวณยอดรวม/ข้อมูลผิดปกติใหม่แล้ว

**ทดสอบแล้ว:** โค้ด JS syntax, จำลองขั้นตอนกดซิงก์→ล็อกอิน→อ่านชีต, ค่าจาก Google Sheets จริง 143 รายการ/247 เครื่อง, GitHub Pages deploy. **ยังไม่ได้ทดสอบ OAuth กับบัญชีจริง** จนกว่าจะได้ OAuth Client ID ที่เจ้าของบัญชีสร้างและอนุญาตเอง

## For Work v0.8 — กรองสินค้าและกรอกสต็อกง่ายขึ้น

- หน้า **สินค้า** กรองหมวด/แบรนด์/สถานะ มีสินค้า/ใกล้หมด 1–3/หมด และช่วงราคาขั้นต่ำ-สูงสุด
- มีช่วงราคาสำเร็จรูป: ไม่เกิน 5,000; 5,001–10,000; 10,001–20,000; 20,001–30,000; 30,001 ขึ้นไป
- **เรียงราคาน้อยไปมากเป็นค่าเริ่มต้น** และเลือกมากไปน้อย/ชื่อ/จำนวน/แบรนด์ได้ พร้อมปุ่มล้างตัวกรอง
- รองรับแสดงสินค้าเป็นชุดละ 100 รายการและกดดูเพิ่มเติม
- Google Sheets `Stock_Input` กรอกเพียง 3 ช่องหลัก: `A ชื่อสินค้า`, `B จำนวน`, `C ราคา`; ช่อง `D แบรนด์`, `E หมวด` เป็นตัวเลือก; `F SKU`, `G วันที่` เป็นตัวเลือกเสริม
- เมื่อกรอก `Stock_Input` ครบ ให้เปิด `Start_Here!B5` เพื่อใช้สต็อกชุดใหม่ `Stock_View` จะใช้สูตรจำแนกแบรนด์/หมวดจากชื่อเมื่อไม่กรอก และเว็บอ่านผ่าน Google OAuth ได้
- อัปโหลดสต็อกจากหน้าเว็บไป Google Sheets ใช้ลำดับคอลัมน์ใหม่: ชื่อ/จำนวน/ราคา/แบรนด์/หมวด/SKU/วันที่
- นำเข้าไฟล์ Excel จาก Google Sheets เลือก `Stock_View` ก่อน `Inventory` และรองรับหัวคอลัมน์ภาษาไทยที่มีเครื่องหมาย * หรือวงเล็บ
- ข้อมูลร้านไม่อยู่ในไฟล์ public GitHub (การอ่าน/เขียนชีตส่วนตัวต้องผ่าน OAuth ของเจ้าของบัญชี); สต็อกเดิม 143 รายการ 247 เครื่องยังถูกเก็บไว้จนกว่าเปิดใช้ชุดใหม่


## For Work v0.9 — Stock update (2026-11-08)

- Imported 1,374 SKU rows / 4,284 stock units from private uploaded inventory.
- Original 28-column exports preserved in Raw_Upload_20261108 and Raw_View_Upload_20261108 on Google Sheets. No company inventory was committed to public GitHub.
- Simplified Stock_Input contains name, quantity, selling price, brand, category, SKU, optional date; Stock_View feeds the web app after Start_Here!B5 is enabled.
- Demo sentinel source prices -100 or 1000000 are not customer selling prices. Demo entries now use zero selling price in cleaned data, original values remain in archive.
- Google Sheets Dashboard totals account for all categories rather than the old four-brand subset.
- Web app v0.9 prevents quotes on Demo, service, store supplies or items without positive price; mixed stock uses generic units.
- Actual POS snapshot date was not supplied; fill Start_Here!B6 when confirmed.
- Private Google Sheets needs owner-authorized Google OAuth. 403 access_denied cannot be bypassed by public web code.

## v1.1 — แบรนด์แยกอุปกรณ์และแก้สต็อกเร็ว (8 พฤศจิกายน 2569)

- Home และ Products แสดงประเภทอุปกรณ์จากข้อมูลส่วนตัวที่มีอยู่จริง พร้อมจำนวน SKU และจำนวนคงเหลือรวม; เลือกหมวดหรือแบรนด์เพื่อกรองทันที
- อ่าน 13 หมวดอุปกรณ์ และ 78 แบรนด์จาก Google Sheets `Stock_View`, 1,374 รายการ 4,284 หน่วย ขณะตรวจสอบ
- แบ่งอุปกรณ์: Smartphone, Notebook, Tablet, Smartwatch, Accessory, Gadget, Network, Gaming, Printer, SIM, Service, Demo, Other, Store Supplies
- ปุ่มใน Home/Stock/Import เปิดตรงไป `Stock_Find` (ค้นหาชื่อ/แบรนด์/SKU), `Stock_Quick_Update` (กรอก SKU + จำนวนล่าสุด), `Stock_Input` (เพิ่มสินค้าใหม่), `Stock_By_Brand` (สรุปแบรนด์ × ประเภท)
- `Stock_Quick_Update`: ชื่อสินค้า/จำนวนเดิม/สถานะคำนวณอัตโนมัติ; `Stock_View` แทนที่เฉพาะ Quantity โดย SKU ที่มีสถานะ พร้อมใช้; quantity 0 รองรับของหมด
- เมื่ออัปโหลด snapshot ใหม่จาก For Work ผ่าน authorized Google API จะเคลียร์การ override เก่าใน `Stock_Quick_Update!A6:B1500` เพื่อป้องกันจำนวนค้างจากสต็อกเก่า
- คงข้อมูลบริษัทไว้ใน Google Sheets ส่วนตัว; เว็บสาธารณะไม่มี SKU/สต็อกฝังในโค้ด ต้องเชื่อม Google OAuth หรือใช้ Excel import ตามที่บริษัทอนุญาต
- เพิ่มแท็บ `ถ่ายยอด` สำหรับภาพตาราง PIA: ถ่าย/เลือก JPEG/PNG → OCR ในเบราว์เซอร์ → ตรวจค่าที่อ่านได้ → บันทึก Dashboard หรือส่งแถวตรวจแล้วไป `PIA_Photo_Log` ใน Sheets หลังอนุญาตเขียน ไม่อัปโหลดภาพขึ้น server
- โหมดอ่านภาพอาจอ่าน OCR ผิดจากการถ่ายจอ จึงต้องตรวจ Target/Sale และค่าทั้งหมดก่อนยืนยัน; UI/OAuth end-to-end บนอุปกรณ์จริงยังไม่ได้ทดสอบกับบัญชีเจ้าของ

## For Work v1.2 — สเปกเครื่องแยก SKU
- สร้างตาราง `Specs_Entry` (Google Sheets ส่วนตัว) ที่เก็บ SKU คงที่ 453 รุ่นย่อยในหมวดอุปกรณ์หลัก โดยไม่แก้ไข `Stock_Input` หรือจำนวนคงเหลือ
- ข้อมูลสเปกแบ่ง 3 สถานะ: **ยืนยันจากผู้ผลิต** (มี URL), **จากชื่อรุ่น (ยังไม่ยืนยัน)** และ **รอข้อมูล**; ต้องตรวจสเปก/รุ่นย่อย/ภูมิภาคก่อนใช้ขายจริง
- เริ่มต้นค้นสเปกผู้ผลิตอย่างเป็นทางการสำหรับ 11 SKU ของ 3 รุ่น (Infinix SMART20, TECNO SPARK GO3, Redmi A7); สเปกส่วนอื่นยังไม่ยืนยัน
- RAM / ความจุสำหรับสินค้าอีก 284 SKU ถูกแยกจากข้อความชื่อสินค้าเท่านั้น (อาจมี RAM ขยายเสมือน) ไม่ถือเป็นข้อมูลตรวจสอบจากผู้ผลิต
- ใน For Work → สินค้า → **ดูสเปก**: แสดง CPU, หน้าจอ, RAM, ความจุ, กล้อง, แบตเตอรี่, ชาร์จ, OS, การเชื่อมต่อ และลิงก์แหล่งอ้างอิงเมื่อมี
- การเชื่อม Google OAuth อ่าน `Specs_Entry!A1:S1200` ร่วมกับสต็อก และจับคู่ด้วย SKU; ดาวน์โหลด Excel แล้วนำเข้าด้วย `xlsx-reader.js` ก็อ่านสเปกได้โดยไม่ต้อง OAuth (ไฟล์ต้องมีแท็บ Specs_Entry)
- เพิ่มลิงก์ Specs_Entry ใน Home/สินค้า/นำเข้า; แก้สเปกที่คอลัมน์ E:O แล้วกรอก Source_URL, Checked_Date, Spec_Status (อย่ากรอกค่าที่ไม่ยืนยัน)
- ข้อมูลบริษัทคงอยู่ใน private Google Sheets; เว็บ GitHub มีเพียงโค้ดและข้อมูลสเปกที่ใช้แสดงหลังอ่านจากชีต

## v1.3 — แยกมือถือ/โน้ตบุ๊กเป็นแท็บแบรนด์จริง พร้อมฐานข้อมูลสเปกที่ตรวจสอบได้

Google Sheets ส่วนตัวมีหน้า `Brand_Hub` และแท็บสูตรแยกแต่ละแบรนด์ 17 แท็บ:
- มือถือ 12 แบรนด์: Samsung, Xiaomi, OPPO, TECNO, HONOR, ZTE, vivo, Apple, Infinix, iQOO, realme, Nothing
- โน้ตบุ๊ก 5 แบรนด์: HP, ASUS, Acer, Lenovo, Apple
- ทุกแท็บมี SKU, รุ่น, จำนวน, ราคา, RAM, ความจุ, CPU/ชิป, จอ, แบตเตอรี่, แหล่งอ้างอิง, สถานะสเปก โดยดึงแบบสดจาก `Stock_View` + `Specs_Entry` ไม่ต้องคัดลอกสินค้าไปเพิ่มซ้ำ
- `Brand_Hub` แสดงจำนวนสินค้า/หน่วยและสเปกที่ตรวจแล้ว/รอตรวจ พร้อมลิงก์ตรงเข้าแต่ละแท็บ และสูตรอัปเดตตามสต็อก
- For Work เพิ่มหน้า **แบรนด์** แยกมือถือและโน้ตบุ๊ก กดแบรนด์แล้วกรองหน้าสินค้าอัตโนมัติ พร้อมปุ่มดูสเปกของแต่ละ SKU; หากยังไม่ได้เชื่อม OAuth จะเห็นรายชื่อแบรนด์ แต่ไม่แสดงยอดสต็อกจริงจนกว่าจะซิงก์
- สำรวจเพิ่มเติมจากแหล่งผู้ผลิตและผู้จำหน่ายที่มีชื่อรุ่นตรง: OPPO A6c, OPPO A6x 5G, vivo Y05, HONOR X5c Plus, Xiaomi Redmi 17 (4G/5G แยกกัน), Xiaomi Redmi Note 17 (4G/5G แยกกัน), OPPO Reno16 5G, Apple iPhone 17, MacBook Neo, Acer Aspire Lite AL14-48P-R2D1, HP OmniBook 3 14-hy0049AU, HP 14-ep1038TU, ASUS M1404FA-EB554WA
- สเปกที่มาจากผู้จำหน่ายระบุสถานะ `ตรวจจากเอกสารผู้จำหน่าย` ไม่แสดงเป็น `ยืนยันจากผู้ผลิต`. HP 14-ep1038TU มีข้อมูลความจุ SSD ขัดกัน จึงเว้นช่องไว้ให้ตรวจจาก SKU/หน้ากล่อง
- ไม่แตะยอดคงเหลือ `Stock_Input`, `Stock_Quick_Update` หรือสต็อกดิบ ไม่ใช้ข้อมูลสินค้าใน GitHub public

ข้อจำกัด: การตรวจสเปกทุก SKU 317 รายการยังไม่เสร็จสมบูรณ์ แสดงสถานะ `รอข้อมูล` หรือ `จากชื่อรุ่น (ยังไม่ยืนยัน)` ตามจริง และรองรับการแก้ไขทุก SKU จากชีตได้ตลอด


## v1.4 — เพิ่มแบรนด์และเพิ่มรุ่นผ่านปุ่มในแอป

- เมนู **แบรนด์** มีปุ่ม **＋ เพิ่มแบรนด์** และ **＋ เพิ่มรุ่นสินค้า**; ทุกการ์ดแบรนด์มีปุ่มเพิ่มรุ่นแบบกรอกแบรนด์ให้
- รายชื่อแบรนด์แสดงจากสต็อก + แบรนด์ตั้งต้น 17 กลุ่ม + แบรนด์ที่เพิ่มเอง ไม่ล็อกไว้แค่ 12 มือถือ/5 โน้ตบุ๊ก
- สามารถบันทึกแบรนด์ในเครื่องได้แม้ Google OAuth ใช้ไม่ได้; จะแสดงสถานะ **เฉพาะในเครื่อง** จนกว่าจะบันทึกลง Google Sheets สำเร็จ
- เพิ่มแท็บ Google Sheets **Brand_Custom**: Category, Brand, AddedOn, Note; `Brand_Hub!A27:D` มีสูตรแสดงแบรนด์เพิ่มใหม่
- เมื่อลงชื่อเข้า Google พร้อมสิทธิ์เขียน แอปสามารถ append แบรนด์ลง Brand_Custom และ append สินค้าหนึ่งรายการลง Stock_Input ได้อย่างปลอดภัย; หลีกเลี่ยง SKU ซ้ำและจำกัดจำนวน/ราคา
- ถ้า OAuth 403 ยังแก้ไม่ได้ ให้เพิ่มแบรนด์/สินค้าใน Brand_Custom / Stock_Input โดยตรงผ่านทางลัดในหน้าแบรนด์
- เพิ่มสินค้าใน Stock_Input แล้ว Stock_View ดึงข้อมูลอัตโนมัติภายในช่วงสูตร 1,499 รายการ การบันทึกแบรนด์อย่างเดียวไม่สร้างสินค้า/แท็บย่อยใหม่
- Google Sheets เป็น private, public GitHub Pages ไม่มีสต็อกหรือ OAuth token ของร้าน

## v1.5 — Simple mobile navigation (2026-11-08)

- Mobile bottom navigation has four large buttons: หน้าแรก, สินค้า, แบรนด์, เมนู.
- Home quick-start buttons: เลือกแบรนด์, ค้นหาสินค้า, คิดราคา.
- Quote, photo PIA, KPI, and Google setup remain reachable through เมนู; desktop routes remain.
- After sync, brand list follows Stock_View and Brand_Custom rather than requiring manual duplicate entry. The original 17-brand list is fallback only when no stock is loaded.
- Per-brand Add Model buttons were replaced with one contextual Add Model control in the selected brand's product listing.
- Manual Add Brand is an advanced collapsed action, used only when the brand is truly missing from the Sheet.
- No inventory spreadsheet data was modified by this UI change. Cache bumped for existing PWA installations.

## v1.6 — Full brand directory, stale-stock diagnosis, and mobile repair

- Product catalog browsing now supports 13 distinct equipment types and 78 unique brand names derived from the private Stock_View grouping. Public JavaScript includes only category/brand labels: no private SKU, quantity, price, or customer data.
- Brand screen shows a single equipment-category ribbon and brand cards, replacing the old hardcoded Smartphone/Notebook-only view; mobile brand dropdown includes the complete directory even when an outdated subset is cached.
- Cached 143-item snapshots are explicitly labeled incomplete; Google/Excel stock data in the mobile browser is not represented as freshly synchronized simply because it was previously loaded via Google OAuth.
- The banner offers the existing OAuth sync and an immediate Excel import file picker; the source Google Sheet is unchanged.
- Home page category totals now use Smartphone, Notebook, Accessory and Tablet rather than only Samsung, OPPO, vivo and a generic Notebook brand.
- Advanced add-brand/product UI preserved behind the dedicated management action; other app routes retained. Check live stock availability against the authenticated spreadsheet/POS.
