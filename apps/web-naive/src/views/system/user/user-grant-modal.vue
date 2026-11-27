<script lang="ts" setup>
import type { SysTenant, SysUser } from '#/api/system/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NCheckbox, NCheckboxGroup, NSelect, NSpace, NSpin } from 'naive-ui';

import { message } from '#/adapter/naive';
import { roleApi, tenantApi, userApi } from '#/api';

defineOptions({ name: 'UserGrantModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysUser;
}

interface RoleOption {
  id: string;
  roleCode: string;
  roleName: string;
}

const tenants = ref<SysTenant[]>([]);
const roles = ref<RoleOption[]>([]);
const selectedTenantId = ref<null | string>(null);
const selectedRoles = ref<string[]>([]);
const loading = ref(false);

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const data = modalApi.getData();
    if (!data?.record?.id) {
      return;
    }
    if (!selectedTenantId.value) {
      message.error('请选择租户');
      return;
    }
    loading.value = true;
    try {
      await userApi.assignTenant({
        userId: data.record.id,
        tenantId: selectedTenantId.value,
      });
      await userApi.assignRoles({
        userId: data.record.id,
        tenantId: selectedTenantId.value,
        roleIds: selectedRoles.value,
      });
      message.success('授权成功');
      modalApi.close();
      await data?.onSuccess?.();
    } finally {
      loading.value = false;
    }
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    modalApi.setState({ title: `用户授权 - ${data?.record?.nickname ?? ''}` });
    loading.value = true;
    try {
      const [tenantPage, rolePage] = await Promise.all([
        tenantApi.list({ pageNum: 1, pageSize: 200 }),
        roleApi.list({ pageNum: 1, pageSize: 200 }),
      ]);
      tenants.value = tenantPage.list;
      roles.value = rolePage.list;
      selectedTenantId.value = null;
      selectedRoles.value = [];
    } finally {
      loading.value = false;
    }
  },
});

async function onTenantChange(tenantId: null | string) {
  selectedTenantId.value = tenantId;
  selectedRoles.value = [];
  if (!tenantId) {
    return;
  }
  const data = modalApi.getData();
  if (!data?.record?.id) {
    return;
  }
  const codes = await userApi.roles(data.record.id, tenantId);
  const codeSet = new Set(codes);
  selectedRoles.value = roles.value
    .filter((r) => codeSet.has(r.roleCode))
    .map((r) => r.id);
}
</script>

<template>
  <Modal>
    <NSpin :show="loading">
      <NSpace vertical :size="16" class="p-4">
        <div>
          <div class="mb-2 font-medium">选择租户</div>
          <NSelect
            v-model:value="selectedTenantId"
            :options="
              tenants.map((t) => ({ label: t.tenantName, value: t.id }))
            "
            placeholder="请选择租户"
            clearable
            @update:value="onTenantChange"
          />
        </div>
        <div>
          <div class="mb-2 font-medium">分配角色</div>
          <NCheckboxGroup v-model:value="selectedRoles">
            <NSpace>
              <NCheckbox
                v-for="role in roles"
                :key="role.id"
                :value="role.id"
                :label="role.roleName"
              />
            </NSpace>
          </NCheckboxGroup>
        </div>
      </NSpace>
    </NSpin>
  </Modal>
</template>
