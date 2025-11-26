import { request } from '../client';

interface SoapEndpointResponse {
  endpoint: string;
}

export const systemSettingsService = {
  getSoapEndpoint: async (): Promise<SoapEndpointResponse> => {
    return request<SoapEndpointResponse>({
      url: '/system-settings/soap-endpoint',
      method: 'GET',
    });
  },

  updateSoapEndpoint: async (endpoint: string): Promise<{ success: boolean; endpoint: string }> => {
    return request<{ success: boolean; endpoint: string }>({
      url: '/system-settings/soap-endpoint',
      method: 'POST',
      data: { endpoint },
    });
  },
};
