<script lang="ts" setup>
import type { CemeteryDeceased } from '#/api/cemetery/biz';

import { onMounted } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDeceasedApi, getDeceasedListApi } from '#/api/cemetery/biz';

import DeceasedFormModal from './deceased-form-modal.vue';

defineOptions({ name: 'CemeteryDeceased' });

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', minWidth: 100, title: '姓名' },
      {
        field: 'gender',
        formatter: ({ cellValue }: { cellValue: any }) =>
          cellValue === 2 ? '女' : cellValue === 1 ? '男' : '-',
        title: '性别',
        width: 70,
      },
      { field: 'birthDate', title: '出生日期', width: 120 },
      { field: 'deathDate', title: '逝世日期', width: 120 },
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
          const list = await getDeceasedListApi();
          return { items: list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [DeceasedModal, deceasedModalApi] = useVbenModal({
  connectedComponent: DeceasedFormModal,
});

function openCreate() {
  deceasedModalApi.setData({ onSuccess: () => gridApi.query() });
  deceasedModalApi.open();
}

function openEdit(row: CemeteryDeceased) {
  deceasedModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  deceasedModalApi.open();
}

function onDelete(row: CemeteryDeceased) {
  dialog.warning({
    content: `确定删除逝者「${row.name}」的档案吗？`,
    negativeText: '取消',
    onPositiveClick: async () => {
      const ok = await deleteDeceasedApi(row.id);
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
</script>

<template>
  <Page auto-content-height title="逝者档案">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增档案
        </NButton>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          quaternary
          type="primary"
          @click="openEdit(row as CemeteryDeceased)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          quaternary
          type="error"
          @click="onDelete(row as CemeteryDeceased)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <DeceasedModal />
  </Page>
</template>
