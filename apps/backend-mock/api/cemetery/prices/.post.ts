import { eventHandler, readBody } from 'h3';
import { createPrice, ensureBizData } from '~/utils/cemetery-biz-store';
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
  if (!body?.parkId || !body?.typeId || !body?.price) {
    return useResponseError('园区/墓型/价格不能为空');
  }
  return useResponseSuccess(
    createPrice({
      parkId: String(body.parkId),
      typeId: String(body.typeId),
      price: Number(body.price),
      managementCycleYears: Number(body.managementCycleYears ?? 20),
      remark: body.remark ? String(body.remark) : undefined,
    }),
  );
});
