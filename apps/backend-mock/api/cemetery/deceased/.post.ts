import { eventHandler, readBody } from 'h3';
import { createDeceased, ensureBizData } from '~/utils/cemetery-biz-store';
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
  if (!body?.name) {
    return useResponseError('逝者姓名不能为空');
  }
  return useResponseSuccess(
    createDeceased({
      name: String(body.name),
      gender: Number(body.gender ?? 1) === 2 ? 2 : 1,
      birthDate: body.birthDate ? String(body.birthDate) : undefined,
      deathDate: body.deathDate ? String(body.deathDate) : undefined,
      proofUrl: body.proofUrl ? String(body.proofUrl) : undefined,
      remark: body.remark ? String(body.remark) : undefined,
    }),
  );
});
