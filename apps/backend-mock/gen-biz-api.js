 
// 批量生成 Phase 2 业务 mock 接口（一次性脚本）
const fs = require('fs');
const path = require('path');

function write(rel, content) {
  const full = path.join(__dirname, 'api', 'cemetery', rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trim() + '\n');
  console.log('wrote', rel);
}

const GUARD = `import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';`;

// ---------------- prices ----------------
write(
  'prices/list.ts',
  `
import { eventHandler, getQuery } from 'h3';
import { ensureBizData, getPrices } from '~/utils/cemetery-biz-store';
${GUARD}
import { firstQueryString } from '~/utils/query';
import { useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const parkId = firstQueryString(query.parkId);
  const list = parkId ? getPrices().filter((item) => item.parkId === parkId) : getPrices();
  return useResponseSuccess(list);
});
`,
);

write(
  'prices/.post.ts',
  `
import { eventHandler, readBody } from 'h3';
import { createPrice, ensureBizData } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const body = await readBody(event);
  if (!body?.parkId || !body?.typeId || !body?.price) {
    return useResponseError('园区/墓型/价格不能为空');
  }
  return useResponseSuccess(createPrice({
    parkId: String(body.parkId),
    typeId: String(body.typeId),
    price: Number(body.price),
    managementCycleYears: Number(body.managementCycleYears ?? 20),
    remark: body.remark ? String(body.remark) : undefined,
  }));
});
`,
);

write(
  'prices/[id].put.ts',
  `
import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, updatePrice } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body) return useResponseError('参数缺失');
  const item = updatePrice(id, {
    price: body.price === undefined ? undefined : Number(body.price),
    managementCycleYears: body.managementCycleYears === undefined ? undefined : Number(body.managementCycleYears),
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!item) return useResponseError('价目不存在');
  return useResponseSuccess(item);
});
`,
);

write(
  'prices/[id].delete.ts',
  `
import { eventHandler, getRouterParam } from 'h3';
import { deletePrice, ensureBizData } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  if (!id) return useResponseError('参数缺失');
  const ok = deletePrice(id);
  if (!ok) return useResponseError('价目不存在');
  return useResponseSuccess(null);
});
`,
);

// ---------------- customers ----------------
write(
  'customers/list.ts',
  `
import { eventHandler, getQuery } from 'h3';
import { ensureBizData, getCustomers } from '~/utils/cemetery-biz-store';
${GUARD}
import { firstQueryString } from '~/utils/query';
import { useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const keyword = firstQueryString(query.keyword);
  const list = keyword
    ? getCustomers().filter((item) => item.name.includes(keyword) || item.phone.includes(keyword))
    : getCustomers();
  return useResponseSuccess(list);
});
`,
);

write(
  'customers/.post.ts',
  `
import { eventHandler, readBody } from 'h3';
import { createCustomer, ensureBizData } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const body = await readBody(event);
  if (!body?.name || !body?.phone) {
    return useResponseError('客户姓名与电话不能为空');
  }
  return useResponseSuccess(createCustomer({
    name: String(body.name),
    gender: Number(body.gender ?? 1) === 2 ? 2 : 1,
    phone: String(body.phone),
    idCard: body.idCard ? String(body.idCard) : '',
    address: body.address ? String(body.address) : '',
    remark: body.remark ? String(body.remark) : undefined,
  }));
});
`,
);

write(
  'customers/[id].put.ts',
  `
import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, updateCustomer } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body) return useResponseError('参数缺失');
  const item = updateCustomer(id, {
    name: body.name === undefined ? undefined : String(body.name),
    gender: body.gender === undefined ? undefined : Number(body.gender),
    phone: body.phone === undefined ? undefined : String(body.phone),
    idCard: body.idCard === undefined ? undefined : String(body.idCard),
    address: body.address === undefined ? undefined : String(body.address),
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!item) return useResponseError('客户不存在');
  return useResponseSuccess(item);
});
`,
);

write(
  'customers/[id].delete.ts',
  `
import { eventHandler, getRouterParam } from 'h3';
import { deleteCustomer, ensureBizData } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  if (!id) return useResponseError('参数缺失');
  const ok = deleteCustomer(id);
  if (!ok) return useResponseError('客户不存在');
  return useResponseSuccess(null);
});
`,
);

