import { faker } from '@faker-js/faker';

import { getPlots, getPlotTypes } from './cemetery-store';

/**
 * 智慧陵园 Phase 2 业务数据层（内存，重启重置）：
 * 价目 / 客户 / 销售单（含收款）/ 逝者档案 / 安葬登记。
 * 状态联动：销售驱动 saleStatus（idle→reserved→sold），安葬完成驱动 occupied。
 */
const formatterCN = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function now() {
  return formatterCN.format(new Date());
}

function createId() {
  return faker.string.uuid();
}

// ---------------------------------------------------------------- 价目

export interface MockPrice {
  id: string;
  parkId: string;
  typeId: string;
  price: number;
  managementCycleYears: number;
  remark?: string;
  createTime: string;
}

const prices: MockPrice[] = [];

export function getPrices() {
  return prices;
}

export function createPrice(data: Omit<MockPrice, 'createTime' | 'id'>) {
  const item: MockPrice = { ...data, id: createId(), createTime: now() };
  prices.unshift(item);
  return item;
}

export function updatePrice(
  id: string,
  data: Partial<Omit<MockPrice, 'createTime' | 'id'>>,
) {
  const index = prices.findIndex((item) => item.id === id);
  if (index === -1) return null;
  prices[index] = { ...prices[index]!, ...data };
  return prices[index];
}

export function deletePrice(id: string) {
  const index = prices.findIndex((item) => item.id === id);
  if (index === -1) return false;
  prices.splice(index, 1);
  return true;
}

// ---------------------------------------------------------------- 客户

export interface MockCustomer {
  id: string;
  name: string;
  gender: 0 | 1 | 2; // 0 未知 1 男 2 女
  phone: string;
  idCard: string;
  address: string;
  remark?: string;
  createTime: string;
}

const customers: MockCustomer[] = [];

export function getCustomers() {
  return customers;
}

export function findCustomerById(id: string) {
  return customers.find((item) => item.id === id);
}

export function createCustomer(data: Omit<MockCustomer, 'createTime' | 'id'>) {
  const item: MockCustomer = { ...data, id: createId(), createTime: now() };
  customers.unshift(item);
  return item;
}

export function updateCustomer(
  id: string,
  data: Partial<Omit<MockCustomer, 'createTime' | 'id'>>,
) {
  const index = customers.findIndex((item) => item.id === id);
  if (index === -1) return null;
  customers[index] = { ...customers[index]!, ...data };
  return customers[index];
}

export function deleteCustomer(id: string) {
  const index = customers.findIndex((item) => item.id === id);
  if (index === -1) return false;
  customers.splice(index, 1);
  return true;
}

// ---------------------------------------------------------------- 逝者档案

export interface MockDeceased {
  id: string;
  name: string;
  gender: 0 | 1 | 2;
  birthDate?: string;
  deathDate?: string;
  proofUrl?: string;
  remark?: string;
  createTime: string;
}

const deceasedList: MockDeceased[] = [];

export function getDeceasedList() {
  return deceasedList;
}

export function findDeceasedById(id: string) {
  return deceasedList.find((item) => item.id === id);
}

export function createDeceased(data: Omit<MockDeceased, 'createTime' | 'id'>) {
  const item: MockDeceased = { ...data, id: createId(), createTime: now() };
  deceasedList.unshift(item);
  return item;
}

export function updateDeceased(
  id: string,
  data: Partial<Omit<MockDeceased, 'createTime' | 'id'>>,
) {
  const index = deceasedList.findIndex((item) => item.id === id);
  if (index === -1) return null;
  deceasedList[index] = { ...deceasedList[index]!, ...data };
  return deceasedList[index];
}

export function deleteDeceased(id: string) {
  const index = deceasedList.findIndex((item) => item.id === id);
  if (index === -1) return false;
  deceasedList.splice(index, 1);
  return true;
}

// ---------------------------------------------------------------- 销售单

