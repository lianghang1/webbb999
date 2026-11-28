<script lang="ts" setup>
import type { TreeSelectOption } from 'naive-ui';

import type { SysRole } from '#/api/system/types';

import { computed, ref } from 'vue';

import { useVbenModal, z } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { deptApi, roleApi, tenantApi } from '#/api';

defineOptions({ name: 'RoleFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysRole;
}

const userStore = useUserStore();
const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);

const tenantOptions = ref<{ label: string; value: string }[]>([]);
const deptOptions = ref<TreeSelectOption[]>([]);

function toTreeOptions(nodes: any[]): TreeSelectOption[] {
  return (nodes ?? []).map((n) => ({
    key: String(n.id),
    label: n.deptName,
    children: n.children?.length ? toTreeOptions(n.children) : undefined,
  }));
}

/** 数据范围选项：与后端 DataScopeType 严格一致 */
const DATA_SCOPE_OPTIONS = [
  { label: '全部数据', value: 'ALL' },
  { label: '自定义部门', value: 'DEPT_CUSTOM' },
  { label: '仅本部门', value: 'DEPT_ONLY' },
  { label: '本部门及子部门', value: 'DEPT_AND_CHILD' },
  { label: '仅本人', value: 'SELF' },
];

const ROLE_CODE_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (rawValues) => {
    const values = rawValues as Record<string, any>;
    const data = modalApi.getData();
    const payload: Record<string, any> = { ...values, id: data?.record?.id };
    // 非平台超管：租户固定为登录租户，不信任前端
    if (!isPlatformAdmin.value) {
      payload.tenantId = data?.record?.tenantId ?? userStore.userInfo?.tenantId;
    }
    // CUSTOM 才提交部门，其他范围清空避免脏数据
    if (payload.dataScope !== 'DEPT_CUSTOM') {
      payload.dataScopeDeptIds = undefined;
    } else if (Array.isArray(payload.dataScopeDeptIds)) {
      payload.dataScopeDeptIds = payload.dataScopeDeptIds.join(',');
    }
    await roleApi.save(payload);
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
            placeholder: '如 biz_operator（字母开头，字母数字下划线）',
            disabled: !!rootValues?.id || !!rootValues?.builtIn,
          }),
          fieldName: 'roleCode',
          label: '角色编码',
          rules: (() => {
            const required = z.string().min(1, '请输入角色编码');
            return z
              .string()
              .regex(ROLE_CODE_RE, '字母开头，仅含字母数字下划线')
              .optional()
              .or(required);
          })(),
        },
        {
          component: 'Input',
          componentProps: { placeholder: '请输入角色名称' },
          fieldName: 'roleName',
          label: '角色名称',
          rules: 'required',
        },
        .../* 平台超管才显示租户选择；租户管理员固定本租户 */
        (isPlatformAdmin.value
          ? [
              {
                component: 'Select',
                componentProps: () => ({
                  options: tenantOptions.value,
                  placeholder: '请选择所属租户',
                  filterable: true,
                  clearable: false,
                }),
                fieldName: 'tenantId',
                label: '所属租户',
                rules: 'required',
              },
            ]
          : []),
        {
          component: 'InputNumber',
          componentProps: { min: 0, class: 'w-full' },
          fieldName: 'sortNo',
          label: '排序',
          defaultValue: 0,
        },
      ],
    },

    // ===== 数据权限 =====
    {
      type: 'group',
      name: 'dataScope',
      title: '数据权限',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Select',
          componentProps: {
            options: DATA_SCOPE_OPTIONS,
            placeholder: '请选择数据范围',
          },
          fieldName: 'dataScope',
          label: '数据范围',
          defaultValue: 'ALL',
          help: '控制该角色用户可查看的数据范围',
        },
        {
          component: 'TreeSelect',
          componentProps: () => ({
            options: deptOptions.value,
            placeholder: '请选择部门（可多选）',
            multiple: true,
            checkable: true,
            clearable: true,
            filterable: true,
            maxTagCount: 2,
          }),
          fieldName: 'dataScopeDeptIds',
          label: '指定部门',
          dependencies: {
            triggerFields: ['dataScope', 'tenantId'],
            // 租户变化时刷新该租户部门树（平台超管跨租户场景）
            trigger: (values) => {
              if (isPlatformAdmin.value && values.tenantId) {
                void loadDepts(String(values.tenantId));
              }
            },
            show: (values) => values.dataScope === 'DEPT_CUSTOM',
            required: (values) => values.dataScope === 'DEPT_CUSTOM',
            rules: (values) =>
              values.dataScope === 'DEPT_CUSTOM' ? 'required' : null,
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

/**
 * 加载部门树：按所选租户加载（平台超管可跨租户、租户管理员用本租户）。
 * 数据范围选 DEPT_CUSTOM 且租户变化时刷新。
 */
async function loadDepts(tenantId?: string) {
  const tree = await deptApi.tree(tenantId);
  deptOptions.value = toTreeOptions(tree);
}

const [Modal, modalApi] = useVbenModal<ModalData>({
  class: 'w-[640px]',
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
    const editing = !!data?.record?.id;
    modalApi.setState({ title: editing ? '编辑角色' : '新增角色' });

    // 平台超管加载租户下拉
    if (isPlatformAdmin.value) {
      const page = await tenantApi.list({ pageNum: 1, pageSize: -1 });
      tenantOptions.value = page.list.map((t) => ({
        label: t.tenantName,
        value: String(t.id),
      }));
    }

    const record = data?.record;
    if (editing && record) {
      formApi.setValues({
        ...record,
        tenantId:
          record.tenantId === null || record.tenantId === undefined
            ? undefined
            : String(record.tenantId),
        // dataScopeDeptIds 是逗号串，转成数组回填 TreeSelect
        dataScopeDeptIds: record.dataScopeDeptIds
          ? record.dataScopeDeptIds.split(',').filter(Boolean)
          : [],
        status: record.status ?? 1,
      });
      await loadDepts(
        record.tenantId === null || record.tenantId === undefined
          ? undefined
          : String(record.tenantId),
      );
    } else {
      formApi.resetForm();
      formApi.setValues({
        dataScope: 'ALL',
        status: 1,
        sortNo: 0,
        dataScopeDeptIds: [],
        ...(isPlatformAdmin.value
          ? {}
          : { tenantId: userStore.userInfo?.tenantId }),
      });
      await loadDepts(
        isPlatformAdmin.value
          ? undefined
          : (userStore.userInfo?.tenantId as string | undefined),
      );
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
