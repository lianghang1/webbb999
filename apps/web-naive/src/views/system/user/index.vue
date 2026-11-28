<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import type { SysUser } from '#/api/system/types';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  NButton,
  NCheckbox,
  NDropdown,
  NInput,
  NSwitch,
  NTag,
  NTree,
} from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deptApi, roleApi, tenantApi, userApi } from '#/api';

import UserFormModal from './user-form-modal.vue';
import UserGrantModal from './user-grant-modal.vue';
import UserResetPasswordModal from './user-reset-password-modal.vue';

defineOptions({ name: 'SystemUser' });

const userStore = useUserStore();
/** 平台超管：可跨租户查看/分配用户；租户管理员及普通用户仅限本租户 */
const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);

interface GridQueryParams {
  form?: {
    username?: string;
    nickname?: string;
    mobile?: string;
    status?: number;
    roleId?: string;
    tenantId?: string;
  };
  page: { currentPage: number; pageSize: number };
}

// ===== 左侧部门树 =====
const deptTreeRaw = ref<any[]>([]);
const selectedDeptId = ref<null | string>(null);
const includeChildren = ref(true);
const treeKeyword = ref('');

/** 是否显示人数（树里有 userCount 字段即可） */
const showUserCount = computed(() =>
  JSON.stringify(deptTreeRaw.value).includes('userCount'),
);

function toTree(nodes: any[]): TreeOption[] {
  return (nodes ?? []).map((n) => {
    const count = n.userCount;
    const label =
      showUserCount.value && count !== null && count !== undefined
        ? `${n.deptName} (${count})`
        : n.deptName;
    return {
      key: String(n.id),
      label,
      children: n.children?.length ? toTree(n.children) : undefined,
    };
  });
}

/** 收集某节点及其所有子孙 key（含子部门过滤用） */
function collectKeys(nodes: any[], id: string): string[] {
  for (const n of nodes) {
    if (String(n.id) === id) {
      const keys = [String(n.id)];
      const walk = (children: any[]) => {
        for (const c of children ?? []) {
          keys.push(String(c.id));
          walk(c.children);
        }
      };
      walk(n.children);
      return keys;
    }
    const found = collectKeys(n.children ?? [], id);
    if (found.length > 0) {
      return found;
    }
  }
  return [];
}

/** 按关键字过滤树（保留命中节点及其祖先） */
function filterTree(nodes: any[], kw: string): any[] {
  if (!kw) {
    return nodes;
  }
  const result: any[] = [];
  for (const n of nodes) {
    const children = filterTree(n.children ?? [], kw);
    if (n.deptName?.includes(kw) || children.length > 0) {
      result.push({ ...n, children });
    }
  }
  return result;
}

const filteredDeptTree = computed(() =>
  toTree(filterTree(deptTreeRaw.value, treeKeyword.value.trim())),
);

async function loadDeptTree() {
  deptTreeRaw.value = await deptApi.tree();
}

function onDeptSelect(keys: (number | string)[]) {
  selectedDeptId.value = keys.length > 0 ? String(keys[0]) : null;
  gridApi.query();
}

onMounted(loadDeptTree);

// ===== 查询选项：角色 / 租户 =====
const roleOptions = ref<{ label: string; value: string }[]>([]);
const tenantOptions = ref<{ label: string; value: string }[]>([]);

async function loadOptions() {
  const rolePage = await roleApi.list({ pageNum: 1, pageSize: -1 });
  roleOptions.value = rolePage.list.map((r) => ({
    label: r.roleName,
    value: String(r.id),
  }));
  if (isPlatformAdmin.value) {
    const tenantPage = await tenantApi.list({ pageNum: 1, pageSize: -1 });
    tenantOptions.value = tenantPage.list.map((t) => ({
      label: t.tenantName,
      value: String(t.id),
    }));
  }
}

onMounted(loadOptions);

