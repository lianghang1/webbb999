import type { CemeteryPlot } from './types';

import { requestClient } from '#/api/request';

// ---------------------------------------------------------------- 价目

export interface CemeteryPrice {
  createTime: string;
  id: string;
  managementCycleYears: number;
  parkId: string;
  price: number;
  remark?: string;
  typeId: string;
}

export function getPriceListApi(parkId?: string) {
  return requestClient.get<CemeteryPrice[]>('/cemetery/prices/list', {
    params: { parkId },
  });
}

export function createPriceApi(data: {
  managementCycleYears?: number;
  parkId: string;
  price: number;
  remark?: string;
  typeId: string;
}) {
  return requestClient.post<CemeteryPrice>('/cemetery/prices', data);
}

export function updatePriceApi(
  id: string,
  data: { managementCycleYears?: number; price?: number; remark?: string },
) {
  return requestClient.put<CemeteryPrice>(`/cemetery/prices/${id}`, data);
}

export function deletePriceApi(id: string) {
  return requestClient.delete(`/cemetery/prices/${id}`);
}

// ---------------------------------------------------------------- 客户

export interface CemeteryCustomer {
  address: string;
  createTime: string;
  gender: 0 | 1 | 2;
  id: string;
  idCard: string;
  name: string;
  phone: string;
  remark?: string;
}

export function getCustomerListApi(keyword?: string) {
  return requestClient.get<CemeteryCustomer[]>('/cemetery/customers/list', {
    params: { keyword },
  });
}

export function createCustomerApi(data: {
  address?: string;
  gender?: number;
  idCard?: string;
  name: string;
  phone: string;
  remark?: string;
}) {
  return requestClient.post<CemeteryCustomer>('/cemetery/customers', data);
}

export function updateCustomerApi(
  id: string,
  data: Partial<{
    address: string;
    gender: number;
    idCard: string;
    name: string;
    phone: string;
    remark: string;
  }>,
) {
  return requestClient.put<CemeteryCustomer>(`/cemetery/customers/${id}`, data);
}

export function deleteCustomerApi(id: string) {
  return requestClient.delete(`/cemetery/customers/${id}`);
}

// ---------------------------------------------------------------- 逝者档案

export interface CemeteryDeceased {
  birthDate?: string;
  createTime: string;
  deathDate?: string;
  gender: 0 | 1 | 2;
  id: string;
  name: string;
  proofUrl?: string;
  remark?: string;
}

export function getDeceasedListApi() {
  return requestClient.get<CemeteryDeceased[]>('/cemetery/deceased/list');
}

export function createDeceasedApi(data: {
  birthDate?: string;
  deathDate?: string;
  gender?: number;
  name: string;
  proofUrl?: string;
  remark?: string;
}) {
  return requestClient.post<CemeteryDeceased>('/cemetery/deceased', data);
}

export function updateDeceasedApi(
  id: string,
  data: Partial<{
    birthDate: string;
    deathDate: string;
    gender: number;
    name: string;
    proofUrl: string;
    remark: string;
  }>,
) {
  return requestClient.put<CemeteryDeceased>(`/cemetery/deceased/${id}`, data);
}

export function deleteDeceasedApi(id: string) {
  return requestClient.delete(`/cemetery/deceased/${id}`);
}

// ---------------------------------------------------------------- 销售单

export type SaleStatus = 'refunded' | 'reserved' | 'signed';

export interface CemeterySale {
  contractNo?: string;
  createdAt: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  deposit: number;
  id: string;
  orderNo: string;
  paidAmount: number;
  parkId: string;
  plotCode?: string;
  plotId: string;
  remark?: string;
  signedAt?: string;
  status: SaleStatus;
  totalAmount: number;
}

export interface CemeteryPayment {
  amount: number;
  id: string;
  method: string;
  orderId: string;
  paidAt: string;
  receiptNo: string;
}

export function getSaleListApi(params: {
  keyword?: string;
  parkId?: string;
  status?: string;
}) {
  return requestClient.get<CemeterySale[]>('/cemetery/sales/list', { params });
}

export function createSaleApi(data: {
  customerId: string;
  deposit: number;
  parkId: string;
  plotId: string;
  remark?: string;
}) {
  return requestClient.post<CemeterySale>('/cemetery/sales', data);
}

export function signSaleApi(
  id: string,
  data: { contractNo: string; totalAmount: number },
) {
  return requestClient.post<CemeterySale>(`/cemetery/sales/${id}/sign`, data);
}

export function addPaymentApi(
  id: string,
  data: { amount: number; method: string },
) {
  return requestClient.post<CemeteryPayment>(
    `/cemetery/sales/${id}/payments`,
    data,
  );
}

