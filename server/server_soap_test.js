const express = require('express');
const xml2js = require('xml2js');

const app = express();
const PORT = 8080;

// CORS يجب أن يكون أولاً
app.use((req, res, next) => {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Headers', 'Content-Type, SOAPAction');
   res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
   if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
   }
   next();
});

// Custom middleware لقراءة raw body - يجب أن يكون قبل أي middleware آخر
app.use((req, res, next) => {
   // فقط للـ SOAP endpoint
   if (req.path === '/FCUBSAccService' && req.method === 'POST') {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', chunk => {
         data += chunk;
      });
      req.on('end', () => {
         req.body = data;
         next();
      });
   } else {
      // للـ endpoints الأخرى، استخدم express.json()
      express.json()(req, res, next);
   }
});

// دالة لتوليد رقم رسالة عشوائي
function generateMsgId() {
   return Math.floor(Math.random() * 9000000000000000) + 1000000000000000;
}

// دالة لتوليد تاريخ ووقت الحالي بصيغة FCUBS
function getCurrentTimestamp() {
   const now = new Date();
   const year = now.getFullYear();
   const month = String(now.getMonth() + 1).padStart(2, '0');
   const day = String(now.getDate()).padStart(2, '0');
   const hours = String(now.getHours()).padStart(2, '0');
   const minutes = String(now.getMinutes()).padStart(2, '0');
   const seconds = String(now.getSeconds()).padStart(2, '0');
   return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// دالة لتوليد تاريخ بصيغة FCUBS
function getCurrentDate() {
   const now = new Date();
   const year = now.getFullYear();
   const month = String(now.getMonth() + 1).padStart(2, '0');
   const day = String(now.getDate()).padStart(2, '0');
   return `${year}-${month}-${day}`;
}

// دالة لتوليد قائمة الشيكات
function generateChequeStatuses(firstChequeNumber, numberOfLeaves = 10) {
   const statuses = [];
   const firstNum = parseInt(firstChequeNumber);

   for (let i = 0; i < numberOfLeaves; i++) {
      const chequeNum = firstNum + i;
      statuses.push({
         'CHQ_BOOK_NO': firstChequeNumber,
         'CHQ_NO': chequeNum.toString(),
         'STATUS': i === 0 ? 'U' : 'N' // أول شيك Used، الباقي New
      });
   }

   return statuses;
}

// Endpoint رئيسي للـ SOAP API
app.post('/FCUBSAccService', async (req, res) => {
   try {
      console.log('\n📨 تم استلام طلب SOAP');
      console.log('Content-Type:', req.headers['content-type'] || 'غير محدد');
      console.log('Body Type:', typeof req.body);
      console.log('Body Length:', req.body ? req.body.length : 0);

      // التحقق من وجود البيانات
      if (!req.body || typeof req.body !== 'string' || req.body.trim().length === 0) {
         throw new Error('لم يتم استلام بيانات XML صالحة. تأكد من إرسال XML في الـ body');
      }

      console.log('Body Preview:', req.body.substring(0, 200) + '...');

      // تحليل XML الوارد
      const parser = new xml2js.Parser({
         explicitArray: false,
         ignoreAttrs: false,
         tagNameProcessors: [xml2js.processors.stripPrefix]
      });

      const result = await parser.parseStringPromise(req.body);

      console.log('📊 XML Structure:', JSON.stringify(result, null, 2).substring(0, 500));

      // استخراج البيانات من الطلب - دعم الحالتين
      let accountBranch, account, firstChequeNumber;

      // الحالة 1: XML كامل مع Envelope
      if (result.Envelope && result.Envelope.Body && result.Envelope.Body.QUERYCHECKBOOK_IOFS_REQ) {
         const requestBody = result.Envelope.Body.QUERYCHECKBOOK_IOFS_REQ;
         accountBranch = requestBody.FCUBS_BODY['Chq-Bk-Details-IO'].ACCOUNT_BRANCH;
         account = requestBody.FCUBS_BODY['Chq-Bk-Details-IO'].ACCOUNT;
         firstChequeNumber = requestBody.FCUBS_BODY['Chq-Bk-Details-IO'].FIRST_CHEQUE_NUMBER || '734';
      }
      // الحالة 2: جزء من XML فقط (البيانات مباشرة)
      else if (result.ACCOUNT_BRANCH || result.ACCOUNT) {
         accountBranch = result.ACCOUNT_BRANCH || '001';
         account = result.ACCOUNT;
         firstChequeNumber = result.FIRST_CHEQUE_NUMBER || '734';
      }
      else {
         throw new Error('تنسيق XML غير صحيح. يرجى إرسال SOAP Envelope كامل');
      }

      console.log('📋 البيانات المستخرجة:');
      console.log('  - فرع الحساب:', accountBranch);
      console.log('  - رقم الحساب:', account);
      console.log('  - رقم الشيك الأول:', firstChequeNumber);

      // توليد قائمة الشيكات
      const chequeStatuses = generateChequeStatuses(firstChequeNumber);

      // بناء الـ Response
      const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
   <S:Body>
      <QUERYCHECKBOOK_IOFS_RES xmlns="http://fcubs.ofss.com/service/FCUBSAccService">
         <FCUBS_HEADER>
            <SOURCE>FCAT</SOURCE>
            <UBSCOMP>FCUBS</UBSCOMP>
            <MSGID>${generateMsgId()}</MSGID>
            <CORRELID>null</CORRELID>
            <USERID>ADMINUSER1</USERID>
            <ENTITY>null</ENTITY>
            <BRANCH>001</BRANCH>
            <MODULEID>CA</MODULEID>
            <SERVICE>FCUBSAccService</SERVICE>
            <OPERATION>QueryCheckBook</OPERATION>
            <DESTINATION>FCAT</DESTINATION>
            <FUNCTIONID>CADCHBOO</FUNCTIONID>
            <ACTION>EXECUTEQUERY</ACTION>
            <MSGSTAT>SUCCESS</MSGSTAT>
         </FCUBS_HEADER>
         <FCUBS_BODY>
            <Chq-Bk-Details-Full>
               <INCL_FOR_CHKBOOK_PRINTING>Y</INCL_FOR_CHKBOOK_PRINTING>
               <ACCOUNT_BRANCH>${accountBranch}</ACCOUNT_BRANCH>
               <ACCOUNT>${account}</ACCOUNT>
               <FIRST_CHEQUE_NUMBER>${firstChequeNumber}</FIRST_CHEQUE_NUMBER>
               <CHEQUE_LEAVES>10</CHEQUE_LEAVES>
               <ORDER_DATE>${getCurrentDate()}</ORDER_DATE>
               <ISSUE_DATE>${getCurrentDate()}</ISSUE_DATE>
               <CHQ_TYPE>COMM</CHQ_TYPE>
               <CH_BK_TYPE>ACB</CH_BK_TYPE>
               <DELIVERY_MODE>B</DELIVERY_MODE>
               <LANGCODE>ARB</LANGCODE>
               <REQUEST_STATUS>Delivered</REQUEST_STATUS>
               <REQUEST_MODE>FLEXCUBE</REQUEST_MODE>
               <APPLY_CHG>Y</APPLY_CHG>
               <ISSBRN>001</ISSBRN>
               <MAKER>ZAHIDJAVED1</MAKER>
               <MAKERSTAMP>${getCurrentTimestamp()}</MAKERSTAMP>
               <CHECKER>ZAHIDJAVED1</CHECKER>
               <CHECKERSTAMP>${getCurrentTimestamp()}</CHECKERSTAMP>
               <MODNO>2</MODNO>
               <TXNSTAT>O</TXNSTAT>
               <AUTHSTAT>A</AUTHSTAT>
               ${chequeStatuses.map(status => `<Cavws-Cheque-Status>
                  <CHQ_BOOK_NO>${status.CHQ_BOOK_NO}</CHQ_BOOK_NO>
                  <CHQ_NO>${status.CHQ_NO}</CHQ_NO>
                  <STATUS>${status.STATUS}</STATUS>
               </Cavws-Cheque-Status>`).join('\n               ')}
               <UDFDETAILS>
                  <FLDNAM>CHECK_BOOK</FLDNAM>
                  <FLDVAL>0012256686885+</FLDVAL>
               </UDFDETAILS>
            </Chq-Bk-Details-Full>
            <FCUBS_WARNING_RESP>
               <WARNING>
                  <WCODE>ST-SAVE-023</WCODE>
                  <WDESC>Record Successfully Retrieved</WDESC>
               </WARNING>
            </FCUBS_WARNING_RESP>
         </FCUBS_BODY>
      </QUERYCHECKBOOK_IOFS_RES>
   </S:Body>
</S:Envelope>`;

      console.log('✅ تم إنشاء الاستجابة بنجاح\n');

      // إرسال الاستجابة
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.send(responseXml);

   } catch (error) {
      console.error('❌ خطأ في معالجة الطلب:', error.message);
      console.error('Stack:', error.stack);

      // إرسال استجابة خطأ SOAP
      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
   <S:Body>
      <S:Fault>
         <faultcode>S:Server</faultcode>
         <faultstring>Internal Server Error</faultstring>
         <detail>
            <message>${error.message}</message>
         </detail>
      </S:Fault>
   </S:Body>
</S:Envelope>`;

      res.status(500).set('Content-Type', 'text/xml; charset=utf-8');
      res.send(errorResponse);
   }
});

// Endpoint للتحقق من صحة الخادم
app.get('/health', (req, res) => {
   res.json({
      status: 'OK',
      service: 'FCUBS SOAP Test Server',
      timestamp: new Date().toISOString()
   });
});

// تشغيل الخادم
app.listen(PORT, () => {
   console.log('═══════════════════════════════════════════════════════════════');
   console.log('🚀 خادم SOAP التجريبي يعمل على المنفذ:', PORT);
   console.log('═══════════════════════════════════════════════════════════════');
   console.log('📍 SOAP Endpoint: http://localhost:' + PORT + '/FCUBSAccService');
   console.log('🏥 Health Check: http://localhost:' + PORT + '/health');
   console.log('\n📝 مثال على الطلب:');
   console.log('POST http://localhost:' + PORT + '/FCUBSAccService');
   console.log('Content-Type: text/xml');
   console.log('\n📊 البيانات المتغيرة المطلوبة:');
   console.log('  - ACCOUNT_BRANCH (مثال: 001)');
   console.log('  - ACCOUNT (مثال: 001001000811217)');
   console.log('  - FIRST_CHEQUE_NUMBER (اختياري، افتراضي: 734)');
   console.log('═══════════════════════════════════════════════════════════════\n');
});
