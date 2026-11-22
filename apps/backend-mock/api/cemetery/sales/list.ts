import { eventHandler, getQuery } from 'h3';
import {
  ensureBizData,
  findCustomerById,
  getSales,
} from '~/utils/cemetery-biz-store';
import { findPlotById } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
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
  let list = parkId
    ? getSales().filter((item) => item.parkId === parkId)
    : getSales();
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
        (item.customerName ?? '').includes(keyword) ||
        (item.plotCode ?? '').includes(keyword),
    );
  }
  return useResponseSuccess(list);
});
