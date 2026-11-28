<script lang="ts" setup>
import type { SysMenu } from '#/api/system/types';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NDropdown, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { menuApi } from '#/api';

import MenuFormModal from './menu-form-modal.vue';

defineOptions({ name: 'SystemMenu' });

const TYPE_LABEL: Record<string, string> = { M: '目录', C: '菜单', F: '按钮' };
const TYPE_COLOR: Record<string, string> = {
  M: 'warning',
  C: 'primary',
  F: 'default',
};
const SCOPE_LABEL: Record<string, string> = {
  PLATFORM: '平台',
  TENANT: '租户',
  COMMON: '通用',
};

interface GridQueryParams {
  form?: { keyword?: string; menuType?: string; menuScope?: string };
}

/** 树形本地过滤：保留命中节点及其祖先 */
function filterTree(
  nodes: SysMenu[],
  form?: GridQueryParams['form'],
): SysMenu[] {
  const kw = form?.keyword?.trim();
  const result: SysMenu[] = [];
  for (const n of nodes ?? []) {
    const children = filterTree(n.children ?? [], form);
    const typeOk = !form?.menuType || n.menuType === form.menuType;
    const scopeOk = !form?.menuScope || n.menuScope === form.menuScope;
    const kwOk =
      !kw || n.menuName.includes(kw) || (n.permission ?? '').includes(kw);
    if ((kwOk && typeOk && scopeOk) || children.length > 0) {
      result.push({ ...n, children });
    }
  }
  return result;
}

const totalCount = ref(0);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '名称/权限标识包含…', clearable: true },
        fieldName: 'keyword',
        label: '关键字',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          placeholder: '全部类型',
          options: [
            { label: '目录', value: 'M' },
            { label: '菜单', value: 'C' },
            { label: '按钮', value: 'F' },
          ],
        },
        fieldName: 'menuType',
        label: '类型',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          placeholder: '全部范围',
          options: [
            { label: '平台', value: 'PLATFORM' },
            { label: '租户', value: 'TENANT' },
            { label: '通用', value: 'COMMON' },
          ],
        },
        fieldName: 'menuScope',
        label: '范围',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'menuName', title: '菜单名称', minWidth: 180, treeNode: true },
      {
        field: 'menuType',
        title: '类型',
        width: 90,
        slots: { default: 'menuType' },
      },
      {
        field: 'menuScope',
        title: '范围',
        width: 90,
        slots: { default: 'menuScope' },
      },
      { field: 'path', title: '路由路径', width: 160 },
      { field: 'component', title: '组件', width: 180 },
      { field: 'permission', title: '权限标识', width: 160 },
      { field: 'apiPattern', title: 'URL规则', width: 180 },
      { field: 'sortNo', title: '排序', width: 70 },
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
        width: 130,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ form }: GridQueryParams) => {
          const list = await menuApi.tree();
          totalCount.value = list.length;
          return { items: filterTree(list, form), total: list.length };
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
    stripe: true,
  },
});

const [MenuModal, menuModalApi] = useVbenModal({
  connectedComponent: MenuFormModal,
});

function openCreate(parent?: SysMenu) {
  menuModalApi.setData({
    parentId:
      parent?.id === null || parent?.id === undefined
        ? undefined
        : String(parent.id),
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
    content: `确定删除菜单「${row.menuName}」吗？${row.children?.length ? '（该菜单有子项，删除会被拒绝）' : ''}`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await menuApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}

const rowActionOptions = [
  { label: '新增下级', key: 'create' },
  { label: '编辑', key: 'edit' },
  { label: '删除', key: 'delete', danger: true },
];

function onRowAction(key: string, row: SysMenu) {
  if (key === 'create') openCreate(row);
  else if (key === 'edit') openEdit(row);
  else if (key === 'delete') onDelete(row);
}
</script>

<template>
  <Page auto-content-height title="菜单管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate()">
          新增菜单
        </NButton>
        <span class="text-xs text-muted-foreground self-center">共 {{ totalCount }} 项</span>
      </template>
      <template #menuType="{ row }">
        <NTag
          :type="(TYPE_COLOR[row.menuType] as any) ?? 'default'"
          size="small"
          :bordered="false"
        >
          {{ TYPE_LABEL[row.menuType] ?? row.menuType }}
        </NTag>
      </template>
      <template #menuScope="{ row }">
        <NTag size="small" :bordered="false">
          {{ SCOPE_LABEL[row.menuScope ?? ''] ?? row.menuScope ?? '—' }}
        </NTag>
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
          @click="openEdit(row as SysMenu)"
        >
          编辑
        </NButton>
        <NDropdown
          :options="rowActionOptions"
          @select="(key: string) => onRowAction(key, row as SysMenu)"
        >
          <NButton size="tiny" quaternary>更多 ▾</NButton>
        </NDropdown>
      </template>
    </Grid>
    <MenuModal />
  </Page>
</template>