export type SaleStatus = 'refunded' | 'reserved' | 'signed';

export interface MockSaleOrder {
  id: string;
  orderNo: string;
  parkId: string;
  plotId: string;
  customerId: string;
  status: SaleStatus;
  deposit: number;
  totalAmount: number;
  paidAmount: number;
  contractNo?: string;
  remark?: string;
  createdAt: string;
  signedAt?: string;
}

export interface MockPayment {
  id: string;
  orderId: string;
  amount: number;
  method: 'alipay' | 'bank' | 'cash' | 'wechat';
  paidAt: string;
  receiptNo: string;
}

const sales: Array<
  MockSaleOrder & {
    customerName?: string;
    customerPhone?: string;
    plotCode?: string;
  }
> = [];
const payments: MockPayment[] = [];

export function getSales() {
  return sales;
}

export function findSaleById(id: string) {
  return sales.find((item) => item.id === id);
}

export function getPaymentsByOrder(orderId: string) {
  return payments.filter((item) => item.orderId === orderId);
}

export function createSale(data: {
  customerId: string;
  deposit: number;
  parkId: string;
  plotId: string;
  remark?: string;
}) {
  const order: MockSaleOrder = {
    id: createId(),
    orderNo: `XS${Date.now()}`,
    parkId: data.parkId,
    plotId: data.plotId,
    customerId: data.customerId,
    status: 'reserved',
    deposit: data.deposit,
    totalAmount: 0,
    paidAmount: data.deposit,
    remark: data.remark,
    createdAt: now(),
  };
  sales.unshift(order);
  if (data.deposit > 0) {
    payments.push({
      id: createId(),
      orderId: order.id,
      amount: data.deposit,
      method: 'wechat',
      paidAt: now(),
      receiptNo: `SK${Date.now()}`,
    });
  }
  return order;
}

export function signSale(id: string, contractNo: string, totalAmount: number) {
  const order = findSaleById(id);
  if (!order) return null;
  order.status = 'signed';
  order.contractNo = contractNo;
  order.totalAmount = totalAmount;
  order.signedAt = now();
  return order;
}

export function addPayment(
  orderId: string,
  data: { amount: number; method: string },
) {
  const order = findSaleById(orderId);
  if (!order) return null;
  const payment: MockPayment = {
    id: createId(),
    orderId,
    amount: data.amount,
    method: data.method as MockPayment['method'],
    paidAt: now(),
    receiptNo: `SK${Date.now()}`,
  };
  payments.push(payment);
  order.paidAmount += data.amount;
  return payment;
}

export function refundSale(id: string) {
  const order = findSaleById(id);
  if (!order) return null;
  order.status = 'refunded';
  return order;
}

// ---------------------------------------------------------------- 安葬登记

export type BurialStatus = 'completed' | 'scheduled';

export interface MockBurial {
  id: string;
  certificateNo: string;
  parkId: string;
  plotId: string;
  customerId: string;
  deceasedId: string;
  burialDate: string;
  status: BurialStatus;
  createdAt: string;
}

const burials: MockBurial[] = [];
let burialSeq = 100;

export function getBurials() {
  return burials;
}

export function findBurialById(id: string) {
  return burials.find((item) => item.id === id);
}

export function createBurial(data: {
  burialDate: string;
  customerId: string;
  deceasedId: string;
  parkId: string;
  plotId: string;
}) {
  burialSeq += 1;
  const item: MockBurial = {
    id: createId(),
    certificateNo: `AZ${new Date().getFullYear()}-${burialSeq}`,
    parkId: data.parkId,
    plotId: data.plotId,
    customerId: data.customerId,
    deceasedId: data.deceasedId,
    burialDate: data.burialDate,
    status: 'scheduled',
    createdAt: now(),
  };
  burials.unshift(item);
  return item;
}

export function completeBurial(id: string) {
  const item = findBurialById(id);
  if (!item) return null;
  item.status = 'completed';
  return item;
}

