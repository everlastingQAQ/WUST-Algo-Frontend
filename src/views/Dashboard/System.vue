<template>
  <div class="dashboardContent">
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-key" />
          </span>
          <span class="title-text">邀请码设置</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="loadInviteCode">刷新</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loading" />
        <div class="form-grid">
          <div class="field">
            <label>注册邀请码</label>
            <input
              v-model="inviteCode"
              type="text"
              placeholder="请输入注册邀请码"
            />
            <div class="hint">
              默认邀请码为 <code>wustacm666</code>，只有管理员可以修改。
            </div>
          </div>
          <div class="actions">
            <button
              class="action-btn"
              :disabled="loading"
              @click="saveInviteCode"
            >
              保存邀请码
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import API from "@/utils/api";
import Toast from "@/utils/toast";
import LoadingOverlay from "@/components/LoadingOverlay.vue";

const loading = ref(false);
const inviteCode = ref("");

const loadInviteCode = async () => {
  loading.value = true;
  const response = await API.user.system.getRegisterInviteCode();
  Toast.stdResponse(response, false);
  if (response.success) {
    inviteCode.value = response.data.inviteCode;
  }
  loading.value = false;
};

const saveInviteCode = async () => {
  loading.value = true;
  const response = await API.user.system.updateRegisterInviteCode({
    inviteCode: inviteCode.value.trim(),
  });
  Toast.stdResponse(response);
  if (response.success) {
    inviteCode.value = response.data.inviteCode;
  }
  loading.value = false;
};

onMounted(() => {
  loadInviteCode();
});
</script>

<style scoped>
.dashboardContent {
  width: 100%;
}

.section {
  border: 1px solid var(--divider-color);
  background-color: var(--section-background-color);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider-color);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-default-color);
  font-size: var(--text-lg);
}

.header-tabs .tab {
  cursor: pointer;
  color: var(--text-light-color);
  transition: color 0.2s ease-in-out;
}

.header-tabs .tab:hover {
  color: var(--section-active-color);
}

.content {
  padding: 24px 20px;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 520px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field label {
  color: var(--text-default-color);
  font-size: var(--text-base);
}

.field input {
  height: 40px;
  padding: 0 14px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  border-radius: 6px;
  outline: none;
  box-shadow: 0 0 0 100px var(--background-color-1) inset;
}

.field input:focus {
  border-color: var(--input-active-color);
}

.hint {
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.hint code {
  color: var(--section-active-color);
}

.actions {
  display: flex;
}

.action-btn {
  min-width: 120px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  background-color: var(--background-color-1);
  color: var(--text-default-color);
  font-family: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.action-btn:hover:not(:disabled) {
  background-color: var(--section-active-color);
  border-color: var(--section-active-color);
  color: var(--background-color-1);
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
