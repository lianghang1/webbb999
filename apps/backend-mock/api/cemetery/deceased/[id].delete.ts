import { eventHandler, getRouterParam } from 'h3';
import { deleteDeceased, ensureBizData } from '~/utils/cemetery-biz-store';
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
  const ok = deleteDeceased(id);
  if (!ok) return useResponseError('逝者档案不存在');
  return useResponseSuccess(null);
});
