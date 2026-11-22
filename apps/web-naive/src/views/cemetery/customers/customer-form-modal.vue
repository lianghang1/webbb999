<script lang="ts" setup>
import type { CemeteryCustomer } from '#/api/cemetery/biz';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createCustomerApi, updateCustomerApi } from '#/api';

defineOptions({ name: 'CustomerFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: CemeteryCustomer;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    if (data?.record?.id) {
      await updateCustomerApi(data.record.id, values);
    } else {
      await createCustomerApi(values as never);
    }
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入客户姓名' },
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
      component: 'Input',
      componentProps: { placeholder: '请输入联系电话' },
      fieldName: 'phone',
      label: '联系电话',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入身份证号' },
      fieldName: 'idCard',
      label: '身份证号',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入地址' },
      fieldName: 'address',
      label: '地址',
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
    modalApi.setState({ title: data?.record?.id ? '编辑客户' : '新增客户' });
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
