<script lang="ts" setup>
import type { SysMenu } from '#/api/system/types';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { menuApi } from '#/api';

import MenuFormModal from './menu-form-modal.vue';

defineOptions({ name: 'SystemMenu' });

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'menuName', title: '菜单名称', minWidth: 180, treeNode: true },
      { field: 'menuType', title: '类型', width: 80 },
      { field: 'path', title: '路径', width: 160 },
      { field: 'component', title: '组件', width: 200 },
      { field: 'permission', title: '权限标识', width: 180 },
      { field: 'sortNo', title: '排序', width: 80 },
      {
        field: 'visible',
        title: '可见',
        width: 80,
        slots: { default: 'visible' },
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
          const list = await menuApi.tree();
          return { items: list, total: list.length };
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

const [MenuModal, menuModalApi] = useVbenModal({
  connectedComponent: MenuFormModal,
});

function openCreate(parent?: SysMenu) {
  menuModalApi.setData({
    parentId: parent?.id,
    onSuccess: () => gridApi.query(),
  });
  menuModalApi.open();
}

function openEdit(row: SysMenu) {
  menuModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  menuModalApi.open();
}

function onDelete(row: SysMenu) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除菜单「${row.menuName}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await menuApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="菜单管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate()">
          新增菜单
        </NButton>
      </template>
      <template #visible="{ row }">
        <NTag
          :type="row.visible === false ? 'default' : 'success'"
          size="small"
        >
          {{ row.visible === false ? '隐藏' : '显示' }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="primary"
          quaternary
          @click="openCreate(row as SysMenu)"
        >
          新增
        </NButton>
        <NButton
          size="tiny"
          type="info"
          quaternary
          @click="openEdit(row as SysMenu)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as SysMenu)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <MenuModal />
  </Page>
</template>
