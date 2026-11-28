<script lang="ts" setup>
import type { SysDict, SysDictOption } from '#/api/system/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NInput,
  NInputNumber,
  NPopconfirm,
  NSpace,
  NTag,
} from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { dictApi } from '#/api';

defineOptions({ name: 'DictOptionModal' });

interface ModalData {
  dict?: SysDict;
}

const currentDict = ref<SysDict | undefined>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'optionCode', title: '选项值', width: 140 },
      { field: 'optionLabel', title: '选项标签', minWidth: 160 },
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
        width: 130,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!currentDict.value) {
            return { items: [], total: 0 };
          }
          const result = await dictApi.option.list({
            dictId: currentDict.value.id,
            pageNum: 1,
            pageSize: -1,
          });
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    stripe: true,
  },
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  class: 'w-[820px] max-w-[92vw]',
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData();
    currentDict.value = data?.dict;
    modalApi.setState({ title: `字典项 - ${data?.dict?.dictName ?? ''}` });
    gridApi.query();
  },
});

/** 新增/编辑共用的内联表单 */
const editingId = ref<null | number | string>(null);
const optionForm = ref({
  optionCode: '',
  optionLabel: '',
  sortNo: 0,
  status: 1,
});

function resetForm() {
  editingId.value = null;
  optionForm.value = { optionCode: '', optionLabel: '', sortNo: 0, status: 1 };
}

async function submitOption() {
  if (!optionForm.value.optionCode || !optionForm.value.optionLabel) {
    message.error('请填写选项值和标签');
    return;
  }
  await dictApi.option.save({
    ...optionForm.value,
    id: editingId.value ?? undefined,
    dictId: currentDict.value?.id,
  } as never);
  message.success(editingId.value ? '已更新' : '已添加');
  resetForm();
  gridApi.query();
}

function startEdit(row: SysDictOption) {
  editingId.value = row.id;
  optionForm.value = {
    optionCode: row.optionCode,
    optionLabel: row.optionLabel,
    sortNo: row.sortNo ?? 0,
    status: row.status ?? 1,
  };
}

function onDelete(row: SysDictOption) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除字典项「${row.optionLabel}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await dictApi.option.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Modal>
    <div class="p-4">
      <div class="mb-3 rounded-lg border border-border bg-muted/40 p-3">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-semibold">{{
            editingId ? '编辑选项' : '新增选项'
          }}</span>
          <NButton v-if="editingId" size="tiny" quaternary @click="resetForm">
            取消编辑
          </NButton>
        </div>
        <NSpace :size="8">
          <NInput
            v-model:value="optionForm.optionCode"
            placeholder="选项值"
            style="width: 150px"
          />
          <NInput
            v-model:value="optionForm.optionLabel"
            placeholder="选项标签"
            style="width: 180px"
          />
          <NInputNumber
            v-model:value="optionForm.sortNo"
            placeholder="排序"
            style="width: 90px"
          />
          <NButton type="primary" size="small" @click="submitOption">
            {{ editingId ? '保存修改' : '添加' }}
          </NButton>
        </NSpace>
      </div>
      <Grid>
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
            @click="startEdit(row as SysDictOption)"
          >
            编辑
          </NButton>
          <NPopconfirm @positive-click="onDelete(row as SysDictOption)">
            <template #trigger>
              <NButton size="tiny" type="error" quaternary>删除</NButton>
            </template>
            确定删除该字典项？
          </NPopconfirm>
        </template>
      </Grid>
    </div>
  </Modal>
</template>
