<script lang="ts" setup>
import type { SysConfig } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { configApi } from '#/api';

import ConfigFormModal from './config-form-modal.vue';

defineOptions({ name: 'SystemConfig' });

interface GridQueryParams {
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'configKey', title: '参数键', width: 180 },
      { field: 'configName', title: '参数名称', minWidth: 160 },
      { field: 'configGroup', title: '分组', width: 130 },
      { field: 'configValue', title: '参数值', minWidth: 180 },
      { field: 'valueType', title: '值类型', width: 100 },
      {
        field: 'sensitive',
        title: '敏感',
        width: 80,
        slots: { default: 'sensitive' },
      },
      { field: 'remark', title: '备注', minWidth: 140 },
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
        query: async ({ page }: GridQueryParams) => {
          const result = await configApi.list({
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

const [ConfigModal, configModalApi] = useVbenModal({
  connectedComponent: ConfigFormModal,
});

function openCreate() {
  configModalApi.setData({ onSuccess: () => gridApi.query() });
  configModalApi.open();
}

function openEdit(row: SysConfig) {
  configModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  configModalApi.open();
}

function onDelete(row: SysConfig) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除参数「${row.configKey}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await configApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="参数配置">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增参数
        </NButton>
      </template>
      <template #sensitive="{ row }">
        <NTag :type="row.sensitive ? 'warning' : 'default'" size="small">
          {{ row.sensitive ? '是' : '否' }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="primary"
          quaternary
          @click="openEdit(row as SysConfig)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysConfig)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <ConfigModal />
  </Page>
</template>
