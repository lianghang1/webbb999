<script lang="ts" setup>
import type { SysTenant } from '#/api/system/types';

import { ref } from 'vue';

import { useVbenModal, z } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { packageApi, tenantApi } from '#/api';

defineOptions({ name: 'TenantFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysTenant;
}

const packageOptions = ref<{ label: string; value: string }[]>([]);
const editing = ref(false);
const ACCOUNT_RE = /^[A-Za-z][A-Za-z0-9_]{2,}$/;

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (rawValues) => {
    const values = rawValues as Record<string, any>;
    const data = modalApi.getData();
    if (!data?.record?.id && values.adminPassword !== values.confirmPassword) {
      message.error('两次输入的管理员密码不一致');
      return;
    }
    const { confirmPassword: _confirm, ...payload } = values;
    // 编辑时不下发管理员字段，避免误触发后端初始化逻辑
    if (data?.record?.id) {
      delete payload.adminUsername;
      delete payload.adminPassword;
      delete payload.adminName;
    }
    await tenantApi.save({ ...payload, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    // ===== 基础信息 =====
    {
      type: 'group',
      name: 'basic',
      title: '基础信息',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: ({ rootValues }) => ({
            placeholder: '如 company_a（字母开头）',
            disabled: !!rootValues?.id,
          }),
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
          component: 'Select',
          componentProps: () => ({
            options: packageOptions.value,
            placeholder: '请选择套餐',
            clearable: true,
            filterable: true,
          }),
          fieldName: 'packageId',
          label: '开通套餐',
          help: '套餐决定该租户可使用的菜单范围',
        },
        {
          component: 'DatePicker',
          componentProps: {
            type: 'date',
            class: 'w-full',
            valueFormat: 'yyyy-MM-dd' as never,
          },
          fieldName: 'expireTime',
          label: '到期日期',
          help: '留空表示不过期',
        },
      ],
    },
    // ===== 租户管理员（仅新增） =====
    {
      type: 'group',
      name: 'admin',
      title: '租户管理员（仅新增时创建）',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: ({ rootValues }) => ({
            placeholder: '管理员登录账号',
            disabled: !!rootValues?.id,
          }),
          fieldName: 'adminUsername',
          label: '管理员账号',
          dependencies: {
            triggerFields: ['id'],
            show: (values) => !values.id,
            rules: (values) =>
              values.id
                ? null
                : z
                    .string()
                    .regex(ACCOUNT_RE, '字母开头，至少3位字母数字下划线')
                    .optional(),
          },
        },
        {
          component: 'Input',
          componentProps: ({ rootValues }) => ({
            placeholder: '管理员姓名',
            disabled: !!rootValues?.id,
          }),
          fieldName: 'adminName',
          label: '管理员姓名',
          dependencies: {
            triggerFields: ['id'],
            show: (values) => !values.id,
          },
        },
        {
          component: 'Input',
          componentProps: ({ rootValues }) => ({
            placeholder: '请输入初始密码',
            type: 'password',
            disabled: !!rootValues?.id,
          }),
          fieldName: 'adminPassword',
          label: '初始密码',
          dependencies: {
            triggerFields: ['id'],
            show: (values) => !values.id,
          },
        },
        {
          component: 'Input',
          componentProps: ({ rootValues }) => ({
            placeholder: '请再次输入密码',
            type: 'password',
            disabled: !!rootValues?.id,
          }),
          fieldName: 'confirmPassword',
          label: '确认密码',
          dependencies: {
            triggerFields: ['id'],
            show: (values) => !values.id,
          },
        },
      ],
    },
    // ===== 其他 =====
    {
      type: 'group',
      name: 'other',
      title: '其他',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
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
          component: 'Textarea',
          componentProps: {
            placeholder: '请输入备注',
            autosize: { minRows: 2, maxRows: 4 },
            class: 'w-full',
          },
          fieldName: 'remark',
          label: '备注',
          formItemClass: 'col-span-2',
        },
      ],
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  class: 'w-[660px]',
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmit();
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    const isEdit = !!data?.record?.id;
    editing.value = isEdit;
    modalApi.setState({ title: isEdit ? '编辑租户' : '新增租户' });

    const page = await packageApi.list({ pageNum: 1, pageSize: -1 });
    packageOptions.value = page.list.map((p) => ({
      label: p.packageName,
      value: String(p.id),
    }));

    const record = data?.record;
    if (isEdit && record) {
      formApi.setValues({
        ...record,
        packageId:
          record.packageId === null || record.packageId === undefined
            ? undefined
            : String(record.packageId),
      });
    } else {
      formApi.resetForm();
      formApi.setValues({ status: 1 });
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
