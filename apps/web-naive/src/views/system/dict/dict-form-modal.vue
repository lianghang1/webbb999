<script lang="ts" setup>
import type { SysDict } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { dictApi } from '#/api';

defineOptions({ name: 'DictFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysDict;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await dictApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入字典编码' },
      fieldName: 'dictCode',
      label: '字典编码',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入字典名称' },
      fieldName: 'dictName',
      label: '字典名称',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
      defaultValue: 1,
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '备注', type: 'textarea' },
      fieldName: 'remark',
      label: '备注',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmit();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    modalApi.setState({ title: data?.record?.id ? '编辑字典' : '新增字典' });
    if (data?.record) {
      formApi.setValues(data.record);
    } else {
      formApi.resetForm();
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