// ---------------- deceased ----------------
write(
  'deceased/list.ts',
  `
import { eventHandler } from 'h3';
import { ensureBizData, getDeceasedList } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  return useResponseSuccess(getDeceasedList());
});
`,
);

write(
  'deceased/.post.ts',
  `
import { eventHandler, readBody } from 'h3';
import { createDeceased, ensureBizData } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const body = await readBody(event);
  if (!body?.name) {
    return useResponseError('逝者姓名不能为空');
  }
  return useResponseSuccess(createDeceased({
    name: String(body.name),
    gender: Number(body.gender ?? 1) === 2 ? 2 : 1,
    birthDate: body.birthDate ? String(body.birthDate) : undefined,
    deathDate: body.deathDate ? String(body.deathDate) : undefined,
    proofUrl: body.proofUrl ? String(body.proofUrl) : undefined,
    remark: body.remark ? String(body.remark) : undefined,
  }));
});
`,
);

write(
  'deceased/[id].put.ts',
  `
import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, updateDeceased } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body) return useResponseError('参数缺失');
  const item = updateDeceased(id, {
    name: body.name === undefined ? undefined : String(body.name),
    gender: body.gender === undefined ? undefined : Number(body.gender),
    birthDate: body.birthDate === undefined ? undefined : String(body.birthDate),
    deathDate: body.deathDate === undefined ? undefined : String(body.deathDate),
    proofUrl: body.proofUrl === undefined ? undefined : String(body.proofUrl),
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!item) return useResponseError('逝者档案不存在');
  return useResponseSuccess(item);
});
`,
);

write(
  'deceased/[id].delete.ts',
  `
import { eventHandler, getRouterParam } from 'h3';
import { deleteDeceased, ensureBizData } from '~/utils/cemetery-biz-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  if (!id) return useResponseError('参数缺失');
  const ok = deleteDeceased(id);
  if (!ok) return useResponseError('逝者档案不存在');
  return useResponseSuccess(null);
});
`,
);

// ---------------- sales ----------------
write(
  'sales/list.ts',
  `
import { eventHandler, getQuery } from 'h3';
import {
  ensureBizData,
  findCustomerById,
  findPlotById,
  getSales,
} from '~/utils/cemetery-biz-store';
${GUARD}
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const parkId = firstQueryString(query.parkId);
  const status = firstQueryString(query.status);
  const keyword = firstQueryString(query.keyword);
  let list = parkId ? getSales().filter((item) => item.parkId === parkId) : getSales();
  if (status) {
    list = list.filter((item) => item.status === status);
  }
  list = list.map((item) => {
    const customer = findCustomerById(item.customerId);
    const plot = findPlotById(item.plotId);
    return {
      ...item,
      customerName: customer?.name ?? '-',
      customerPhone: customer?.phone ?? '-',
      plotCode: plot?.code ?? '-',
    };
  });
  if (keyword) {
    list = list.filter(
      (item) =>
        item.orderNo.includes(keyword) ||
        item.customerName.includes(keyword) ||
        item.plotCode.includes(keyword),
    );
  }
  return useResponseSuccess(list);
});
`,
);

write(
  'sales/.post.ts',
  `
import { eventHandler, readBody } from 'h3';
import {
  createSale,
  ensureBizData,
} from '~/utils/cemetery-biz-store';
import { findPlotById, updatePlotSaleStatus } from '~/utils/cemetery-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const body = await readBody(event);
  if (!body?.plotId || !body?.customerId) {
    return useResponseError('格位与客户不能为空');
  }
  const plot = findPlotById(String(body.plotId));
  if (!plot) return useResponseError('格位不存在');
  if (plot.buildStatus !== 'built') {
    return useResponseError('该格位尚未建成，不可销售');
  }
  if (plot.saleStatus !== 'idle') {
    return useResponseError('该格位当前状态不可预订');
  }
  const order = createSale({
    parkId: plot.parkId,
    plotId: plot.id,
    customerId: String(body.customerId),
    deposit: Number(body.deposit ?? 0),
    remark: body.remark ? String(body.remark) : undefined,
  });
  // 状态联动：可售 → 已预订
  updatePlotSaleStatus(plot.id, 'reserved');
  return useResponseSuccess(order);
});
`,
);

