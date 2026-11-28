<script lang="ts" setup>
import type { SysTenantPackage } from '#/api/system/types';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NDropdown, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { packageApi } from '#/api';

import MenuAssignModal from '../menu/menu-assign-modal.vue';
import PackageFormModal from './package-form-modal.vue';

defineOptions({ name: 'SystemPackage' });

interface GridQueryParams {
  form?: { packageName?: string; packageCode?: string; status?: number };
  page: { currentPage: number; pageSize: number };
}

const totalText = ref('共 0 条');

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '套餐名称包含…', clearable: true },
        fieldName: 'packageName',
        label: '套餐名称',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '套餐编码包含…', clearable: true },
        fieldName: 'packageCode',
        label: '套餐编码',
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
      { field: 'packageCode', title: '套餐编码', width: 130 },
      { field: 'packageName', title: '套餐名称', minWidth: 150 },
      {
        field: 'menuCount',
        title: '菜单数',
        width: 85,
        slots: { default: 'menuCount' },
      },
      {
        field: 'tenantCount',
        title: '开通租户',
        width: 90,
        slots: { default: 'tenantCount' },
      },
      {
        field: 'status',
        title: '状态',
        width: 80,
        slots: { default: 'status' },
      },
      {
        field: 'createTime',
        title: '创建时间',
        width: 155,
        slots: { default: 'createTime' },
      },
      { field: 'remark', title: '备注', minWidth: 160 },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 130,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ form, page }: GridQueryParams) => {
          const params: Record<string, unknown> = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            sort: 'createTime',
            order: 'desc',
          };
          if (form?.packageName) params.CN_packageName = form.packageName;
          if (form?.packageCode) params.CN_packageCode = form.packageCode;
          if (form?.status !== undefined) params.EQ_status = form.status;
          const result = await packageApi.listByPlan(params);
          totalText.value = `共 ${result.total} 条`;
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    stripe: true,
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

function onAssignMenus(row: SysTenantPackage) {
  menuAssignApi.setData({ packageId: row.id });
  menuAssignApi.open();
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

const rowActionOptions = [
  { label: '菜单授权', key: 'menus' },
  { label: '编辑', key: 'edit' },
  { label: '删除', key: 'delete', danger: true },
];

function onRowAction(key: string, row: SysTenantPackage) {
  if (key === 'menus') onAssignMenus(row);
  else if (key === 'edit') openEdit(row);
  else if (key === 'delete') onDelete(row);
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '—';
}
</script>

<template>
  <Page auto-content-height title="套餐管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增套餐
        </NButton>
        <span class="text-xs text-muted-foreground self-center">{{
          totalText
        }}</span>
      </template>
      <template #menuCount="{ row }">
        <span :class="row.menuCount ? '' : 'text-muted-foreground'">{{
          row.menuCount ?? 0
        }}</span>
      </template>
      <template #tenantCount="{ row }">
        <span :class="row.tenantCount ? '' : 'text-muted-foreground'">{{
          row.tenantCount ?? 0
        }}</span>
      </template>
      <template #status="{ row }">
        <NTag
          :type="row.status === 1 ? 'success' : 'default'"
          size="small"
          :bordered="false"
        >
          {{ row.status === 1 ? '启用' : '停用' }}
        </NTag>
      </template>
      <template #createTime="{ row }">
        {{ formatTime(row.createTime) }}
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="primary"
          quaternary
          @click="onAssignMenus(row as SysTenantPackage)"
        >
          菜单
        </NButton>
        <NDropdown
          :options="rowActionOptions"
          @select="(key: string) => onRowAction(key, row as SysTenantPackage)"
        >
          <NButton size="tiny" quaternary>更多 ▾</NButton>
        </NDropdown>
      </template>
    </Grid>
    <PackageModal />
    <MenuAssignModalComp />
  </Page>
</template>