// ===== 工具栏轻量统计（取代顶部统计卡） =====
const totalText = ref('共 0 条');

// ===== 右侧用户表格 =====
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '账号包含…', clearable: true },
        fieldName: 'username',
        label: '账号',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '昵称包含…', clearable: true },
        fieldName: 'nickname',
        label: '昵称',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '手机号包含…', clearable: true },
        fieldName: 'mobile',
        label: '手机号',
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
      {
        component: 'Select',
        componentProps: () => ({
          clearable: true,
          filterable: true,
          options: roleOptions.value,
          placeholder: '全部角色',
        }),
        fieldName: 'roleId',
        label: '角色',
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
    checkboxConfig: { range: true, highlight: true },
    stripe: true,
    columns: [
      { type: 'checkbox', width: 46 },
      { field: 'username', title: '账号', width: 120 },
      {
        field: 'nickname',
        title: '昵称',
        width: 110,
        slots: { default: 'nickname' },
      },
      {
        field: 'deptName',
        title: '部门',
        width: 130,
        slots: { default: 'deptName' },
      },
      ...(isPlatformAdmin.value
        ? [
            {
              field: 'tenantName',
              title: '租户',
              width: 120,
              slots: { default: 'tenantName' },
            },
          ]
        : []),
      {
        field: 'roleNames',
        title: '角色',
        minWidth: 150,
        slots: { default: 'roleNames' },
      },
      { field: 'mobile', title: '手机号', width: 120 },
      {
        field: 'createTime',
        title: '创建时间',
        width: 155,
        slots: { default: 'createTime' },
      },
      {
        field: 'lastLoginTime',
        title: '最后登录',
        width: 155,
        slots: { default: 'lastLoginTime' },
      },
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
        query: async ({ form, page }: GridQueryParams) => {
          const params: Record<string, unknown> = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            sort: 'createTime',
            order: 'desc',
          };
          if (form?.username) {
            params.CN_username = form.username;
          }
          if (form?.nickname) {
            params.CN_nickname = form.nickname;
          }
          if (form?.mobile) {
            params.CN_mobile = form.mobile;
          }
          if (form?.status !== undefined) {
            params.EQ_status = form.status;
          }
          if (form?.roleId) {
            // roleIds 为 ,1,5, 格式，前后补逗号做精确包含匹配
            params.CN_roleIds = `,${form.roleId},`;
          }
          if (form?.tenantId) {
            params.EQ_tenantId = form.tenantId;
          }
          if (selectedDeptId.value) {
            if (includeChildren.value) {
              params.IN_deptId = collectKeys(
                deptTreeRaw.value,
                selectedDeptId.value,
              ).join(',');
            } else {
              params.EQ_deptId = selectedDeptId.value;
            }
          }
          const result = await userApi.list(params);
          const enabled = (result.list as SysUser[]).filter(
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

const [UserModal, userModalApi] = useVbenModal({
  connectedComponent: UserFormModal,
});
const [ResetModal, resetModalApi] = useVbenModal({
  connectedComponent: UserResetPasswordModal,
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

function openReset(row: SysUser) {
  resetModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  resetModalApi.open();
}

async function toggleStatus(row: SysUser) {
  const next = row.status === 1 ? 0 : 1;
  await userApi.changeStatus([row.id], next);
  message.success(next === 1 ? '已启用' : '已停用');
  gridApi.query();
}

function onDelete(row: SysUser) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除用户「${row.nickname || row.username}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await userApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}

async function onBatchDelete() {
  const rows = gridApi.grid.getCheckboxRecords() as SysUser[];
  if (rows.length === 0) {
    message.warning('请先选择用户');
    return;
  }
  dialog.warning({
    title: '批量删除确认',
    content: `确定删除选中的 ${rows.length} 个用户吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await userApi.deleteBatch(rows.map((r) => r.id));
      message.success(`已删除 ${rows.length} 个用户`);
      gridApi.query();
    },
  });
}

async function onBatchStatus(status: number) {
  const rows = gridApi.grid.getCheckboxRecords() as SysUser[];
  if (rows.length === 0) {
    message.warning('请先选择用户');
    return;
  }
  await userApi.changeStatus(
    rows.map((r) => r.id),
    status,
  );
  message.success(`已${status === 1 ? '启用' : '停用'} ${rows.length} 个用户`);
  gridApi.query();
}

/** 行操作「更多」下拉 */
const rowActionOptions = [
  { label: '授权', key: 'grant' },
  { label: '重置密码', key: 'reset' },
  { label: '删除', key: 'delete', danger: true },
];

function onRowAction(key: string, row: SysUser) {
  if (key === 'grant') openGrant(row);
  else if (key === 'reset') openReset(row);
  else if (key === 'delete') onDelete(row);
}

/** 批量「更多」下拉 */
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

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '—';
}
</script>

<template>
  <Page auto-content-height title="用户管理">
    <div class="flex h-full gap-3">
      <!-- 左侧部门树 -->
      <div
        class="flex w-56 flex-shrink-0 flex-col rounded-lg border border-border bg-card p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-semibold">组织架构</span>
          <NCheckbox v-model:checked="includeChildren" size="small">
            含子部门
          </NCheckbox>
        </div>
        <NInput
          v-model:value="treeKeyword"
          size="small"
          clearable
          placeholder="筛选部门…"
          class="mb-2"
        />
        <NTree
          :data="filteredDeptTree"
          :selected-keys="selectedDeptId ? [selectedDeptId] : []"
          :default-expand-all="true"
          block-line
          virtual-scroll
          class="min-h-0 flex-1"
          @update:selected-keys="onDeptSelect"
        />
        <div v-if="selectedDeptId" class="mt-2">
          <NButton
            size="tiny"
            quaternary
            @click="
              () => {
                selectedDeptId = null;
                gridApi.query();
              }
            "
          >
            清除部门筛选
          </NButton>
        </div>
      </div>

      <!-- 右侧列表 -->
      <div class="h-full min-w-0 flex-1">
        <Grid>
          <template #toolbar-actions>
            <NButton size="small" type="primary" @click="openCreate">
              新增用户
            </NButton>
            <NDropdown :options="batchActions" @select="onBatchAction">
              <NButton size="small">批量操作 ▾</NButton>
            </NDropdown>
            <span class="text-xs text-muted-foreground self-center">{{
              totalText
            }}</span>
          </template>
          <template #nickname="{ row }">{{ row.nickname || '—' }}</template>
          <template #deptName="{ row }">
            <span v-if="row.deptName">{{ row.deptName }}</span>
            <span v-else class="text-muted-foreground">未分配</span>
          </template>
          <template #tenantName="{ row }">
            <span v-if="row.tenantName">{{ row.tenantName }}</span>
            <span v-else class="text-muted-foreground">—</span>
          </template>
          <template #roleNames="{ row }">
            <NTag
              v-for="r in (row.roleNames || '').split(',').filter(Boolean)"
              :key="r"
              size="small"
              class="mr-1"
              :bordered="false"
            >
              {{ r }}
            </NTag>
            <span v-if="!row.roleNames" class="text-muted-foreground">—</span>
          </template>
          <template #createTime="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
          <template #lastLoginTime="{ row }">
            {{ formatTime(row.lastLoginTime) }}
          </template>
          <template #status="{ row }">
            <NSwitch
              :value="row.status === 1"
              @update:value="toggleStatus(row as SysUser)"
            />
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
            <NDropdown
              :options="rowActionOptions"
              @select="(key: string) => onRowAction(key, row as SysUser)"
            >
              <NButton size="tiny" quaternary>更多 ▾</NButton>
            </NDropdown>
          </template>
        </Grid>
      </div>
    </div>
    <UserModal />
    <ResetModal />
    <GrantModal />
  </Page>
</template>
