<script lang="ts" setup>
import type { SysConfig } from '#/api/system/types';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NDropdown, NTag, NTooltip } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { configApi } from '#/api';

import ConfigFormModal from './config-form-modal.vue';
import ConfigSecretModal from './config-secret-modal.vue';

defineOptions({ name: 'SystemConfig' });

const totalText = ref('共 0 条');

interface GridQueryParams {
  form?: {
    configGroup?: string;
    configKey?: string;
    needEncrypt?: boolean;
    valueType?: string;
  };
  page: { currentPage: number; pageSize: number };
}

function displayValue(row: SysConfig) {
  const value = row.configValue;
  if (value && typeof value === 'object' && 'encrypted' in value) {
    return value.encrypted ? '••••••••（已加密）' : value.cipher || '—';
  }
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '参数键包含…', clearable: true },
        fieldName: 'configKey',
        label: '参数键',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '分组，如 common', clearable: true },
        fieldName: 'configGroup',
        label: '分组',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          options: [
            { label: '字符串', value: 'STRING' },
            { label: '数字', value: 'NUMBER' },
            { label: '布尔', value: 'BOOLEAN' },
            { label: 'JSON', value: 'JSON' },
          ],
        },
        fieldName: 'valueType',
        label: '值类型',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          options: [
            { label: '是', value: true },
            { label: '否', value: false },
          ],
        },
        fieldName: 'needEncrypt',
        label: '敏感参数',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'configKey', title: '参数键', width: 200 },
      { field: 'configGroup', title: '分组', width: 140 },
      {
        field: 'configValue',
        title: '参数值',
        minWidth: 220,
        slots: { default: 'configValue' },
      },
      {
        field: 'valueType',
        title: '类型',
        width: 100,
        slots: { default: 'valueType' },
      },
      {
        field: 'needEncrypt',
        title: '敏感',
        width: 84,
        slots: { default: 'needEncrypt' },
      },
      { field: 'remark', title: '备注', minWidth: 160 },
      { field: 'updateTime', title: '更新时间', width: 170 },
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
          };
          if (form?.configKey) {
            params.CN_configKey = form.configKey;
          }
          if (form?.configGroup) {
            params.EQ_configGroup = form.configGroup;
          }
          if (form?.valueType) {
            params.EQ_valueType = form.valueType;
          }
          if (form?.needEncrypt !== undefined) {
            params.EQ_needEncrypt = form.needEncrypt;
          }
          const result = await configApi.list(params);
          const items = result.list as SysConfig[];
          const secretCount = items.filter((item) => item.needEncrypt).length;
          totalText.value = `共 ${result.total} 条 · 本页敏感 ${secretCount}`;
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [ConfigModal, configModalApi] = useVbenModal({
  connectedComponent: ConfigFormModal,
});
const [SecretModal, secretModalApi] = useVbenModal({
  connectedComponent: ConfigSecretModal,
});

const typeLabels: Record<string, string> = {
  BOOLEAN: '布尔',
  JSON: 'JSON',
  NUMBER: '数字',
  STRING: '字符串',
};

function openCreate() {
  configModalApi.setData({ onSuccess: () => gridApi.query() });
  configModalApi.open();
}

function openEdit(row: SysConfig) {
  configModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  configModalApi.open();
}

function openSecret(row: SysConfig) {
  secretModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  secretModalApi.open();
}

function onDelete(row: SysConfig) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除参数「${row.configKey}」吗？删除后无法恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await configApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}

const rowActionOptions = [
  { label: '敏感值管理', key: 'secret' },
  { label: '删除', key: 'delete', danger: true },
];

function onRowAction(key: string, row: SysConfig) {
  if (key === 'secret') openSecret(row);
  else if (key === 'delete') onDelete(row);
}
</script>

<template>
  <Page auto-content-height title="参数配置">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增参数
        </NButton>
        <span class="text-xs text-muted-foreground self-center">{{
          totalText
        }}</span>
      </template>
      <template #configValue="{ row }">
        <NTooltip :disabled="!row.needEncrypt">
          <template #trigger>
            <span class="font-mono text-xs">{{
              displayValue(row as SysConfig)
            }}</span>
          </template>
          敏感值需通过「敏感」操作授权读取
        </NTooltip>
      </template>
      <template #valueType="{ row }">
        <NTag size="small" :bordered="false">
          {{ typeLabels[String(row.valueType)] || row.valueType || 'STRING' }}
        </NTag>
      </template>
      <template #needEncrypt="{ row }">
        <NTag
          :bordered="false"
          :type="row.needEncrypt ? 'error' : 'default'"
          round
          size="small"
        >
          {{ row.needEncrypt ? '加密' : '明文' }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          quaternary
          type="primary"
          @click="openEdit(row as SysConfig)"
        >
          编辑
        </NButton>
        <NDropdown
          :options="rowActionOptions"
          @select="(key: string) => onRowAction(key, row as SysConfig)"
        >
          <NButton size="tiny" quaternary>更多 ▾</NButton>
        </NDropdown>
      </template>
    </Grid>
    <ConfigModal />
    <SecretModal />
  </Page>
</template>
