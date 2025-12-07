const express = require('express');
const xml2js = require('xml2js');

const app = express();
const PORT = 8080;

// بيانات الحسابات التجريبية
const TEST_ACCOUNTS = [
   // فرع طرابلس 001
   { branch: '001', account: '001001000100001', name: 'شركة ليبيا للاتصالات', startCheck: '1001' },
   { branch: '001', account: '001001000100002', name: 'محمد علي أحمد', startCheck: '2001' },
   { branch: '001', account: '001001000100003', name: 'سالم عمر خالد', startCheck: '3001' },
   { branch: '001', account: '001001000100004', name: 'شركة الأفق للتجارة', startCheck: '4001' },
   { branch: '001', account: '001001000100005', name: 'فاطمة حسن محمود', startCheck: '5001' },
   // فرع مصراته 002
   { branch: '002', account: '002001000200001', name: 'شركة مصراتة القابضة', startCheck: '6001' },
   { branch: '002', account: '002001000200002', name: 'علي مصطفى علي', startCheck: '7001' },
   { branch: '002', account: '002001000200003', name: 'خالد عبدالسلام محمد', startCheck: '8001' },
   { branch: '002', account: '002001000200004', name: 'شركة البحر المتوسط', startCheck: '9001' },
   { branch: '002', account: '002001000200005', name: 'هدى إبراهيم يوسف', startCheck: '10001' }
];

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
   // فقط للـ SOAP endpoints
   if ((req.path === '/FCUBSAccService' || req.path === '/FCUBSIAService') && req.method === 'POST') {
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
         'STATUS': 'N' // جميع الشيكات جديدة افتراضياً
      });
   }

   return statuses;
}

