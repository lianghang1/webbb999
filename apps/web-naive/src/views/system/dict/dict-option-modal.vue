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

import { message } from '#/adapter/naive';
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
        width: 100,
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
  },
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  class: 'w-[780px] max-w-[90vw]',
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    currentDict.value = data?.dict;
    modalApi.setState({ title: `字典项 - ${data?.dict?.dictName ?? ''}` });
    gridApi.query();
  },
});

const newOption = ref({ optionCode: '', optionLabel: '', sortNo: 0 });

async function addOption() {
  if (!newOption.value.optionCode || !newOption.value.optionLabel) {
    message.error('请填写选项值和标签');
    return;
  }
  await dictApi.option.save({
    ...newOption.value,
    dictId: currentDict.value?.id,
  } as never);
  newOption.value = { optionCode: '', optionLabel: '', sortNo: 0 };
  message.success('已添加');
  gridApi.query();
}

async function onDelete(row: SysDictOption) {
  await dictApi.option.delete(row.id);
  message.success('删除成功');
  gridApi.query();
}
</script>

<template>
  <Modal>
    <div class="p-4">
      <NSpace :size="8" class="mb-3">
        <NInput
          v-model:value="newOption.optionCode"
          placeholder="选项值"
          style="width: 150px"
        />
        <NInput
          v-model:value="newOption.optionLabel"
          placeholder="选项标签"
          style="width: 180px"
        />
        <NInputNumber
          v-model:value="newOption.sortNo"
          placeholder="排序"
          style="width: 90px"
        />
        <NButton type="primary" size="small" @click="addOption">添加</NButton>
      </NSpace>
      <Grid>
        <template #status="{ row }">
          <NTag :type="row.status === 1 ? 'success' : 'default'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </NTag>
        </template>
        <template #actions="{ row }">
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
