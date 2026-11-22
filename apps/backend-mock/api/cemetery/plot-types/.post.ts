import { eventHandler, readBody } from 'h3';
import { createPlotType } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

const CATEGORIES = new Set([
  'art',
  'flower',
  'lawn',
  'niche',
  'tomb',
  'tree',
  'wall',
]);

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const body = await readBody(event);
  if (!body?.name || !body?.category) {
    return useResponseError('墓型名称与类别不能为空');
  }
  if (!CATEGORIES.has(String(body.category))) {
    return useResponseError('墓型类别不合法');
  }
  const plotType = createPlotType({
    name: String(body.name),
    category: body.category,
    remark: body.remark ? String(body.remark) : undefined,
  });
  return useResponseSuccess(plotType);
});
