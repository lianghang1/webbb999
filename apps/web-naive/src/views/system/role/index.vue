<script lang="ts" setup>
import type { SysRole } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { roleApi } from '#/api';

import MenuAssignModal from '../menu/menu-assign-modal.vue';
import RoleFormModal from './role-form-modal.vue';

defineOptions({ name: 'SystemRole' });

interface GridQueryParams {
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '请输入角色编码或名称' },
        fieldName: 'keyword',
        label: '关键词',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'roleCode', title: '角色编码', width: 140 },
      { field: 'roleName', title: '角色名称', minWidth: 150 },
      { field: 'dataScope', title: '数据范围', width: 110 },
      { field: 'sortNo', title: '排序', width: 80 },
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
        width: 240,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: GridQueryParams) => {
          const result = await roleApi.list({
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

const [RoleModal, roleModalApi] = useVbenModal({
  connectedComponent: RoleFormModal,
});
const [MenuAssignModalComp, menuAssignApi] = useVbenModal({
  connectedComponent: MenuAssignModal,
});

function openCreate() {
  roleModalApi.setData({ onSuccess: () => gridApi.query() });
  roleModalApi.open();
}

function openEdit(row: SysRole) {
  roleModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  roleModalApi.open();
}

function onAssignMenus(row: SysRole) {
  menuAssignApi.setData({ roleId: row.id, tenantId: row.tenantId });
  menuAssignApi.open();
}

function onDelete(row: SysRole) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除角色「${row.roleName}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await roleApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="角色管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增角色
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
          @click="openEdit(row as SysRole)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="info"
          quaternary
          @click="onAssignMenus(row as SysRole)"
        >
          菜单
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysRole)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <RoleModal />
    <MenuAssignModalComp />
  </Page>
</template>
