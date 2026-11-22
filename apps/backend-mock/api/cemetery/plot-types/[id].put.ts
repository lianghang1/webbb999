import { eventHandler, getRouterParam, readBody } from 'h3';
import { updatePlotType } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body) {
    return useResponseError('参数缺失');
  }
  const plotType = updatePlotType(id, {
    name: body.name === undefined ? undefined : String(body.name),
    category: body.category === undefined ? undefined : body.category,
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!plotType) {
    return useResponseError('墓型不存在');
  }
  return useResponseSuccess(plotType);
});
