<script lang="ts" setup>
import type { SysDept } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deptApi } from '#/api';

import DeptFormModal from './dept-form-modal.vue';

defineOptions({ name: 'SystemDept' });

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'deptName', title: '部门名称', minWidth: 180, treeNode: true },
      { field: 'tenantId', title: '租户ID', width: 140 },
      { field: 'leaderId', title: '负责人ID', width: 140 },
      { field: 'sortNo', title: '排序', width: 80 },
      {
        field: 'status',
        title: '状态',
        width: 90,
        slots: { default: 'status' },
      },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 200,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          const result = await deptApi.list({ pageNum: 1, pageSize: -1 });
          return { items: result.list, total: result.total };
        },
      },
    },
    treeConfig: {
      rowField: 'id',
      parentField: 'parentId',
      childrenField: 'children',
      transform: true,
    },
    rowConfig: { keyField: 'id' },
  },
});

const [DeptModal, deptModalApi] = useVbenModal({
  connectedComponent: DeptFormModal,
});

function openCreate(parent?: SysDept) {
  deptModalApi.setData({
    parentId: parent?.id,
    onSuccess: () => gridApi.query(),
  });
  deptModalApi.open();
}

function openEdit(row: SysDept) {
  deptModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  deptModalApi.open();
}

function onDelete(row: SysDept) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除部门「${row.deptName}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deptApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="部门管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate()">
          新增部门
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
          @click="openCreate(row as SysDept)"
        >
          新增
        </NButton>
        <NButton
          size="tiny"
          type="info"
          quaternary
          @click="openEdit(row as SysDept)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysDept)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <DeptModal />
  </Page>
</template>
