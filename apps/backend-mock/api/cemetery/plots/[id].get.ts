import { eventHandler, getRouterParam } from 'h3';
import { findPlotById } from '~/utils/cemetery-store';
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
  if (!id) {
    return useResponseError('参数缺失');
  }
  const plot = findPlotById(id);
  if (!plot) {
    return useResponseError('格位不存在');
  }
  return useResponseSuccess(plot);
});
