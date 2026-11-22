import { eventHandler, getRouterParam } from 'h3';
import { deletePark, getSections } from '~/utils/cemetery-store';
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
  const hasSections = getSections().some((item) => item.parkId === id);
  if (hasSections) {
    return useResponseError('该园区下存在墓区，无法删除');
  }
  const removed = deletePark(id);
  if (!removed) {
    return useResponseError('园区不存在');
  }
  return useResponseSuccess(null);
});
