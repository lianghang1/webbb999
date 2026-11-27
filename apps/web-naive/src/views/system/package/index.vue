<script lang="ts" setup>
import type { SysTenantPackage } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { packageApi } from '#/api';

import MenuAssignModal from '../menu/menu-assign-modal.vue';
import PackageFormModal from './package-form-modal.vue';

defineOptions({ name: 'SystemPackage' });

interface GridQueryParams {
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '请输入套餐编码或名称' },
        fieldName: 'keyword',
        label: '关键词',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'packageCode', title: '套餐编码', width: 140 },
      { field: 'packageName', title: '套餐名称', minWidth: 160 },
      {
        field: 'status',
        title: '状态',
        width: 90,
        slots: { default: 'status' },
      },
      { field: 'remark', title: '备注', minWidth: 200 },
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
          const result = await packageApi.list({
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

const [PackageModal, packageModalApi] = useVbenModal({
  connectedComponent: PackageFormModal,
});
const [MenuAssignModalComp, menuAssignApi] = useVbenModal({
  connectedComponent: MenuAssignModal,
});

function openCreate() {
  packageModalApi.setData({ onSuccess: () => gridApi.query() });
  packageModalApi.open();
}

function openEdit(row: SysTenantPackage) {
  packageModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  packageModalApi.open();
}

function onDelete(row: SysTenantPackage) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除套餐「${row.packageName}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await packageApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}

function onAssignMenus(row: SysTenantPackage) {
  menuAssignApi.setData({ packageId: row.id });
  menuAssignApi.open();
}
</script>

<template>
  <Page auto-content-height title="套餐管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增套餐
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
          @click="openEdit(row as SysTenantPackage)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="info"
          quaternary
          @click="onAssignMenus(row as SysTenantPackage)"
        >
          菜单
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysTenantPackage)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <PackageModal />
    <MenuAssignModalComp />
  </Page>
</template>
