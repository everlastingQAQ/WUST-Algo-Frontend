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
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
          </span>
          <span class="title-text">抓取任务</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="loadSpiderJobs">刷新</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loadingJobs" />
        <div class="job-toolbar">
          <button
            v-for="item in jobFilters"
            :key="item.value"
            class="job-filter"
            :class="{ active: jobStatus === item.value }"
            @click="setJobStatus(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="job-list" v-if="spiderJobs.length > 0">
          <div
            class="job-card"
            v-for="job in spiderJobs"
            :key="job.jobId"
            :class="`job-${job.status}`"
          >
            <div class="job-main">
              <div class="job-title-row">
                <strong>#{{ job.jobId }}</strong>
                <span>{{ jobStatusLabel(job.status) }}</span>
              </div>
              <div class="job-meta">
                用户 {{ job.userId }} · {{ sourceLabel(job.source) }}
                <template v-if="job.currentPlatform">
                  · {{ job.currentPlatform }}
                </template>
              </div>
              <div v-if="job.error" class="job-error">{{ job.error }}</div>
            </div>
            <div class="job-side">
              <div class="job-time">{{ formatTime(job.updatedAt || job.createdAt) }}</div>
              <div class="job-progress">
                <div :style="{ width: jobProgress(job) + '%' }"></div>
              </div>
              <div class="job-count">
                {{ job.finishedPlatforms }}/{{ job.totalPlatforms || 0 }}
              </div>
              <button
                v-if="job.status === 'failed'"
                class="action-btn retry-btn"
                :disabled="retryingJobs[job.jobId]"
                @click="retrySpiderJob(job.jobId)"
              >
                {{ retryingJobs[job.jobId] ? '重试中' : '重试' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无抓取任务。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import API from "@/utils/api";
import Toast from "@/utils/toast";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import type { SpiderJobInfo } from "@/utils/api";

const loading = ref(false);
const loadingJobs = ref(false);
const inviteCode = ref("");
const spiderJobs = ref<SpiderJobInfo[]>([]);
const jobStatus = ref("");
const retryingJobs = ref<Record<number, boolean>>({});

const jobFilters = [
  { label: "全部", value: "" },
  { label: "排队中", value: "queued" },
  { label: "抓取中", value: "running" },
  { label: "失败", value: "failed" },
  { label: "已完成", value: "success" },
];

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

const loadSpiderJobs = async () => {
  loadingJobs.value = true;
  const response = await API.core.spider.jobs({
    scope: "all",
    status: jobStatus.value || undefined,
    page: 1,
    pageSize: 30,
  });
  Toast.stdResponse(response, false);
  if (response.success) {
    spiderJobs.value = response.data.data || [];
  }
  loadingJobs.value = false;
};

const setJobStatus = (status: string) => {
  jobStatus.value = status;
  loadSpiderJobs();
};

const retrySpiderJob = async (jobId: number) => {
  retryingJobs.value = { ...retryingJobs.value, [jobId]: true };
  const response = await API.core.spider.retry(jobId);
  Toast.stdResponse(response);
  retryingJobs.value = { ...retryingJobs.value, [jobId]: false };
  if (response.success) {
    await loadSpiderJobs();
  }
};

const jobStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    queued: "排队中",
    running: "抓取中",
    success: "已完成",
    failed: "失败",
  };
  return map[status] || status;
};

const sourceLabel = (source: string) => {
  const map: Record<string, string> = {
    manual: "手动刷新",
    cron: "定时刷新",
    bind: "绑定触发",
  };
  return map[source] || source || "未知来源";
};

const jobProgress = (job: SpiderJobInfo) => {
  if (job.status === "success") return 100;
  if (job.totalPlatforms <= 0) return job.status === "running" ? 20 : 8;
  return Math.max(8, Math.min(100, Math.round((job.finishedPlatforms / job.totalPlatforms) * 100)));
};

const formatTime = (timestamp: number) => {
  if (!timestamp) return "未知时间";
  return new Date(timestamp * 1000).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

onMounted(() => {
  loadInviteCode();
  loadSpiderJobs();
});
</script>

<style scoped>
.dashboardContent {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.job-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.job-filter {
  min-width: 72px;
}

.retry-btn {
  min-width: 64px;
  height: 30px;
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.job-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  background-color: var(--background-color-1);
}

.job-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-default-color);
}

.job-title-row span {
  color: var(--section-active-color);
  font-size: var(--text-sm);
}

.job-meta,
.job-time,
.job-count,
.empty {
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.job-error {
  margin-top: 8px;
  color: #ff8585;
  font-size: var(--text-xs);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.job-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
}

.job-progress {
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background-color: var(--background-color-2);
}

.job-progress div {
  height: 100%;
  border-radius: inherit;
  background-color: var(--section-active-color);
}

.job-failed .job-progress div {
  background-color: #ff8585;
}

.job-success .job-progress div {
  background-color: var(--active-color);
}

@media (max-width: 720px) {
  .header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .content {
    padding: 18px 14px;
  }

  .job-card {
    grid-template-columns: 1fr;
  }

  .job-side {
    align-items: stretch;
  }
}
</style>
