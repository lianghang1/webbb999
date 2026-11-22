import { eventHandler, getRouterParam } from 'h3';
import { deletePlotType, getPlots } from '~/utils/cemetery-store';
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
  const referenced = getPlots().some((item) => item.typeId === id);
  if (referenced) {
    return useResponseError('该墓型已被格位引用，无法删除');
  }
  const removed = deletePlotType(id);
  if (!removed) {
    return useResponseError('墓型不存在');
  }
  return useResponseSuccess(null);
});
