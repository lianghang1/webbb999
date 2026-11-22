import { eventHandler, getRouterParam } from 'h3';
import { completeBurial, ensureBizData } from '~/utils/cemetery-biz-store';
import { updatePlotSaleStatus } from '~/utils/cemetery-store';
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
  if (!id) return useResponseError('参数缺失');
  const burial = completeBurial(id);
  if (!burial) return useResponseError('安葬登记不存在');
  // 状态联动：完成安葬 → 格位已安葬
  updatePlotSaleStatus(burial.plotId, 'occupied');
  return useResponseSuccess(burial);
});
