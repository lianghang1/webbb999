<script lang="ts" setup>
import type { DeptTreeNode } from '#/api/system/types';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { NButton, NDropdown, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deptApi, tenantApi, userApi } from '#/api';

import DeptFormModal from './dept-form-modal.vue';

defineOptions({ name: 'SystemDept' });

const userStore = useUserStore();
const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);

const tenantMap = ref<Record<string, string>>({});
const userMap = ref<Record<string, string>>({});

onMounted(async () => {
  const users = await userApi.list({ pageNum: 1, pageSize: -1 });
  userMap.value = Object.fromEntries(
    users.list.map((u) => [String(u.id), u.nickname || u.username]),
  );
  if (isPlatformAdmin.value) {
    const tenants = await tenantApi.list({ pageNum: 1, pageSize: -1 });
    tenantMap.value = Object.fromEntries(
      tenants.list.map((t) => [String(t.id), t.tenantName]),
    );
  }
});

interface GridQueryParams {
  form?: { keyword?: string; status?: number };
}

/** 树形本地过滤：保留命中节点及其祖先 */
function filterTree(
  nodes: DeptTreeNode[],
  form?: GridQueryParams['form'],
): DeptTreeNode[] {
  const kw = form?.keyword?.trim();
  const result: DeptTreeNode[] = [];
  for (const n of nodes ?? []) {
    const children = filterTree(n.children ?? [], form);
    const kwOk = !kw || n.deptName.includes(kw);
    const statusOk = form?.status === undefined || n.status === form.status;
    if ((kwOk && statusOk) || children.length > 0) {
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
        componentProps: { placeholder: '部门名称包含…', clearable: true },
        fieldName: 'keyword',
        label: '部门名称',
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
      { field: 'deptName', title: '部门名称', minWidth: 200, treeNode: true },
      {
        field: 'userCount',
        title: '人数',
        width: 80,
        slots: { default: 'userCount' },
      },
      ...(isPlatformAdmin.value
        ? [
            {
              field: 'tenantId',
              title: '所属租户',
              width: 120,
              slots: { default: 'tenantId' },
            },
          ]
        : []),
      {
        field: 'leaderId',
        title: '负责人',
        width: 120,
        slots: { default: 'leaderId' },
      },
      { field: 'sortNo', title: '排序', width: 70 },
      {
        field: 'status',
        title: '状态',
        width: 80,
        slots: { default: 'status' },
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
          const tree = await deptApi.tree();
          const flat = flatten(tree);
          totalCount.value = flat.length;
          return { items: filterTree(tree, form), total: flat.length };
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

function flatten(nodes: DeptTreeNode[]): DeptTreeNode[] {
  const out: DeptTreeNode[] = [];
  for (const n of nodes ?? []) {
    out.push(n, ...flatten(n.children ?? []));
  }
  return out;
}

const [DeptModal, deptModalApi] = useVbenModal({
  connectedComponent: DeptFormModal,
});

function openCreate(parent?: DeptTreeNode) {
  deptModalApi.setData({
    parentId:
      parent?.id === null || parent?.id === undefined
        ? undefined
        : String(parent.id),
    onSuccess: () => gridApi.query(),
  });
  deptModalApi.open();
}

function openEdit(row: DeptTreeNode) {
  deptModalApi.setData({
    record: { ...row } as any,
    onSuccess: () => gridApi.query(),
  });
  deptModalApi.open();
}

function onDelete(row: DeptTreeNode) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除部门「${row.deptName}」吗？${row.children?.length ? '（有下级部门，删除会被拒绝）' : ''}`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deptApi.delete(row.id);
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

function onRowAction(key: string, row: DeptTreeNode) {
  if (key === 'create') openCreate(row);
  else if (key === 'edit') openEdit(row);
  else if (key === 'delete') onDelete(row);
}
</script>

<template>
  <Page auto-content-height title="部门管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate()">
          新增部门
        </NButton>
        <span class="text-xs text-muted-foreground self-center">共 {{ totalCount }} 个部门</span>
      </template>
      <template #userCount="{ row }">
        <span :class="row.userCount ? '' : 'text-muted-foreground'">{{
          row.userCount ?? 0
        }}</span>
      </template>
      <template #tenantId="{ row }">
        <span v-if="tenantMap[String(row.tenantId)]">{{
          tenantMap[String(row.tenantId)]
        }}</span>
        <span v-else class="text-muted-foreground">—</span>
      </template>
      <template #leaderId="{ row }">
        <span v-if="userMap[String(row.leaderId)]">{{
          userMap[String(row.leaderId)]
        }}</span>
        <span v-else class="text-muted-foreground">未指定</span>
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
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="primary"
          quaternary
          @click="openEdit(row as DeptTreeNode)"
        >
          编辑
        </NButton>
        <NDropdown
          :options="rowActionOptions"
          @select="(key: string) => onRowAction(key, row as DeptTreeNode)"
        >
          <NButton size="tiny" quaternary>更多 ▾</NButton>
        </NDropdown>
      </template>
    </Grid>
    <DeptModal />
  </Page>
</template>
