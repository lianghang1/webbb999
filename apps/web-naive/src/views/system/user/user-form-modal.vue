<script lang="ts" setup>
import type { SysUser } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { userApi } from '#/api';

defineOptions({ name: 'UserFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysUser;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await userApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: ({ rootValues }) => ({
        placeholder: '请输入账号',
        disabled: !!rootValues?.id,
      }),
      fieldName: 'username',
      label: '账号',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: ({ rootValues }) => ({
        placeholder: rootValues?.id ? '留空则不修改密码' : '请输入密码',
        type: 'password',
      }),
      fieldName: 'password',
      label: '密码',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入昵称' },
      fieldName: 'nickname',
      label: '昵称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入手机号' },
      fieldName: 'mobile',
      label: '手机号',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入邮箱' },
      fieldName: 'email',
      label: '邮箱',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 1, max: 100, class: 'w-full' },
      fieldName: 'maxSessions',
      label: '最大登录数',
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
    modalApi.setState({ title: data?.record?.id ? '编辑用户' : '新增用户' });
    if (data?.record) {
      const { password: _pwd, ...rest } = data.record;
      formApi.setValues(rest);
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
