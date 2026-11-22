import { eventHandler, getRouterParam, readBody } from 'h3';
import { updatePlotBuildStatus } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

const BUILD_STATUSES = new Set(['building', 'built', 'unbuilt']);

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body?.buildStatus) {
    return useResponseError('参数缺失');
  }
  if (!BUILD_STATUSES.has(String(body.buildStatus))) {
    return useResponseError('建造状态不合法');
  }
  const plot = updatePlotBuildStatus(id, body.buildStatus);
  if (!plot) {
    return useResponseError('格位不存在');
  }
  return useResponseSuccess(plot);
});
