import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, updateDeceased } from '~/utils/cemetery-biz-store';
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
  const body = await readBody(event);
  if (!id || !body) return useResponseError('参数缺失');
  const item = updateDeceased(id, {
    name: body.name === undefined ? undefined : String(body.name),
    gender:
      body.gender === undefined ? undefined : Number(body.gender) === 2 ? 2 : 1,
    birthDate:
      body.birthDate === undefined ? undefined : String(body.birthDate),
    deathDate:
      body.deathDate === undefined ? undefined : String(body.deathDate),
    proofUrl: body.proofUrl === undefined ? undefined : String(body.proofUrl),
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!item) return useResponseError('逝者档案不存在');
  return useResponseSuccess(item);
});