export function refundSaleApi(id: string) {
  return requestClient.post<CemeterySale>(`/cemetery/sales/${id}/refund`);
}

// ---------------------------------------------------------------- 安葬登记

export type BurialStatus = 'completed' | 'scheduled';

export interface CemeteryBurial {
  burialDate: string;
  certificateNo: string;
  createdAt: string;
  customerId: string;
  customerName?: string;
  deceasedId: string;
  deceasedName?: string;
  id: string;
  parkId: string;
  plotId: string;
  status: BurialStatus;
}

export function getBurialListApi(parkId?: string) {
  return requestClient.get<CemeteryBurial[]>('/cemetery/burials/list', {
    params: { parkId },
  });
}

export function createBurialApi(data: {
  burialDate: string;
  customerId: string;
  deceasedId: string;
  parkId: string;
  plotId: string;
}) {
  return requestClient.post<CemeteryBurial>('/cemetery/burials', data);
}

export function completeBurialApi(id: string) {
  return requestClient.post<CemeteryBurial>(`/cemetery/burials/${id}/complete`);
}

/** 价格 → 万元缩写：56800 → 5.68万；9800 → ¥9800 */
export function priceWan(price?: number): null | string {
  if (price === undefined || price === null) {
    return null;
  }
  if (price >= 100_000_000) {
    return `${(price / 100_000_000).toFixed(2).replace(/\.?0+$/, '')}亿`;
  }
  if (price >= 10_000) {
    const wan = price / 10_000;
    const text =
      wan >= 100
        ? Math.round(wan).toString()
        : wan.toFixed(2).replace(/\.?0+$/, '');
    return `${text}万`;
  }
  return `¥${price}`;
}

export function cryptCountLabel(count?: number): string {
  if (!count || count <= 1) {
    return '单穴';
  }
  if (count === 2) {
    return '双穴';
  }
  return `${count}穴（多穴）`;
}

// ---------------------------------------------------------------- 售后工单

export type AfterSaleStatus = 'completed' | 'pending' | 'processing';
export type AfterSaleType = 'clean' | 'green' | 'other' | 'stone';

export interface CemeteryAfterSale {
  completeAt?: string;
  description: string;
  handler?: string;
  id: string;
  orderNo: string;
  parkId: string;
  plotCode?: string;
  plotId: string;
  reportAt: string;
  status: AfterSaleStatus;
  type: AfterSaleType;
}

export function getAfterSaleListApi(params: {
  keyword?: string;
  parkId?: string;
  status?: string;
}) {
  return requestClient.get<CemeteryAfterSale[]>('/cemetery/aftersales/list', {
    params,
  });
}

export function createAfterSaleApi(data: {
  description: string;
  handler?: string;
  parkId?: string;
  plotId: string;
  type: AfterSaleType;
}) {
  return requestClient.post<CemeteryAfterSale>('/cemetery/aftersales', data);
}

export function updateAfterSaleApi(
  id: string,
  data: {
    description?: string;
    handler?: string;
    status?: AfterSaleStatus;
    type?: AfterSaleType;
  },
) {
  return requestClient.put<CemeteryAfterSale>(
    `/cemetery/aftersales/${id}`,
    data,
  );
}

export function completeAfterSaleApi(id: string, handler?: string) {
  return requestClient.post<CemeteryAfterSale>(
    `/cemetery/aftersales/${id}/complete`,
    { handler },
  );
}

export const AFTER_SALE_STATUS: Record<AfterSaleStatus, string> = {
  completed: '已完成',
  pending: '待处理',
  processing: '处理中',
};

export const AFTER_SALE_TYPE: Record<AfterSaleType, string> = {
  clean: '保洁祭扫',
  green: '绿化养护',
  other: '其他服务',
  stone: '碑体维修',
};

// ---------------------------------------------------------------- 维护费缴纳

export interface CemeteryMaintenanceFee {
  amount: number;
  cycleYears: number;
  id: string;
  method: string;
  orderId?: string;
  paidAt: string;
  plotId: string;
  receiptNo: string;
}

// ---------------------------------------------------------------- 格位全档案

export interface PlotArchive {
  burial?: CemeteryBurial;
  customer?: CemeteryCustomer;
  deceased?: CemeteryDeceased;
  maintenanceFees: CemeteryMaintenanceFee[];
  payments: CemeteryPayment[];
  plot: CemeteryPlot;
  sale?: CemeterySale;
}

export function getPlotArchiveApi(plotId: string) {
  return requestClient.get<PlotArchive>(`/cemetery/plots/${plotId}/archive`);
}
