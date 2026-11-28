<script lang="ts" setup>
import type { SysDict } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NDropdown, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { dictApi } from '#/api';

import DictFormModal from './dict-form-modal.vue';
import DictOptionModal from './dict-option-modal.vue';

defineOptions({ name: 'SystemDict' });

interface GridQueryParams {
  form?: { dictCode?: string; dictName?: string; status?: number };
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '编码包含…', clearable: true },
        fieldName: 'dictCode',
        label: '字典编码',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '名称包含…', clearable: true },
        fieldName: 'dictName',
        label: '字典名称',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          options: [
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ],
        },
        fieldName: 'status',
        label: '状态',
      },
    ],
  },
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
      {
        field: 'createTime',
        title: '创建时间',
        width: 155,
        slots: { default: 'createTime' },
      },
      { field: 'remark', title: '备注', minWidth: 180 },
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
        query: async ({ form, page }: GridQueryParams) => {
          const params: Record<string, unknown> = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
          };
          if (form?.dictCode) {
            params.CN_dictCode = form.dictCode;
          }
          if (form?.dictName) {
            params.CN_dictName = form.dictName;
          }
          if (form?.status !== undefined) {
            params.EQ_status = form.status;
          }
          const result = await dictApi.list(params);
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
    content: `确定删除字典「${row.dictName}」吗？其下所有字典项将一并失效。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await dictApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}

const rowActionOptions = [
  { label: '编辑', key: 'edit' },
  { label: '删除', key: 'delete', danger: true },
];

function onRowAction(key: string, row: SysDict) {
  if (key === 'edit') openEdit(row);
  else if (key === 'delete') onDelete(row);
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '—';
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
      <template #createTime="{ row }">
        {{ formatTime(row.createTime) }}
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
        <NDropdown
          :options="rowActionOptions"
          @select="(key: string) => onRowAction(key, row as SysDict)"
        >
          <NButton size="tiny" quaternary>更多 ▾</NButton>
        </NDropdown>
      </template>
    </Grid>
    <DictModal />
    <OptionModal />
  </Page>
</template>
