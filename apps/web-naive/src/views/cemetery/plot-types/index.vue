<script lang="ts" setup>
import type { CemeteryPlotType } from '#/api/cemetery/types';

import { onMounted } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePlotTypeApi, getPlotTypeListApi } from '#/api';

import PlotTypeFormModal from './plot-type-form-modal.vue';

defineOptions({ name: 'CemeteryPlotTypes' });

const CATEGORY_OPTIONS: Record<string, string> = {
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
      { field: 'name', title: '墓型名称', minWidth: 160 },
      {
        field: 'category',
        title: '类别',
        width: 140,
        slots: { default: 'category' },
      },
      { field: 'remark', title: '备注', minWidth: 200 },
      { field: 'createTime', title: '创建时间', width: 160 },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 160,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getPlotTypeListApi();
          return { items: list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [PlotTypeModal, plotTypeModalApi] = useVbenModal({
  connectedComponent: PlotTypeFormModal,
});

function openCreate() {
  plotTypeModalApi.setData({ onSuccess: () => gridApi.query() });
  plotTypeModalApi.open();
}

function openEdit(row: CemeteryPlotType) {
  plotTypeModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  plotTypeModalApi.open();
}

function onDelete(row: CemeteryPlotType) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除墓型「${row.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const result = await deletePlotTypeApi(row.id);
      if (result) {
        message.success('删除成功');
        gridApi.query();
      }
    },
  });
}

onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <Page auto-content-height title="墓型管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增墓型
        </NButton>
      </template>
      <template #category="{ row }">
        <NTag size="small" type="info">
          {{ CATEGORY_OPTIONS[row.category as string] ?? row.category }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="primary"
          quaternary
          @click="openEdit(row as CemeteryPlotType)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as CemeteryPlotType)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <PlotTypeModal />
  </Page>
</template>
