<script lang="ts" setup>
import type { SysUser } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { userApi } from '#/api';

import UserFormModal from './user-form-modal.vue';
import UserGrantModal from './user-grant-modal.vue';

defineOptions({ name: 'SystemUser' });

interface GridQueryParams {
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '请输入账号或昵称' },
        fieldName: 'keyword',
        label: '关键词',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'username', title: '账号', width: 140 },
      { field: 'nickname', title: '昵称', width: 140 },
      { field: 'mobile', title: '手机号', width: 130 },
      { field: 'email', title: '邮箱', minWidth: 160 },
      { field: 'accountType', title: '账号类型', width: 120 },
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
        width: 240,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: GridQueryParams) => {
          const result = await userApi.list({
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

const [UserModal, userModalApi] = useVbenModal({
  connectedComponent: UserFormModal,
});
const [GrantModal, grantModalApi] = useVbenModal({
  connectedComponent: UserGrantModal,
});

function openCreate() {
  userModalApi.setData({ onSuccess: () => gridApi.query() });
  userModalApi.open();
}

function openEdit(row: SysUser) {
  userModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  userModalApi.open();
}

function openGrant(row: SysUser) {
  grantModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  grantModalApi.open();
}

function onDelete(row: SysUser) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除用户「${row.nickname}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await userApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="用户管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增用户
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
          @click="openEdit(row as SysUser)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="info"
          quaternary
          @click="openGrant(row as SysUser)"
        >
          授权
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysUser)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <UserModal />
    <GrantModal />
  </Page>
</template>