// معالج طلبات SOAP الموحد
const soapHandler = async (req, res) => {
   try {
      console.log(`\n📨 تم استلام طلب SOAP على المسار: ${req.path}`);

      // التحقق من وجود البيانات
      if (!req.body || typeof req.body !== 'string' || req.body.trim().length === 0) {
         throw new Error('لم يتم استلام بيانات XML صالحة. تأكد من إرسال XML في الـ body');
      }

      // تحليل XML الوارد
      const parser = new xml2js.Parser({
         explicitArray: false,
         ignoreAttrs: false,
         tagNameProcessors: [xml2js.processors.stripPrefix]
      });

      const result = await parser.parseStringPromise(req.body);
      console.log('📊 XML Structure:', JSON.stringify(result, null, 2).substring(0, 500));

      let operation = '';
      let accountBranch = '';
      let account = '';

      // تحديد نوع العملية
      if (result.Envelope && result.Envelope.Body) {
         if (result.Envelope.Body.QUERYCHECKBOOK_IOFS_REQ) {
            operation = 'QueryCheckBook';
            const requestBody = result.Envelope.Body.QUERYCHECKBOOK_IOFS_REQ;
            accountBranch = requestBody.FCUBS_BODY['Chq-Bk-Details-IO'].ACCOUNT_BRANCH;
            account = requestBody.FCUBS_BODY['Chq-Bk-Details-IO'].ACCOUNT;
         } else if (result.Envelope.Body.QUERYIACUSTACC_IOFS_REQ) {
            operation = 'QueryCustomerName';
            const requestBody = result.Envelope.Body.QUERYIACUSTACC_IOFS_REQ;
            // لاحظ اختلاف الهيكل هنا حسب bankAPI.ts
            accountBranch = requestBody.FCUBS_BODY['Cust-Account-IO'].BRN;
            account = requestBody.FCUBS_BODY['Cust-Account-IO'].ACC;
         }
      }

      // Fallback for simple XML (testing)
      if (!operation && (result.ACCOUNT_BRANCH || result.ACCOUNT || result.ACC)) {
         accountBranch = result.ACCOUNT_BRANCH || result.BRN || '001';
         account = result.ACCOUNT || result.ACC;
         operation = result.OPERATION || 'QueryCheckBook';
      }

      console.log(`📋 العملية المطلوبة: ${operation}`);
      console.log('  - فرع الحساب:', accountBranch);
      console.log('  - رقم الحساب:', account);

      // البحث عن الحساب
      const accountData = TEST_ACCOUNTS.find(acc => acc.account === account);

      if (!accountData) {
         throw new Error(`الحساب رقم ${account} غير موجود في قاعدة البيانات التجريبية`);
      }

      let responseXml = '';

      if (operation === 'QueryCheckBook') {
         const firstChequeNumber = accountData.startCheck;
         const chequeStatuses = generateChequeStatuses(firstChequeNumber);

         responseXml = `<?xml version="1.0" encoding="UTF-8"?>
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
            <BRANCH>${accountBranch}</BRANCH>
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
               <ISSBRN>${accountBranch}</ISSBRN>
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

      } else if (operation === 'QueryCustomerName') {
         responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
   <S:Body>
      <QUERYIACUSTACC_IOFS_RES xmlns="http://fcubs.ofss.com/service/FCUBSIAService">
         <FCUBS_HEADER>
            <SOURCE>FCAT</SOURCE>
            <UBSCOMP>FCUBS</UBSCOMP>
            <MSGID>${generateMsgId()}</MSGID>
            <CORRELID>null</CORRELID>
            <USERID>ADMINUSER1</USERID>
            <ENTITY>null</ENTITY>
            <BRANCH>${accountBranch}</BRANCH>
            <MODULEID>ST</MODULEID>
            <SERVICE>FCUBSIAService</SERVICE>
            <OPERATION>QueryIACustAcc</OPERATION>
            <DESTINATION>FCAT</DESTINATION>
            <FUNCTIONID>STDCUS</FUNCTIONID>
            <ACTION>EXECUTEQUERY</ACTION>
            <MSGSTAT>SUCCESS</MSGSTAT>
         </FCUBS_HEADER>
         <FCUBS_BODY>
            <Cust-Account-Full>
               <BRN>${accountBranch}</BRN>
               <ACC>${account}</ACC>
               <CUSTNAME>${accountData.name}</CUSTNAME>
               <ADESC>${accountData.name}</ADESC>
               <CUSTNO>123456</CUSTNO>
               <ACCCLS>CURRENT</ACCCLS>
               <CCY>LYD</CCY>
            </Cust-Account-Full>
            <FCUBS_WARNING_RESP>
               <WARNING>
                  <WCODE>ST-SAVE-023</WCODE>
                  <WDESC>Record Successfully Retrieved</WDESC>
               </WARNING>
            </FCUBS_WARNING_RESP>
         </FCUBS_BODY>
      </QUERYIACUSTACC_IOFS_RES>
   </S:Body>
</S:Envelope>`;
      } else {
         throw new Error(`العملية ${operation} غير مدعومة`);
      }

      console.log('✅ تم إنشاء الاستجابة بنجاح\n');

      // إرسال الاستجابة
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.send(responseXml);

   } catch (error) {
      console.error('❌ خطأ في معالجة الطلب:', error.message);

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
};

// تسجيل الـ Endpoints
app.post('/FCUBSAccService', soapHandler);
app.post('/FCUBSIAService', soapHandler);

// Endpoint للتحقق من صحة الخادم
app.get('/health', (req, res) => {
   res.json({
      status: 'OK',
      service: 'FCUBS SOAP Test Server',
      timestamp: new Date().toISOString(),
      accounts_count: TEST_ACCOUNTS.length
   });
});

// تشغيل الخادم
app.listen(PORT, () => {
   console.log('═══════════════════════════════════════════════════════════════');
   console.log('🚀 خادم SOAP التجريبي يعمل على المنفذ:', PORT);
   console.log('═══════════════════════════════════════════════════════════════');
   console.log('📍 CheckBook Endpoint: http://10.250.100.40:' + PORT + '/FCUBSAccService');
   console.log('📍 CustomerName Endpoint: http://10.250.100.40:' + PORT + '/FCUBSIAService');
   console.log('🏥 Health Check: http://10.250.100.40:' + PORT + '/health');
   console.log('\n📝 العمليات المدعومة:');
   console.log('1. QueryCheckBook (للحصول على بيانات الشيكات)');
   console.log('2. QueryIACustAcc (للحصول على اسم العميل)');
   console.log('\n📊 الحسابات المتوفرة:');
   TEST_ACCOUNTS.forEach(acc => {
      console.log(`  - ${acc.account} (${acc.name}) - فرع ${acc.branch}`);
   });
   console.log('═══════════════════════════════════════════════════════════════\n');
});
