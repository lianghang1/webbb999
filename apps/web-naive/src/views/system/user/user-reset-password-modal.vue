<script lang="ts" setup>
import type { SysUser } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { userApi } from '#/api';

defineOptions({ name: 'UserResetPasswordModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysUser;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    if (!data?.record?.id) {
      return;
    }
    await userApi.resetPassword({
      userId: data.record.id,
      password: values.password,
    });
    message.success('密码已重置');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入新密码', type: 'password' },
      fieldName: 'password',
      label: '新密码',
      rules: 'required',
      help: '密码需满足平台密码策略（长度、复杂度）',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请再次输入新密码', type: 'password' },
      fieldName: 'confirm',
      label: '确认密码',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  class: 'w-[420px]',
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const values = await formApi.getValues();
    if (values.password !== values.confirm) {
      message.error('两次输入的密码不一致');
      return;
    }
    await formApi.validateAndSubmit();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    modalApi.setState({ title: `重置密码 - ${data?.record?.username ?? ''}` });
    formApi.resetForm();
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
