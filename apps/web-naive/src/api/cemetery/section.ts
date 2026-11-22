import type { CemeterySection, GeneratePlotsParams } from './types';

import { requestClient } from '#/api/request';

export namespace SectionApi {
  export interface AddParams {
    code: string;
    name: string;
    parentId?: null | string;
    parkId: string;
    remark?: string;
    sort?: number;
  }

  export interface UpdateParams {
    code?: string;
    name?: string;
    remark?: string;
    sort?: number;
  }
}

export async function getSectionListApi(parkId?: string) {
  return requestClient.get<CemeterySection[]>('/cemetery/sections/list', {
    params: { parkId },
  });
}

export async function createSectionApi(data: SectionApi.AddParams) {
  return requestClient.post<CemeterySection>('/cemetery/sections', data);
}

export async function updateSectionApi(
  id: string,
  data: SectionApi.UpdateParams,
) {
  return requestClient.put<CemeterySection>(`/cemetery/sections/${id}`, data);
}

export async function deleteSectionApi(id: string) {
  return requestClient.delete(`/cemetery/sections/${id}`);
}

/** 在叶子墓区批量规划格位 */
export async function generatePlotsApi(
  sectionId: string,
  data: GeneratePlotsParams,
) {
  return requestClient.post<{ count: number }>(
    `/cemetery/sections/${sectionId}/generate-plots`,
    data,
  );
}
