<script lang="ts" setup>
import type { SysRole } from '#/api/system/types';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { NButton, NDropdown, NSwitch, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { roleApi, tenantApi } from '#/api';

import MenuAssignModal from '../menu/menu-assign-modal.vue';
import RoleFormModal from './role-form-modal.vue';

defineOptions({ name: 'SystemRole' });

const userStore = useUserStore();
/** 平台超管：可跨租户查看/分配；租户管理员仅限本租户 */
const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);

interface GridQueryParams {
  form?: {
    roleName?: string;
    roleCode?: string;
    dataScope?: string;
    status?: number;
    tenantId?: string;
  };
  page: { currentPage: number; pageSize: number };
}

const tenantOptions = ref<{ label: string; value: string }[]>([]);
const totalText = ref('共 0 条');

async function loadTenants() {
  if (!isPlatformAdmin.value) {
    return;
  }
  const page = await tenantApi.list({ pageNum: 1, pageSize: -1 });
  tenantOptions.value = page.list.map((t) => ({
    label: t.tenantName,
    value: String(t.id),
  }));
}
onMounted(loadTenants);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '角色名称包含…', clearable: true },
        fieldName: 'roleName',
        label: '角色名称',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '角色编码包含…', clearable: true },
        fieldName: 'roleCode',
        label: '角色编码',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          placeholder: '全部数据范围',
          options: [
            { label: '全部数据', value: 'ALL' },
            { label: '自定义部门', value: 'DEPT_CUSTOM' },
            { label: '仅本部门', value: 'DEPT_ONLY' },
            { label: '本部门及子部门', value: 'DEPT_AND_CHILD' },
            { label: '仅本人', value: 'SELF' },
          ],
        },
        fieldName: 'dataScope',
        label: '数据范围',
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
      ...(isPlatformAdmin.value
        ? [
            {
              component: 'Select',
              componentProps: () => ({
                clearable: true,
                filterable: true,
                options: tenantOptions.value,
                placeholder: '全部租户',
              }),
              fieldName: 'tenantId',
              label: '租户',
            },
          ]
        : []),
    ],
  },
  gridOptions: {
    stripe: true,
    checkboxConfig: { range: true, highlight: true },
    columns: [
      { type: 'checkbox', width: 46 },
      { field: 'roleCode', title: '角色编码', width: 140 },
      {
        field: 'roleName',
        title: '角色名称',
        minWidth: 150,
        slots: { default: 'roleName' },
      },
      ...(isPlatformAdmin.value
        ? [
            {
              field: 'tenantName',
              title: '所属租户',
              width: 120,
              slots: { default: 'tenantName' },
            },
          ]
        : []),
      {
        field: 'dataScope',
        title: '数据范围',
        width: 120,
        slots: { default: 'dataScope' },
      },
      {
        field: 'userCount',
        title: '用户数',
        width: 80,
        slots: { default: 'userCount' },
      },
      { field: 'menuCount', title: '菜单数', width: 80 },
      { field: 'sortNo', title: '排序', width: 70 },
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
          if (form?.roleName) {
            params.CN_roleName = form.roleName;
          }
          if (form?.roleCode) {
            params.CN_roleCode = form.roleCode;
          }
          if (form?.dataScope) {
            params.EQ_dataScope = form.dataScope;
          }
          if (form?.status !== undefined) {
            params.EQ_status = form.status;
          }
          if (form?.tenantId) {
            params.EQ_tenantId = form.tenantId;
          }
          const result = await roleApi.listByPlan(params);
          const enabled = (result.list as SysRole[]).filter(
            (i) => i.status === 1,
          ).length;
          totalText.value = `共 ${result.total} 条 · 本页启用 ${enabled}`;
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

async function toggleStatus(row: SysRole) {
  const next = row.status === 1 ? 0 : 1;
  await roleApi.changeStatus({ ids: [row.id], status: next });
  message.success(next === 1 ? '已启用' : '已停用');
  gridApi.query();
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

async function onBatchStatus(status: number) {
  const rows = gridApi.grid.getCheckboxRecords() as SysRole[];
  if (rows.length === 0) {
    message.warning('请先选择角色');
    return;
  }
  await roleApi.changeStatus({ ids: rows.map((r) => r.id), status });
  message.success(`已${status === 1 ? '启用' : '停用'} ${rows.length} 个角色`);
  gridApi.query();
}

function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords() as SysRole[];
  if (rows.length === 0) {
    message.warning('请先选择角色');
    return;
  }
  dialog.warning({
    title: '批量删除确认',
    content: `确定删除选中的 ${rows.length} 个角色吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await Promise.all(rows.map((r) => roleApi.delete(r.id)));
      message.success(`已删除 ${rows.length} 个角色`);
      gridApi.query();
    },
  });
}

const rowActionOptions = [
  { label: '菜单授权', key: 'menus' },
  { label: '删除', key: 'delete', danger: true },
];

function onRowAction(key: string, row: SysRole) {
  if (key === 'menus') onAssignMenus(row);
  else if (key === 'delete') onDelete(row);
}

const batchActions = [
  { label: '批量启用', key: 'enable' },
  { label: '批量停用', key: 'disable' },
  { label: '批量删除', key: 'delete', danger: true },
];

function onBatchAction(key: string) {
  if (key === 'enable') onBatchStatus(1);
  else if (key === 'disable') onBatchStatus(0);
  else if (key === 'delete') onBatchDelete();
}

const DATA_SCOPE_LABEL: Record<string, string> = {
  ALL: '全部数据',
  DEPT_CUSTOM: '自定义部门',
  DEPT_ONLY: '仅本部门',
  DEPT_AND_CHILD: '本部门及子部门',
  SELF: '仅本人',
};

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '—';
}
</script>

<template>
  <Page auto-content-height title="角色管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增角色
        </NButton>
        <NDropdown :options="batchActions" @select="onBatchAction">
          <NButton size="small">批量操作 ▾</NButton>
        </NDropdown>
        <span class="text-xs text-muted-foreground self-center">{{
          totalText
        }}</span>
      </template>
      <template #roleName="{ row }">
        <span>{{ row.roleName }}</span>
        <NTag v-if="row.builtIn" size="tiny" class="ml-1" :bordered="false">
          内置
        </NTag>
      </template>
      <template #tenantName="{ row }">
        <span v-if="row.tenantName">{{ row.tenantName }}</span>
        <span v-else class="text-muted-foreground">—</span>
      </template>
      <template #dataScope="{ row }">
        <NTag size="small" :bordered="false">
          {{ DATA_SCOPE_LABEL[row.dataScope ?? ''] ?? row.dataScope }}
        </NTag>
      </template>
      <template #userCount="{ row }">
        <span :class="row.userCount ? '' : 'text-muted-foreground'">{{
          row.userCount ?? 0
        }}</span>
      </template>
      <template #status="{ row }">
        <NSwitch
          :value="row.status === 1"
          :disabled="!!row.builtIn"
          @update:value="toggleStatus(row as SysRole)"
        />
      </template>
      <template #createTime="{ row }">
        {{ formatTime(row.createTime) }}
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="primary"
          quaternary
          :disabled="!!row.builtIn"
          @click="openEdit(row as SysRole)"
        >
          编辑
        </NButton>
        <NDropdown
          :options="rowActionOptions"
          @select="(key: string) => onRowAction(key, row as SysRole)"
        >
          <NButton size="tiny" quaternary>更多 ▾</NButton>
        </NDropdown>
      </template>
    </Grid>
    <RoleModal />
    <MenuAssignModalComp />
  </Page>
</template>
