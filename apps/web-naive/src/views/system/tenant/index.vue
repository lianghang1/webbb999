<script lang="ts" setup>
import type { SysTenant } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { tenantApi } from '#/api';

import TenantFormModal from './tenant-form-modal.vue';

defineOptions({ name: 'SystemTenant' });

interface GridQueryParams {
  form?: Record<string, unknown>;
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '请输入租户编码或名称' },
        fieldName: 'keyword',
        label: '关键词',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'tenantCode', title: '租户编码', width: 140 },
      { field: 'tenantName', title: '租户名称', minWidth: 160 },
      { field: 'expireTime', title: '过期时间', width: 120 },
      {
        field: 'status',
        title: '状态',
        width: 90,
        slots: { default: 'status' },
      },
      { field: 'remark', title: '备注', minWidth: 160 },
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
          const result = await tenantApi.list({
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

const [TenantModal, tenantModalApi] = useVbenModal({
  connectedComponent: TenantFormModal,
});

function openCreate() {
  tenantModalApi.setData({ onSuccess: () => gridApi.query() });
  tenantModalApi.open();
}

function openEdit(row: SysTenant) {
  tenantModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  tenantModalApi.open();
}

function onDelete(row: SysTenant) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除租户「${row.tenantName}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await tenantApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="租户管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增租户
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
          type="primary"
          quaternary
          @click="openEdit(row as SysTenant)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysTenant)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <TenantModal />
  </Page>
</template>
