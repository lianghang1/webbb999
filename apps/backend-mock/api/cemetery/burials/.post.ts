import { eventHandler, readBody } from 'h3';
import { createBurial, ensureBizData } from '~/utils/cemetery-biz-store';
import { findPlotById, updatePlotSaleStatus } from '~/utils/cemetery-store';
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
  const body = await readBody(event);
  if (
    !body?.plotId ||
    !body?.deceasedId ||
    !body?.customerId ||
    !body?.burialDate
  ) {
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
