<script lang="ts" setup>
import type { CemeteryDeceased } from '#/api/cemetery/biz';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createDeceasedApi, updateDeceasedApi } from '#/api';

defineOptions({ name: 'DeceasedFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: CemeteryDeceased;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    if (data?.record?.id) {
      await updateDeceasedApi(data.record.id, values);
    } else {
      await createDeceasedApi(values as never);
    }
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入逝者姓名' },
      fieldName: 'name',
      label: '姓名',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '男', value: 1 },
          { label: '女', value: 2 },
        ],
      },
      defaultValue: 1,
      fieldName: 'gender',
      label: '性别',
    },
    {
      component: 'DatePicker',
      fieldName: 'birthDate',
      label: '出生日期',
    },
    {
      component: 'DatePicker',
      fieldName: 'deathDate',
      label: '逝世日期',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '备注' },
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
    if (!isOpen) return;
    const data = modalApi.getData();
    modalApi.setState({
      title: data?.record?.id ? '编辑逝者档案' : '新增逝者档案',
    });
    if (data?.record) {
      formApi.setValues(data.record);
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
