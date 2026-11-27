<script lang="ts" setup>
import type { SysTenant } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { tenantApi } from '#/api';

defineOptions({ name: 'TenantFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysTenant;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await tenantApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入租户编码' },
      fieldName: 'tenantCode',
      label: '租户编码',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入租户名称' },
      fieldName: 'tenantName',
      label: '租户名称',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { placeholder: '套餐ID', min: 0, class: 'w-full' },
      fieldName: 'packageId',
      label: '套餐ID',
    },
    {
      component: 'DatePicker',
      componentProps: {
        type: 'date',
        class: 'w-full',
        valueFormat: 'yyyy-MM-dd' as never,
      },
      fieldName: 'expireTime',
      label: '过期时间',
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
      componentProps: { placeholder: '新建租户时用于创建管理员账号' },
      fieldName: 'adminUsername',
      label: '管理员账号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '新建租户时用于创建管理员密码',
        type: 'password',
      },
      fieldName: 'adminPassword',
      label: '管理员密码',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '管理员名称' },
      fieldName: 'adminName',
      label: '管理员名称',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '备注', type: 'textarea' },
      fieldName: 'remark',
      label: '备注',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
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
    modalApi.setState({ title: data?.record?.id ? '编辑租户' : '新增租户' });
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
