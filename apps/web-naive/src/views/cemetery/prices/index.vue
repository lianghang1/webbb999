<script lang="ts" setup>
import type { CemeteryPrice } from '#/api/cemetery/biz';
import type { CemeteryPlotType } from '#/api/cemetery/types';

import { onMounted, ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePriceApi, getPlotTypeListApi, getPriceListApi } from '#/api';
import { useCemeteryStore } from '#/store';

import PriceFormModal from './price-form-modal.vue';

defineOptions({ name: 'CemeteryPrices' });

const store = useCemeteryStore();
const TYPE_LABELS: Record<string, string> = {
  tomb: '传统墓穴',
  art: '艺术墓',
  lawn: '草坪葬',
  tree: '树葬',
  flower: '花坛葬',
  wall: '壁葬',
  niche: '骨灰堂格位',
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'parkName',
        minWidth: 120,
        title: '园区',
      },
      {
        field: 'typeId',
        minWidth: 130,
        slots: { default: 'type' },
        title: '墓型',
      },
      {
        field: 'price',
        formatter: ({ cellValue }: { cellValue: any }) => `¥${cellValue}`,
        title: '价格',
        width: 120,
      },
      {
        field: 'managementCycleYears',
        formatter: ({ cellValue }: { cellValue: any }) => `${cellValue} 年`,
        title: '管理费周期',
        width: 110,
      },
      { field: 'remark', minWidth: 140, title: '备注' },
      {
        field: 'actions',
        fixed: 'right',
        slots: { default: 'actions' },
        title: '操作',
        width: 160,
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          await store.ensureParks();
          const [list, types] = await Promise.all([
            getPriceListApi(),
            getPlotTypeListApi(),
          ]);
          plotTypes.value = types;
          return {
            items: list.map((item) => ({
              ...item,
              parkName:
                store.parks.find((p) => p.id === item.parkId)?.name ?? '-',
              typeName: TYPE_LABELS[item.typeId] ?? item.typeId,
            })),
            total: list.length,
          };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const plotTypes = ref<CemeteryPlotType[]>([]);

const [PriceModal, priceModalApi] = useVbenModal({
  connectedComponent: PriceFormModal,
});

function openCreate() {
  priceModalApi.setData({ onSuccess: () => gridApi.query() });
  priceModalApi.open();
}

function openEdit(row: CemeteryPrice) {
  priceModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  priceModalApi.open();
}

function onDelete(row: CemeteryPrice) {
  dialog.warning({
    content: '确定删除该价目吗？',
    negativeText: '取消',
    onPositiveClick: async () => {
      const ok = await deletePriceApi(row.id);
      if (ok) {
        message.success('删除成功');
        gridApi.query();
      }
    },
    title: '删除确认',
  });
}

onMounted(() => {
  gridApi.query();
});

watch(
  () => store.currentParkId,
  () => gridApi.query(),
);
</script>

<template>
  <Page auto-content-height title="价目管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增价目
        </NButton>
      </template>
      <template #type="{ row }">
        <NTag size="small" type="info">{{ row.typeName }}</NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          quaternary
          type="primary"
          @click="openEdit(row as CemeteryPrice)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          quaternary
          type="error"
          @click="onDelete(row as CemeteryPrice)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <PriceModal />
  </Page>
</template>
