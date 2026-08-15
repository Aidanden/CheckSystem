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

  getSoapIAEndpoint: async (): Promise<SoapEndpointResponse> => {
    return request<SoapEndpointResponse>({
      url: '/system-settings/soap-ia-endpoint',
      method: 'GET',
    });
  },

  updateSoapIAEndpoint: async (endpoint: string): Promise<{ success: boolean; endpoint: string }> => {
    return request<{ success: boolean; endpoint: string }>({
      url: '/system-settings/soap-ia-endpoint',
      method: 'POST',
      data: { endpoint },
    });
  },

  getSoapInstrumentEndpoint: async (): Promise<SoapEndpointResponse> => {
    return request<SoapEndpointResponse>({
      url: '/system-settings/soap-instrument-endpoint',
      method: 'GET',
    });
  },

  updateSoapInstrumentEndpoint: async (endpoint: string): Promise<{ success: boolean; endpoint: string }> => {
    return request<{ success: boolean; endpoint: string }>({
      url: '/system-settings/soap-instrument-endpoint',
      method: 'POST',
      data: { endpoint },
    });
  },

  getHiddenScreens: async (): Promise<{ hiddenScreens: string[] }> => {
    return request<{ hiddenScreens: string[] }>({
      url: '/system-settings/hidden-screens',
      method: 'GET',
    });
  },

  unlockHiddenScreens: async (password: string): Promise<{ success: boolean; hiddenScreens: string[] }> => {
    return request<{ success: boolean; hiddenScreens: string[] }>({
      url: '/system-settings/hidden-screens/unlock',
      method: 'POST',
      data: { password },
    });
  },

  updateHiddenScreens: async (
    password: string,
    hiddenScreens: string[]
  ): Promise<{ success: boolean; hiddenScreens: string[] }> => {
    return request<{ success: boolean; hiddenScreens: string[] }>({
      url: '/system-settings/hidden-screens',
      method: 'POST',
      data: { password, hiddenScreens },
    });
  },
};