write(
  'sales/[id]/sign.post.ts',
  `
import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, signSale } from '~/utils/cemetery-biz-store';
import { findPlotById, updatePlotSaleStatus } from '~/utils/cemetery-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body?.contractNo || !body?.totalAmount) {
    return useResponseError('合同编号与总金额不能为空');
  }
  const order = signSale(id, String(body.contractNo), Number(body.totalAmount));
  if (!order) return useResponseError('销售单不存在');
  // 状态联动：已预订 → 已售未安葬
  updatePlotSaleStatus(order.plotId, 'sold');
  return useResponseSuccess(order);
});
`,
);

write(
  'sales/[id]/payments.post.ts',
  `
import { eventHandler, getRouterParam, readBody } from 'h3';
import { addPayment, ensureBizData } from '~/utils/cemetery-biz-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body?.amount || !body?.method) {
    return useResponseError('收款金额与方式不能为空');
  }
  const payment = addPayment(id, {
    amount: Number(body.amount),
    method: String(body.method),
  });
  if (!payment) return useResponseError('销售单不存在');
  return useResponseSuccess(payment);
});
`,
);

write(
  'sales/[id]/refund.post.ts',
  `
import { eventHandler, getRouterParam } from 'h3';
import { ensureBizData, refundSale } from '~/utils/cemetery-biz-store';
import { findPlotById, updatePlotSaleStatus } from '~/utils/cemetery-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  if (!id) return useResponseError('参数缺失');
  const order = refundSale(id);
  if (!order) return useResponseError('销售单不存在');
  // 状态联动：退购 → 可售
  updatePlotSaleStatus(order.plotId, 'idle');
  return useResponseSuccess(order);
});
`,
);

// ---------------- burials ----------------
write(
  'burials/list.ts',
  `
import { eventHandler, getQuery } from 'h3';
import {
  ensureBizData,
  findCustomerById,
  findDeceasedById,
  getBurials,
} from '~/utils/cemetery-biz-store';
${GUARD}
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const parkId = firstQueryString(query.parkId);
  let list = parkId ? getBurials().filter((item) => item.parkId === parkId) : getBurials();
  list = list.map((item) => {
    const deceased = findDeceasedById(item.deceasedId);
    const customer = findCustomerById(item.customerId);
    return {
      ...item,
      deceasedName: deceased?.name ?? '-',
      customerName: customer?.name ?? '-',
    };
  });
  return useResponseSuccess(list);
});
`,
);

write(
  'burials/.post.ts',
  `
import { eventHandler, readBody } from 'h3';
import { createBurial, ensureBizData } from '~/utils/cemetery-biz-store';
import { findPlotById, updatePlotSaleStatus } from '~/utils/cemetery-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const body = await readBody(event);
  if (!body?.plotId || !body?.deceasedId || !body?.customerId || !body?.burialDate) {
    return useResponseError('格位/逝者/购买人/安葬日期不能为空');
  }
  const plot = findPlotById(String(body.plotId));
  if (!plot) return useResponseError('格位不存在');
  if (plot.saleStatus === 'idle' || plot.saleStatus === 'none') {
    return useResponseError('该格位尚未售出，无法登记安葬');
  }
  if (plot.saleStatus === 'occupied') {
    return useResponseError('该格位已安葬');
  }
  const burial = createBurial({
    parkId: plot.parkId,
    plotId: plot.id,
    customerId: String(body.customerId),
    deceasedId: String(body.deceasedId),
    burialDate: String(body.burialDate),
  });
  // 状态联动：已售 → 已安葬（预定落葬）
  updatePlotSaleStatus(plot.id, 'occupied');
  return useResponseSuccess(burial);
});
`,
);

write(
  'burials/[id]/complete.post.ts',
  `
import { eventHandler, getRouterParam } from 'h3';
import { completeBurial, ensureBizData } from '~/utils/cemetery-biz-store';
import { findPlotById, updatePlotSaleStatus } from '~/utils/cemetery-store';
${GUARD}
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const id = getRouterParam(event, 'id');
  if (!id) return useResponseError('参数缺失');
  const burial = completeBurial(id);
  if (!burial) return useResponseError('安葬登记不存在');
  // 状态联动：完成安葬 → 格位已安葬
  updatePlotSaleStatus(burial.plotId, 'occupied');
  return useResponseSuccess(burial);
});
`,
);

console.log('batch done');
