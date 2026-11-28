<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { kickOutApi, onlineAllApi, tenantApi } from '#/api';

defineOptions({ name: 'SystemOnline' });

interface OnlineFlatRow {
  token: string;
  accountId: string;
  accountNo: string;
  displayName: string;
  deviceId?: string;
  loginTime: number | string;
  roles?: string[];
  tenantId: string;
}

interface GridQueryParams {
  form?: { keyword?: string };
  page: { currentPage: number; pageSize: number };
}

const loading = ref(false);
const totalText = ref('在线会话 0 · 在线账号 0 · 活跃租户 0');
const tenantNames = ref<Record<string, string>>({});

function tenantLabel(tenantId?: string) {
  if (!tenantId) return '—';
  return tenantNames.value[tenantId] || tenantId;
}

function formatTime(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  // 后端返回的 loginTime 可能是字符串时间戳，需先转数字
  const ms = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(ms)) {
    return '—';
  }
  return new Date(ms).toLocaleString('zh-CN', { hour12: false });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '账号或姓名包含…', clearable: true },
        fieldName: 'keyword',
        label: '关键字',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'accountNo', title: '账号', width: 140 },
      { field: 'displayName', title: '姓名', width: 120 },
      {
        field: 'tenantId',
        title: '租户',
        width: 150,
        slots: { default: 'tenantId' },
      },
      { field: 'deviceId', title: '设备', minWidth: 160 },
      {
        field: 'loginTime',
        title: '登录时间',
        width: 180,
        slots: { default: 'loginTime' },
      },
      {
        field: 'roles',
        title: '角色',
        minWidth: 160,
        slots: { default: 'roles' },
      },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 120,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ form }: GridQueryParams) => {
          loading.value = true;
          try {
            const [sessions, tenants] = await Promise.all([
              onlineAllApi(),
              tenantApi
                .list({ pageNum: 1, pageSize: -1 })
                .catch(() => ({ list: [] })),
            ]);
            tenantNames.value = Object.fromEntries(
              (tenants.list ?? []).map((t) => [String(t.id), t.tenantName]),
            );
            const key = (form?.keyword ?? '').trim().toLowerCase();
            const all: OnlineFlatRow[] = sessions.map((item) => ({
              ...item.session,
              token: item.token,
            }));
            const items = all.filter((s) =>
              key
                ? s.accountNo?.toLowerCase().includes(key) ||
                  s.displayName?.toLowerCase().includes(key)
                : true,
            );
            const accounts = new Set(items.map((item) => item.accountId)).size;
            const tenantCount = new Set(items.map((item) => item.tenantId))
              .size;
            totalText.value = `在线会话 ${items.length} · 在线账号 ${accounts} · 活跃租户 ${tenantCount}`;
            return { items, total: items.length };
          } finally {
            loading.value = false;
          }
        },
      },
    },
    rowConfig: { keyField: 'token' },
    stripe: true,
  },
});

function kickOut(row: OnlineFlatRow) {
  dialog.warning({
    title: '强制下线',
    content: `确定使「${row.displayName || row.accountNo}」的所有会话立即失效吗？`,
    positiveText: '确认踢出',
    negativeText: '取消',
    onPositiveClick: async () => {
      await kickOutApi({ accountId: row.accountId });
      message.success('已强制下线');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height title="在线会话">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" :loading="loading" @click="gridApi.query()">
          刷新
        </NButton>
        <span class="text-xs text-muted-foreground self-center">{{
          totalText
        }}</span>
      </template>
      <template #tenantId="{ row }">
        <NTag size="small" :bordered="false">
          {{ tenantLabel(row.tenantId) }}
        </NTag>
      </template>
      <template #loginTime="{ row }">{{ formatTime(row.loginTime) }}</template>
      <template #roles="{ row }">
        <NTag
          v-for="role in row.roles || []"
          :key="role"
          size="small"
          :bordered="false"
          class="mr-1"
        >
          {{ role }}
        </NTag>
        <span v-if="!row.roles?.length" class="text-muted-foreground">—</span>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          quaternary
          type="error"
          @click="kickOut(row as OnlineFlatRow)"
        >
          强制下线
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
