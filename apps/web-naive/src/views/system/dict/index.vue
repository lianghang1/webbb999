<script lang="ts" setup>
import type { SysDict } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { dictApi } from '#/api';

import DictFormModal from './dict-form-modal.vue';
import DictOptionModal from './dict-option-modal.vue';

defineOptions({ name: 'SystemDict' });

interface GridQueryParams {
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'dictCode', title: '字典编码', width: 160 },
      { field: 'dictName', title: '字典名称', minWidth: 180 },
      {
        field: 'status',
        title: '状态',
        width: 90,
        slots: { default: 'status' },
      },
      { field: 'remark', title: '备注', minWidth: 180 },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 240,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: GridQueryParams) => {
          const result = await dictApi.list({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
          });
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [DictModal, dictModalApi] = useVbenModal({
  connectedComponent: DictFormModal,
});
const [OptionModal, optionModalApi] = useVbenModal({
  connectedComponent: DictOptionModal,
});

function openCreate() {
  dictModalApi.setData({ onSuccess: () => gridApi.query() });
  dictModalApi.open();
}

function openEdit(row: SysDict) {
  dictModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  dictModalApi.open();
}

function openOptions(row: SysDict) {
  optionModalApi.setData({ dict: { ...row } });
  optionModalApi.open();
}

function onDelete(row: SysDict) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除字典「${row.dictName}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await dictApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="字典管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增字典
        </NButton>
      </template>
      <template #status="{ row }">
        <NTag :type="row.status === 1 ? 'success' : 'default'" size="small">
          {{ row.status === 1 ? '启用' : '停用' }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="info"
          quaternary
          @click="openOptions(row as SysDict)"
        >
          字典项
        </NButton>
        <NButton
          size="tiny"
          type="primary"
          quaternary
          @click="openEdit(row as SysDict)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysDict)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <DictModal />
    <OptionModal />
  </Page>
</template>
