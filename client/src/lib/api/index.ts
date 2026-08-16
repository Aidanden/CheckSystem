// Export all services
export { authService } from './services/auth.service';
export { branchService } from './services/branch.service';
export { userService } from './services/user.service';
export { inventoryService } from './services/inventory.service';
export { printingService } from './services/printing.service';
export { systemSettingsService } from './services/systemSettings.service';
export { soapService } from './services/soap.service';
export type { SoapInstrumentResponse } from './services/soap.service';
export { printLogService } from './services/printLog.service';
export { certifiedCheckService } from './services/certifiedCheck.service';
export { certifiedInstrumentLogService } from './services/certifiedInstrumentLog.service';
export { customerCategoryService } from './services/customerCategory.service';

// Export API client
export { default as apiClient, request } from './client';

