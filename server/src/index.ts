import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import prisma from './lib/prisma';
import { getMorganConfig } from './config/logger.config';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '10.250.100.40';

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://10.250.100.40:3040',
  credentials: true,
}));
// Use secure logging configuration
const morganConfig = getMorganConfig();
app.use(morgan(morganConfig.format, morganConfig.options));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const instrumentPerms = [
      {
        permissionName: 'طباعة صك مصدق من المنظومة',
        permissionCode: 'SCREEN_CERTIFIED_INSTRUMENT',
        description: 'الاستعلام وطباعة الصك المصدق من منظومة المصرف مرة واحدة',
      },
      {
        permissionName: 'سجل طباعة الصك المصدق من المنظومة',
        permissionCode: 'SCREEN_CERTIFIED_INSTRUMENT_LOGS',
        description: 'عرض سجل استعلام وطباعة الصكوك المصدقة من المنظومة',
      },
      {
        permissionName: 'إعادة طباعة صك مصدق من المنظومة',
        permissionCode: 'REPRINT_CERTIFIED_INSTRUMENT',
        description: 'إعادة طباعة الصك المصدق من سجل المنظومة فقط',
      },
    ];
    for (const perm of instrumentPerms) {
      await prisma.permission.upsert({
        where: { permissionCode: perm.permissionCode },
        create: perm,
        update: { permissionName: perm.permissionName, description: perm.description },
      });
    }

    const layoutFlag = await prisma.systemSetting.findUnique({
      where: { key: 'certified_layout_v20260815' },
    });
    if (!layoutFlag) {
      const certifiedLayout = {
        checkWidth: 235,
        checkHeight: 86,
        branchNameX: 110,
        branchNameY: 4,
        branchNameFontSize: 8,
        branchNameAlign: 'center',
        accountNumberX: 30,
        accountNumberY: 12,
        accountNumberFontSize: 8,
        accountNumberAlign: 'right',
        serialNumberX: 185,
        serialNumberY: 18,
        serialNumberFontSize: 8,
        serialNumberAlign: 'left',
        checkSequenceX: 20,
        checkSequenceY: 18,
        checkSequenceFontSize: 8,
        checkSequenceAlign: 'left',
        accountHolderNameX: 30,
        accountHolderNameY: 18,
        accountHolderNameFontSize: 8,
        accountHolderNameAlign: 'right',
        micrLineX: 138.5,
        micrLineY: 75,
        micrLineFontSize: 14,
        micrLineAlign: 'center',
        beneficiaryNameX: 155,
        beneficiaryNameY: 41,
        beneficiaryNameFontSize: 8,
        beneficiaryNameAlign: 'right',
        amountNumbersX: 200,
        amountNumbersY: 42,
        amountNumbersFontSize: 8,
        amountNumbersAlign: 'right',
        amountWordsX: 117.5,
        amountWordsY: 48,
        amountWordsFontSize: 8,
        amountWordsAlign: 'center',
        issueDateX: 185,
        issueDateY: 12,
        issueDateFontSize: 8,
        issueDateAlign: 'left',
        checkNumberX: 185,
        checkNumberY: 18,
        checkNumberFontSize: 8,
        checkNumberAlign: 'left',
      };
      await prisma.printSettings.upsert({
        where: { accountType: 4 },
        update: certifiedLayout,
        create: { accountType: 4, ...certifiedLayout },
      });
      const stubValue = JSON.stringify({
        stubDate: { x: 25, y: 6, fontSize: 8, align: 'left' },
        stubCheckNumber: { x: 25, y: 16.5, fontSize: 8, align: 'left' },
        stubBeneficiary: { x: 15, y: 22, fontSize: 8, align: 'left' },
        stubAmount: { x: 24, y: 29.5, fontSize: 8, align: 'left' },
      });
      await prisma.systemSetting.upsert({
        where: { key: 'certified_check_stub_positions' },
        update: { value: stubValue },
        create: { key: 'certified_check_stub_positions', value: stubValue },
      });
      await prisma.systemSetting.create({
        data: { key: 'certified_layout_v20260815', value: '1' },
      });
      console.log('✅ Applied certified cheque default print layout');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://${HOST}:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown();
});

export default app;
