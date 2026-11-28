<script lang="ts" setup>
import type { TreeSelectOption } from 'naive-ui';

import type { SysUser, UserDetail } from '#/api/system/types';

import { computed, ref } from 'vue';

import { useVbenModal, z } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { deptApi, roleApi, tenantApi, userApi } from '#/api';

defineOptions({ name: 'UserFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysUser;
}

const userStore = useUserStore();
const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);

const deptOptions = ref<TreeSelectOption[]>([]);
const roleOptions = ref<{ label: string; value: string }[]>([]);
const tenantOptions = ref<{ label: string; value: string }[]>([]);

/** 后端部门树 → naive TreeSelect options */
function toTreeOptions(nodes: any[]): TreeSelectOption[] {
  return (nodes ?? []).map((n) => ({
    key: String(n.id),
    label: n.deptName,
    children: n.children?.length ? toTreeOptions(n.children) : undefined,
  }));
}

const MOBILE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    // 两次密码一致性校验（新增时）
    if (!data?.record?.id && values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    const { confirmPassword: _confirm, ...payload } = values;
    await userApi.save({ ...payload, id: data?.record?.id });
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
            placeholder: '请输入账号',
            disabled: !!rootValues?.id,
          }),
          fieldName: 'username',
          label: '账号',
          rules: 'required',
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
          componentProps: ({ rootValues }) => ({
            placeholder: rootValues?.id ? '留空则不修改密码' : '请输入密码',
            type: 'password',
          }),
          fieldName: 'password',
          label: '密码',
          dependencies: {
            triggerFields: ['id'],
            rules: (values) => (values.id ? null : 'required'),
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
            rules: (values) => (values.id ? null : 'required'),
          },
        },
      ],
    },

    // ===== 归属与权限 =====
    {
      type: 'group',
      name: 'permission',
      title: '归属与权限',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Select',
          componentProps: ({ rootValues }) => ({
            options: tenantOptions.value,
            placeholder: '请选择所属租户',
            clearable: false,
            filterable: true,
            disabled: !!rootValues?.id,
          }),
          fieldName: 'tenantId',
          label: '所属租户',
          dependencies: {
            triggerFields: ['id'],
            show: () => isPlatformAdmin.value,
            rules: () => (isPlatformAdmin.value ? 'required' : null),
          },
        },
        {
          component: 'TreeSelect',
          componentProps: () => ({
            options: deptOptions.value,
            placeholder: '请选择所属部门',
            clearable: true,
            checkable: false,
          }),
          fieldName: 'deptId',
          label: '所属部门',
          // 部门可为空：新系统无部门数据时仍可新增用户（ deptId 由后端兜底）
        },
        {
          component: 'Select',
          componentProps: () => ({
            options: roleOptions.value,
            placeholder: '请选择角色（可多选）',
            multiple: true,
            clearable: true,
            filterable: true,
            maxTagCount: 2,
          }),
          fieldName: 'roleIds',
          label: '角色',
        },
      ],
    },

    // ===== 联系方式 =====
    {
      type: 'group',
      name: 'contact',
      title: '联系方式',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: { placeholder: '请输入手机号' },
          fieldName: 'mobile',
          label: '手机号',
          rules: z
            .string()
            .regex(MOBILE_RE, '手机号格式不正确')
            .optional()
            .or(z.literal('')),
        },
        {
          component: 'Input',
          componentProps: { placeholder: '请输入邮箱' },
          fieldName: 'email',
          label: '邮箱',
          rules: z
            .string()
            .regex(EMAIL_RE, '邮箱格式不正确')
            .optional()
            .or(z.literal('')),
        },
        {
          component: 'Select',
          componentProps: {
            options: [
              { label: '未知', value: 0 },
              { label: '男', value: 1 },
              { label: '女', value: 2 },
            ],
          },
          defaultValue: 0,
          fieldName: 'sex',
          label: '性别',
        },
      ],
    },

    // ===== 账户策略 =====
    {
      type: 'group',
      name: 'policy',
      title: '账户策略',
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
          component: 'InputNumber',
          componentProps: { min: 1, max: 100, class: 'w-full' },
          fieldName: 'maxSessions',
          label: '最大登录数',
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
  class: 'w-[680px]',
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
    modalApi.setState({ title: data?.record?.id ? '编辑用户' : '新增用户' });
    // 加载部门树与角色选项
    const [deptTree, roles] = await Promise.all([
      deptApi.tree(),
      roleApi.list({ pageNum: 1, pageSize: -1 }),
    ]);
    deptOptions.value = toTreeOptions(deptTree);
    roleOptions.value = roles.list.map((r) => ({
      label: r.roleName,
      value: String(r.id),
    }));
    if (isPlatformAdmin.value) {
      const tenantPage = await tenantApi.list({ pageNum: 1, pageSize: -1 });
      tenantOptions.value = tenantPage.list.map((t) => ({
        label: t.tenantName,
        value: String(t.id),
      }));
    }
    // 编辑：拉详情回显（账号 + 资料 + 归属部门 + 角色）
    if (data?.record?.id) {
      const detail: UserDetail = await userApi.detail(data.record.id);
      const recordTenantId = data.record?.tenantId;
      formApi.setValues({
        ...detail,
        tenantId: detail.tenantId ?? recordTenantId ?? undefined,
        deptId:
          detail.deptId === null || detail.deptId === undefined
            ? undefined
            : String(detail.deptId),
        roleIds: (detail.roleIds ?? []).map(String),
        password: undefined,
        confirmPassword: undefined,
      });
    } else {
      formApi.resetForm();
      const firstTenant = tenantOptions.value[0];
      formApi.setValues({
        status: 1,
        sex: 0,
        // 平台超管新增时默认选中第一个租户，租户管理员由后端按登录态兜底
        ...(isPlatformAdmin.value && firstTenant
          ? { tenantId: firstTenant.value }
          : {}),
      });
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
