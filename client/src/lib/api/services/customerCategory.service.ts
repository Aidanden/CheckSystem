import { request } from '../client';

export interface CustomerCategory {
  id: number;
  categoryCode: string;
  description: string;
  typeCode: '01' | '02' | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResolveResult {
  found: boolean;
  categoryCode: string | null;
  description?: string;
  typeCode?: string;
  accountType?: 1 | 2;
  error?: string;
}

export const customerCategoryService = {
  getAll: () =>
    request<CustomerCategory[]>({
      url: '/customer-categories',
      method: 'GET',
    }),

  resolve: (accountNumber: string) =>
    request<CategoryResolveResult>({
      url: '/customer-categories/resolve',
      method: 'GET',
      params: { accountNumber },
    }),

  create: (data: { categoryCode: string; description: string; typeCode: string; isActive?: boolean }) =>
    request<CustomerCategory>({
      url: '/customer-categories',
      method: 'POST',
      data,
    }),

  update: (id: number, data: Partial<{ categoryCode: string; description: string; typeCode: string; isActive: boolean }>) =>
    request<CustomerCategory>({
      url: `/customer-categories/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number) =>
    request<{ success: boolean }>({
      url: `/customer-categories/${id}`,
      method: 'DELETE',
    }),
};
