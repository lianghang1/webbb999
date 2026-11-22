import type { CemeteryPark } from '#/api/cemetery/types';

import { ref } from 'vue';

import { defineStore } from 'pinia';

import { getParkListApi } from '#/api/cemetery';

/**
 * 陵园业务全局状态：当前操作的园区（多园区 SaaS 维度）。
 * 所有陵园业务页面按 currentParkId 过滤数据。
 */
export const useCemeteryStore = defineStore('cemetery', () => {
  const parks = ref<CemeteryPark[]>([]);
  const currentParkId = ref<string>('');
  const parksLoading = ref(false);
  const parksLoaded = ref(false);

  async function loadParks(force = false) {
    if (parksLoaded.value && !force) {
      return;
    }
    try {
      parksLoading.value = true;
      parks.value = await getParkListApi();
      // 当前园区不存在时回落到第一个园区
      if (
        currentParkId.value &&
        !parks.value.some((item) => item.id === currentParkId.value)
      ) {
        currentParkId.value = '';
      }
      if (!currentParkId.value) {
        currentParkId.value = parks.value[0]?.id ?? '';
      }
      parksLoaded.value = true;
    } finally {
      parksLoading.value = false;
    }
  }

  /** 保证园区列表已加载（供页面挂载时调用） */
  async function ensureParks() {
    await loadParks();
  }

  function setCurrentPark(id: string) {
    currentParkId.value = id;
  }

  function $reset() {
    parks.value = [];
    currentParkId.value = '';
    parksLoaded.value = false;
    parksLoading.value = false;
  }

  return {
    $reset,
    currentParkId,
    ensureParks,
    loadParks,
    parks,
    parksLoaded,
    parksLoading,
    setCurrentPark,
  };
});
