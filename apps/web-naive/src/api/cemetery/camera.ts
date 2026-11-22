import type { CemeteryCamera } from './types';

import { requestClient } from '#/api/request';

export async function getCameraListApi(parkId?: string) {
  return requestClient.get<CemeteryCamera[]>('/cemetery/cameras/list', {
    params: { parkId },
  });
}
