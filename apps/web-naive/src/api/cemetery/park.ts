import type { CemeteryPark } from './types';

import { requestClient } from '#/api/request';

export namespace ParkApi {
  export interface AddParams {
    address?: string;
    code: string;
    contact?: string;
    name: string;
    phone?: string;
    remark?: string;
    status?: 0 | 1;
  }

  export interface UpdateParams extends Partial<AddParams> {}
}

export async function getParkListApi() {
  return requestClient.get<CemeteryPark[]>('/cemetery/parks/list');
}

export async function createParkApi(data: ParkApi.AddParams) {
  return requestClient.post<CemeteryPark>('/cemetery/parks', data);
}

export async function updateParkApi(id: string, data: ParkApi.UpdateParams) {
  return requestClient.put<CemeteryPark>(`/cemetery/parks/${id}`, data);
}

export async function deleteParkApi(id: string) {
  return requestClient.delete(`/cemetery/parks/${id}`);
}
