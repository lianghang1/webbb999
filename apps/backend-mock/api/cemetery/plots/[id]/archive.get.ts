import { eventHandler, getRouterParam } from 'h3';
import {
  ensureBizData,
  findBurialByPlotLatest,
  findCustomerById,
  findDeceasedById,
  findSaleByPlotLatest,
  getMaintenanceFeesByPlot,
  getPaymentsByOrder,
} from '~/utils/cemetery-biz-store';
import { findPlotById } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

/**
 * 格位全档案（详情抽屉聚合接口）：
 * 格位 + 购墓订单（含收款）+ 申请人 + 使用人（逝者）+ 安葬 + 维护费记录。
 */
export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  ensureBizData();
  const id = getRouterParam(event, 'id');
  if (!id) {
    return useResponseError('参数缺失');
  }
  const plot = findPlotById(id);
  if (!plot) {
    return useResponseError('格位不存在');
  }

  const sale = findSaleByPlotLatest(id);
  const customer = sale ? findCustomerById(sale.customerId) : undefined;
  const payments = sale ? getPaymentsByOrder(sale.id) : [];
  const burial = findBurialByPlotLatest(id);
  const deceased = burial ? findDeceasedById(burial.deceasedId) : undefined;
  const maintenanceFees = getMaintenanceFeesByPlot(id);

  return useResponseSuccess({
    burial,
    customer,
    deceased,
    maintenanceFees,
    payments,
    plot,
    sale,
  });
});
