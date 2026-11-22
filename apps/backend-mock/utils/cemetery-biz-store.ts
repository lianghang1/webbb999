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
  const prev = prices[index];
  if (index === -1 || !prev) return null;
  const updated: MockPrice = { ...prev, ...data };
  prices[index] = updated;
  return updated;
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
  const prev = customers[index];
  if (index === -1 || !prev) return null;
  const updated: MockCustomer = { ...prev, ...data };
  customers[index] = updated;
  return updated;
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
  const prev = deceasedList[index];
  if (index === -1 || !prev) return null;
  const updated: MockDeceased = { ...prev, ...data };
  deceasedList[index] = updated;
  return updated;
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

/** 取格位最新一笔有效销售单（退购单除外），无则返回 undefined */
export function findSaleByPlotLatest(plotId: string) {
  return sales.find(
    (item) => item.plotId === plotId && item.status !== 'refunded',
  );
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

/** 取格位最新一条安葬登记 */
export function findBurialByPlotLatest(plotId: string) {
  return burials.find((item) => item.plotId === plotId);
}

// ---------------------------------------------------------------- 维护费缴纳

/** 维护费（管理费）缴纳记录：按缴费周期一次一缴 */
export interface MockMaintenanceFee {
  id: string;
  orderId?: string;
  plotId: string;
  cycleYears: number;
  amount: number;
  method: 'alipay' | 'bank' | 'cash' | 'wechat';
  paidAt: string;
  receiptNo: string;
}

const maintenanceFees: MockMaintenanceFee[] = [];

export function getMaintenanceFees() {
  return maintenanceFees;
}

export function getMaintenanceFeesByPlot(plotId: string) {
  return maintenanceFees
    .filter((item) => item.plotId === plotId)
    .toSorted((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
}

export function createMaintenanceFee(
  data: Omit<MockMaintenanceFee, 'id' | 'paidAt' | 'receiptNo'>,
) {
  const item: MockMaintenanceFee = {
    ...data,
    id: createId(),
    paidAt: now(),
    receiptNo: `GL${Date.now()}`,
  };
  maintenanceFees.unshift(item);
  return item;
}

// ---------------------------------------------------------------- 售后工单

export type AfterSaleStatus = 'completed' | 'pending' | 'processing';
export type AfterSaleType = 'clean' | 'green' | 'other' | 'stone';

export interface MockAfterSale {
  id: string;
  orderNo: string;
  parkId: string;
  plotId: string;
  type: AfterSaleType;
  status: AfterSaleStatus;
  description: string;
  handler?: string;
  reportAt: string;
  completeAt?: string;
}

const afterSales: MockAfterSale[] = [];
let afterSaleSeq = 100;

export function getAfterSales() {
  return afterSales;
}

export function findAfterSaleById(id: string) {
  return afterSales.find((item) => item.id === id);
}

export function createAfterSale(
  data: Omit<
    MockAfterSale,
    'completeAt' | 'id' | 'orderNo' | 'reportAt' | 'status'
  >,
) {
  afterSaleSeq += 1;
  const item: MockAfterSale = {
    ...data,
    id: createId(),
    orderNo: `SH${new Date().getFullYear()}-${afterSaleSeq}`,
    status: 'pending',
    reportAt: now(),
  };
  afterSales.unshift(item);
  return item;
}

export function updateAfterSale(
  id: string,
  data: Partial<
    Pick<MockAfterSale, 'description' | 'handler' | 'status' | 'type'>
  >,
) {
  const index = afterSales.findIndex((item) => item.id === id);
  const prev = afterSales[index];
  if (index === -1 || !prev) return null;
  const updated: MockAfterSale = { ...prev, ...data };
  afterSales[index] = updated;
  return updated;
}

export function completeAfterSale(id: string, handler?: string) {
  const item = findAfterSaleById(id);
  if (!item) return null;
  item.status = 'completed';
  item.completeAt = now();
  if (handler) {
    item.handler = handler;
  }
  return item;
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
  const customer0 = customers[0];
  const customer1 = customers[1];
  if (!customer0 || !customer1) return;
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

  // 已安葬格位：补全业务闭环（签约销售单 → 全款 → 完成安葬 → 维护费首缴）
  const occupiedPlots = builtPlots.filter((p) => p.saleStatus === 'occupied');
  const deceasedAll = getDeceasedList();
  for (const [i, plot] of occupiedPlots.entries()) {
    const total = plot.price ?? 46_800;
    const order = createSale({
      customerId: customer0.id,
      deposit: Math.round(total * 0.2),
      parkId: plot.parkId,
      plotId: plot.id,
    });
    signSale(order.id, `HT${new Date().getFullYear()}-${1000 + i}`, total);
    addPayment(order.id, { amount: Math.round(total * 0.6), method: 'bank' });
    const paidSoFar = Math.round(total * 0.2) + Math.round(total * 0.6);
    addPayment(order.id, { amount: total - paidSoFar, method: 'bank' });
    createMaintenanceFee({
      orderId: order.id,
      plotId: plot.id,
      cycleYears: 20,
      amount: Math.round(total * 0.02),
      method: 'bank',
    });
    const deceased = deceasedAll[i % deceasedAll.length];
    if (!deceased) continue;
    const burial = createBurial({
      burialDate: `2025-0${(i % 6) + 1}-1${(i % 9) + 1}`,
      customerId: customer0.id,
      deceasedId: deceased.id,
      parkId: plot.parkId,
      plotId: plot.id,
    });
    completeBurial(burial.id);
  }

  // 维护费记录：已售格位生成首期缴费（20 年周期）
  for (const order of getSales().filter((item) => item.status === 'signed')) {
    const plot = builtPlots.find((p) => p.id === order.plotId);
    if (!plot) continue;
    const existed = maintenanceFees.some((fee) => fee.plotId === plot.id);
    if (!existed) {
      createMaintenanceFee({
        orderId: order.id,
        plotId: plot.id,
        cycleYears: 20,
        amount: Math.round((plot.price ?? 46_800) * 0.02),
        method: 'bank',
      });
    }
  }

  // 售后工单：围绕已安葬/维护中格位生成样例
  const afterSaleSeeds = [
    {
      description: '碑体表面开裂，需要修补抛光',
      type: 'stone' as const,
      status: 'processing' as const,
      handler: '张卫士',
    },
    {
      description: '穴位周边绿化枯死，补种冬青',
      type: 'green' as const,
      status: 'pending' as const,
    },
    {
      description: '碑前祭扫残留物清理',
      type: 'clean' as const,
      status: 'completed' as const,
      handler: '李保洁',
    },
    {
      description: '底座松动倾斜，重新加固',
      type: 'stone' as const,
      status: 'completed' as const,
      handler: '张卫士',
    },
    {
      description: '客户申请更换仿真花，代为布置',
      type: 'other' as const,
      status: 'pending' as const,
    },
  ];
  const targetPlots = builtPlots.filter(
    (p) => p.saleStatus === 'occupied' || p.saleStatus === 'maintenance',
  );
  for (const [i, seed] of afterSaleSeeds.entries()) {
    const plot = targetPlots[(i * 3 + 1) % Math.max(targetPlots.length, 1)];
    if (!plot) break;
    const item = createAfterSale({
      parkId: plot.parkId,
      plotId: plot.id,
      type: seed.type,
      description: seed.description,
      handler: seed.handler,
    });
    if (seed.status !== 'pending') {
      updateAfterSale(item.id, { status: seed.status });
      if (seed.status === 'completed') {
        completeAfterSale(item.id, seed.handler);
      }
    }
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