export function getBurialsByPark(parkId: string) {
  return burials.filter((item) => item.parkId === parkId);
}

// ---------------------------------------------------------------- 业务种子

/** 业务种子：在 cemetery-store 初始化后调用一次（biz 依赖 cemetery 数据） */
export function seedBizData() {
  const plots = getPlots();
  const types = getPlotTypes();
  const builtPlots = plots.filter((p) => p.buildStatus === 'built');

  // 价目：按墓区实际分布推导（每墓区取代表价）
  const parkIds = [...new Set(plots.map((p) => p.parkId))];
  for (const type of types) {
    const sample = builtPlots.find((p) => p.typeId === type.id);
    if (!sample) continue;
    for (const parkId of parkIds) {
      const base = sample.price ?? 46_800;
      createPrice({
        parkId,
        typeId: type.id,
        price: base,
        managementCycleYears: 20,
        remark: `${type.name}标准价`,
      });
    }
  }

  // 客户
  const customerSeeds = [
    {
      name: '朱国钧',
      gender: 1 as const,
      phone: '13905712233',
      idCard: '330102196203154411',
      address: '杭州市西湖区文一路 12 号',
    },
    {
      name: '李秀兰',
      gender: 2 as const,
      phone: '13868091234',
      idCard: '330106197508223350',
      address: '杭州市拱墅区莫干山路 58 号',
    },
    {
      name: '王建国',
      gender: 1 as const,
      phone: '13735689012',
      idCard: '330103196811095216',
      address: '江州市青云区滨江路 33 号',
    },
    {
      name: '陈美玲',
      gender: 2 as const,
      phone: '13606512345',
      idCard: '330108197204183367',
      address: '江州市湖西区滨湖大道 7 号',
    },
    {
      name: '赵德柱',
      gender: 1 as const,
      phone: '13588994567',
      idCard: '330105195906304490',
      address: '江州市青云区龙井路 21 号',
    },
  ];
  for (const c of customerSeeds) {
    createCustomer({ ...c, remark: undefined });
  }

  // 逝者档案
  const deceasedSeeds = [
    {
      name: '朱德海',
      gender: 1 as const,
      birthDate: '1938-04-12',
      deathDate: '2024-11-02',
    },
    {
      name: '李阿婆',
      gender: 2 as const,
      birthDate: '1941-09-18',
      deathDate: '2025-03-15',
    },
    {
      name: '王守业',
      gender: 1 as const,
      birthDate: '1935-01-26',
      deathDate: '2025-08-30',
    },
  ];
  for (const d of deceasedSeeds) {
    createDeceased(d);
  }

  // 样例销售单：挑已预订/已售的格位反向生成单据（保持数据一致）
  const reservedPlots = builtPlots.filter((p) => p.saleStatus === 'reserved');
  const soldPlots = builtPlots.filter((p) => p.saleStatus === 'sold');
  const customer0 = customers[0]!;
  const customer1 = customers[1]!;
  for (const plot of reservedPlots) {
    createSale({
      customerId: customer1.id,
      deposit: Math.round((plot.price ?? 46_800) * 0.1),
      parkId: plot.parkId,
      plotId: plot.id,
    });
  }
  for (const plot of soldPlots) {
    const order = createSale({
      customerId: customer0.id,
      deposit: Math.round((plot.price ?? 46_800) * 0.2),
      parkId: plot.parkId,
      plotId: plot.id,
    });
    signSale(
      order.id,
      `HT${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      plot.price ?? 46_800,
    );
    addPayment(order.id, {
      amount: Math.round((plot.price ?? 46_800) * 0.6),
      method: 'bank',
    });
  }
}

let bizSeeded = false;

/** 保证业务种子已初始化（所有业务接口入口调用） */
export function ensureBizData() {
  if (!bizSeeded) {
    bizSeeded = true;
    seedBizData();
  }
}
