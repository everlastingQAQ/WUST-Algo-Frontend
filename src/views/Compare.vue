<template>
  <BaseLayout>
    <div class="compare-page">
      <div class="page-hero">
        <div>
          <div class="eyebrow">Compare</div>
          <h1>两人数据对比</h1>
          <p>选择两名用户，查看阶段数据、平台分布、提交趋势和共同 AC 情况。</p>
        </div>
        <button class="ghost-button" @click="resetCompare">重新选择</button>
      </div>

      <div class="selectors">
        <div class="selector-card" v-for="side in selectorSides" :key="side.key">
          <div class="selector-heading">
            <span>{{ side.title }}</span>
            <strong v-if="side.user">{{ side.user.name || side.user.username }}</strong>
          </div>
          <div class="search-row">
            <input
              v-model="searchForms[side.key].keyword"
              placeholder="输入昵称搜索用户"
              @keyup.enter="searchUsers(side.key)"
            />
            <button @click="searchUsers(side.key)" :disabled="searchForms[side.key].loading">搜索</button>
          </div>
          <div class="candidate-list" v-if="searchForms[side.key].results.length > 0">
            <button
              class="candidate"
              v-for="candidate in searchForms[side.key].results"
              :key="candidate.userId"
              @click="selectUser(side.key, Number(candidate.userId))"
            >
              <img :src="candidate.avatar || '/images/defaultAvatar.png'" alt="" />
              <span>{{ candidate.name || candidate.username }}</span>
              <small>@{{ candidate.username }}</small>
            </button>
          </div>
        </div>
      </div>

      <LoadingOverlay :show="loading" />

      <div v-if="!hasBothUsers" class="empty-state">
        请选择两名用户开始对比。
      </div>

      <template v-else>
        <div class="user-cards">
          <div class="user-card left-card">
            <img :src="leftUser?.avatar || '/images/defaultAvatar.png'" alt="" />
            <div class="user-main">
              <span class="side-label">左侧用户</span>
              <strong>{{ leftUser?.name || leftUser?.username }}</strong>
              <small>@{{ leftUser?.username }}</small>
              <em>{{ teamNames.left }}</em>
            </div>
            <div class="mini-stats">
              <div><span>{{ leftPeriod.ac.total }}</span><small>总 AC</small></div>
              <div><span>{{ leftPeriod.submit.total }}</span><small>总提交</small></div>
              <div><span>{{ acRate(leftPeriod) }}</span><small>AC 率</small></div>
            </div>
          </div>
          <div class="user-card right-card">
            <img :src="rightUser?.avatar || '/images/defaultAvatar.png'" alt="" />
            <div class="user-main">
              <span class="side-label">右侧用户</span>
              <strong>{{ rightUser?.name || rightUser?.username }}</strong>
              <small>@{{ rightUser?.username }}</small>
              <em>{{ teamNames.right }}</em>
            </div>
            <div class="mini-stats">
              <div><span>{{ rightPeriod.ac.total }}</span><small>总 AC</small></div>
              <div><span>{{ rightPeriod.submit.total }}</span><small>总提交</small></div>
              <div><span>{{ acRate(rightPeriod) }}</span><small>AC 率</small></div>
            </div>
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric-card" v-for="metric in metrics" :key="metric.key">
            <div class="metric-title">{{ metric.title }}</div>
            <div class="metric-values">
              <span>{{ metric.left }}</span>
              <strong>{{ diffText(metric.left, metric.right) }}</strong>
              <span>{{ metric.right }}</span>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-heading">
            <span>提交趋势</span>
            <small>展示两人的 AC 与提交曲线</small>
          </div>
          <div class="chart-wrap">
            <v-chart class="chart" :option="chartOption" autoresize />
          </div>
        </div>

        <div class="split-grid">
          <div class="section-card">
            <div class="section-heading">
              <span>平台分布</span>
              <small>AC / 提交</small>
            </div>
            <div class="platform-list">
              <div class="platform-row" v-for="row in platformRows" :key="row.platform">
                <div class="platform-name">{{ row.label }}</div>
                <div class="platform-values">
                  <span>{{ row.leftAc }} / {{ row.leftSubmit }}</span>
                  <strong>{{ diffText(row.leftAc, row.rightAc) }}</strong>
                  <span>{{ row.rightAc }} / {{ row.rightSubmit }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-heading">
              <span>共同 AC</span>
              <small>按平台和题目去重</small>
            </div>
            <div class="overlap-grid">
              <div>
                <span>{{ compareData?.overlap.commonAcCount || 0 }}</span>
                <small>共同 AC</small>
              </div>
              <div>
                <span>{{ compareData?.overlap.leftOnlyAcCount || 0 }}</span>
                <small>左侧独有</small>
              </div>
              <div>
                <span>{{ compareData?.overlap.rightOnlyAcCount || 0 }}</span>
                <small>右侧独有</small>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-heading">
            <span>近期动态</span>
            <small>最近 10 条提交</small>
          </div>
          <div class="activities-compare">
            <div class="activity-column">
              <strong>{{ leftUser?.name || leftUser?.username }}</strong>
              <div v-if="leftRecent.length === 0" class="activity-empty">暂无提交</div>
              <a
                v-for="activity in leftRecent"
                :key="activity.id"
                :href="submitLink(activity)"
                target="_blank"
                class="activity-item"
              >
                <span>{{ activity.platform }} · {{ activity.problem || activity.contest }}</span>
                <small>{{ activity.status }} · {{ formatTime(activity.time) }}</small>
              </a>
            </div>
            <div class="activity-column">
              <strong>{{ rightUser?.name || rightUser?.username }}</strong>
              <div v-if="rightRecent.length === 0" class="activity-empty">暂无提交</div>
              <a
                v-for="activity in rightRecent"
                :key="activity.id"
                :href="submitLink(activity)"
                target="_blank"
                class="activity-item"
              >
                <span>{{ activity.platform }} · {{ activity.problem || activity.contest }}</span>
                <small>{{ activity.status }} · {{ formatTime(activity.time) }}</small>
              </a>
            </div>
          </div>
        </div>
      </template>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from "@/components/BaseLayout.vue";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import API, {
  type CoreStatisticCompareData,
  type CoreStatisticCompareSide,
  type CoreStatisticCompareSubmitLogData,
  type CoreStatisticPeriodData,
  type CoreStatisticPlatformPeriodItem,
  type UserProfileGetByNameList,
} from "@/utils/api";
import Link from "@/utils/link";
import Toast from "@/utils/toast";
import type { User, platform } from "@/utils/type";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import VChart from "vue-echarts";

use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
]);

type SideKey = "left" | "right";

interface Candidate extends UserProfileGetByNameList {
  avatar?: string;
  username?: string;
}

const route = useRoute();
const router = useRouter();
const leftUser = ref<User | null>(null);
const rightUser = ref<User | null>(null);
const leftUserId = ref(0);
const rightUserId = ref(0);
const compareData = ref<CoreStatisticCompareData | null>(null);
const loading = ref(false);
const isCompactScreen = ref(false);
const teamNames = reactive<Record<SideKey, string>>({
  left: "无团队",
  right: "无团队",
});

const searchForms = reactive<Record<SideKey, { keyword: string; loading: boolean; results: Candidate[] }>>({
  left: { keyword: "", loading: false, results: [] },
  right: { keyword: "", loading: false, results: [] },
});

const selectorSides = computed(() => [
  { key: "left" as const, title: "选择左侧用户", user: leftUser.value },
  { key: "right" as const, title: "选择右侧用户", user: rightUser.value },
]);

const emptyPeriod = (): CoreStatisticPeriodData => ({
  ac: {
    lastMonth: 0,
    lastWeek: 0,
    lastYear: 0,
    thisMonth: 0,
    thisWeek: 0,
    thisYear: 0,
    today: 0,
    total: 0,
  },
  submit: {
    lastMonth: 0,
    lastWeek: 0,
    lastYear: 0,
    thisMonth: 0,
    thisWeek: 0,
    thisYear: 0,
    today: 0,
    total: 0,
  },
});

const normalizePeriodItem = (item?: Partial<CoreStatisticPeriodData["ac"]>) => ({
  ...emptyPeriod().ac,
  ...(item || {}),
});

const normalizePeriod = (period?: CoreStatisticPeriodData): CoreStatisticPeriodData => ({
  ac: normalizePeriodItem(period?.ac),
  submit: normalizePeriodItem(period?.submit),
});

const leftSide = computed<CoreStatisticCompareSide | null>(() => compareData.value?.left || null);
const rightSide = computed<CoreStatisticCompareSide | null>(() => compareData.value?.right || null);
const leftPeriod = computed(() => normalizePeriod(leftSide.value?.period));
const rightPeriod = computed(() => normalizePeriod(rightSide.value?.period));
const leftRecent = computed(() => leftSide.value?.recentSubmits || []);
const rightRecent = computed(() => rightSide.value?.recentSubmits || []);
const hasBothUsers = computed(() => Boolean(leftUser.value && rightUser.value));

const platformLabels: Record<string, string> = {
  AtCoder: "AtCoder",
  NowCoder: "牛客",
  LuoGu: "洛谷",
  CodeForces: "CodeForces",
  QOJ: "QOJ",
};
const platformOrder = ["AtCoder", "NowCoder", "LuoGu", "CodeForces", "QOJ"];

const syncScreenSize = () => {
  isCompactScreen.value = window.innerWidth <= 700;
};

const padZero = (value: number) => (value < 10 ? `0${value}` : `${value}`);

const todayString = () => {
  const now = new Date();
  return `${now.getFullYear()}${padZero(now.getMonth() + 1)}${padZero(now.getDate())}`;
};

const acRate = (period: CoreStatisticPeriodData) => {
  const submitTotal = Number(period.submit.total || 0);
  const acTotal = Number(period.ac.total || 0);
  if (!submitTotal) return "0%";
  return `${((acTotal / submitTotal) * 100).toFixed(1)}%`;
};

const diffText = (left: number, right: number) => {
  const diff = Number(left) - Number(right);
  if (diff === 0) return "持平";
  return diff > 0 ? `左 +${diff}` : `右 +${Math.abs(diff)}`;
};

const metrics = computed(() => [
  { key: "todayAc", title: "今日 AC", left: leftPeriod.value.ac.today, right: rightPeriod.value.ac.today },
  { key: "weekAc", title: "本周 AC", left: leftPeriod.value.ac.thisWeek, right: rightPeriod.value.ac.thisWeek },
  { key: "monthAc", title: "本月 AC", left: leftPeriod.value.ac.thisMonth, right: rightPeriod.value.ac.thisMonth },
  { key: "yearAc", title: "今年 AC", left: leftPeriod.value.ac.thisYear, right: rightPeriod.value.ac.thisYear },
  { key: "totalAc", title: "总 AC", left: leftPeriod.value.ac.total, right: rightPeriod.value.ac.total },
  { key: "totalSubmit", title: "总提交", left: leftPeriod.value.submit.total, right: rightPeriod.value.submit.total },
]);

const platformMap = (items?: CoreStatisticPlatformPeriodItem[]) => {
  const map = new Map<string, CoreStatisticPlatformPeriodItem>();
  (items || []).forEach((item) => map.set(item.platform, item));
  return map;
};

const platformRows = computed(() => {
  const leftMap = platformMap(leftSide.value?.platformPeriod);
  const rightMap = platformMap(rightSide.value?.platformPeriod);
  return platformOrder.map((name) => {
    const left = leftMap.get(name);
    const right = rightMap.get(name);
    return {
      platform: name,
      label: platformLabels[name],
      leftAc: left?.ac.total || 0,
      rightAc: right?.ac.total || 0,
      leftSubmit: left?.submit.total || 0,
      rightSubmit: right?.submit.total || 0,
    };
  });
});

const chartOption = computed(() => {
  const leftDates = leftSide.value?.heatmapSubmit.map((item) => item.date) || [];
  const rightDates = rightSide.value?.heatmapSubmit.map((item) => item.date) || [];
  const dates = leftDates.length >= rightDates.length ? leftDates : rightDates;
  const toMap = (items = [] as { date: string; count: number }[]) =>
    new Map(items.map((item) => [item.date, item.count]));

  const leftSubmit = toMap(leftSide.value?.heatmapSubmit);
  const leftAc = toMap(leftSide.value?.heatmapAc);
  const rightSubmit = toMap(rightSide.value?.heatmapSubmit);
  const rightAc = toMap(rightSide.value?.heatmapAc);
  const startIndex = Math.max(0, dates.length - 30);
  const divisor = Math.max(dates.length - 1, 1);

  return {
    tooltip: { trigger: "axis" },
    legend: {
      top: isCompactScreen.value ? 4 : 0,
      left: isCompactScreen.value ? "center" : "left",
      data: ["左 AC", "左提交", "右 AC", "右提交"],
    },
    grid: {
      top: isCompactScreen.value ? 56 : 48,
      left: isCompactScreen.value ? 8 : "3%",
      right: isCompactScreen.value ? 8 : "4%",
      bottom: isCompactScreen.value ? 40 : 64,
      containLabel: true,
    },
    xAxis: [{
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLabel: {
        hideOverlap: true,
        formatter(value: string) {
          const date = new Date(value);
          return `${date.getMonth() + 1}-${date.getDate()}`;
        },
      },
    }],
    yAxis: [{ type: "value", splitLine: { show: false } }],
    dataZoom: [
      { type: "inside", start: (startIndex / divisor) * 100, end: 100 },
      { show: !isCompactScreen.value, start: (startIndex / divisor) * 100, end: 100 },
    ],
    series: [
      { name: "左 AC", type: "line", smooth: true, showSymbol: false, data: dates.map((date) => leftAc.get(date) || 0) },
      { name: "左提交", type: "line", smooth: true, showSymbol: false, data: dates.map((date) => leftSubmit.get(date) || 0) },
      { name: "右 AC", type: "line", smooth: true, showSymbol: false, data: dates.map((date) => rightAc.get(date) || 0) },
      { name: "右提交", type: "line", smooth: true, showSymbol: false, data: dates.map((date) => rightSubmit.get(date) || 0) },
    ],
  };
});

const getTeamName = async (user: User | null) => {
  const groupId = Number(user?.groupId || 0);
  if (!groupId) return "无团队";
  const response = await API.user.team.detail(groupId);
  return response.success ? response.data.name || `团队 ${groupId}` : `团队 ${groupId}`;
};

const loadUser = async (side: SideKey, userId: number) => {
  const response = await API.user.profile.getById(userId);
  Toast.stdResponse(response, false);
  if (!response.success) return false;
  if (side === "left") {
    leftUser.value = response.data;
    leftUserId.value = Number(response.data.userId);
    teamNames.left = await getTeamName(response.data);
  } else {
    rightUser.value = response.data;
    rightUserId.value = Number(response.data.userId);
    teamNames.right = await getTeamName(response.data);
  }
  return true;
};

const loadCompare = async () => {
  if (!leftUserId.value || !rightUserId.value) return;
  loading.value = true;
  const response = await API.core.statistic.compare({
    leftUserId: leftUserId.value,
    rightUserId: rightUserId.value,
    startDate: "20230101",
    endDate: todayString(),
  });
  Toast.stdResponse(response, false);
  if (response.success) {
    compareData.value = response.data.data;
  }
  loading.value = false;
};

const loadFromRoute = async () => {
  const left = Number(route.query.left || 0);
  const right = Number(route.query.right || 0);
  if (left > 0) await loadUser("left", left);
  if (right > 0) await loadUser("right", right);
  await loadCompare();
};

const updateRoute = async () => {
  await router.replace({
    path: "/compare",
    query: {
      ...(leftUserId.value ? { left: leftUserId.value } : {}),
      ...(rightUserId.value ? { right: rightUserId.value } : {}),
    },
  });
};

const selectUser = async (side: SideKey, userId: number) => {
  const ok = await loadUser(side, userId);
  if (!ok) return;
  searchForms[side].results = [];
  await updateRoute();
  await loadCompare();
};

const searchUsers = async (side: SideKey) => {
  const keyword = searchForms[side].keyword.trim();
  if (!keyword) {
    Toast.warn("请输入昵称搜索用户");
    return;
  }
  searchForms[side].loading = true;
  const response = await API.user.profile.getByName(keyword);
  Toast.stdResponse(response, false);
  if (response.success) {
    const results = await Promise.all(
      response.data.list.slice(0, 8).map(async (item) => {
        const detail = await API.user.profile.getById(Number(item.userId));
        return {
          ...item,
          avatar: detail.success ? detail.data.avatar : "",
          username: detail.success ? detail.data.username : "",
          name: detail.success ? detail.data.name : item.name,
        };
      }),
    );
    searchForms[side].results = results;
    if (results.length === 0) Toast.info("没有找到匹配用户");
  }
  searchForms[side].loading = false;
};

const resetCompare = async () => {
  leftUser.value = null;
  rightUser.value = null;
  leftUserId.value = 0;
  rightUserId.value = 0;
  compareData.value = null;
  teamNames.left = "无团队";
  teamNames.right = "无团队";
  await router.replace("/compare");
};

const submitLink = (activity: CoreStatisticCompareSubmitLogData) =>
  Link.getSubmitLink(activity.platform as platform, activity.contest, activity.submitId);

const formatTime = (time: string | number) => {
  const value = Number(time);
  if (!value) return "未知时间";
  return new Date(value * 1000).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

onMounted(async () => {
  syncScreenSize();
  window.addEventListener("resize", syncScreenSize);
  await loadFromRoute();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncScreenSize);
});
</script>

<style scoped>
.compare-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: 20px 0;
  color: var(--text-default-color);
}

.page-hero,
.selector-card,
.user-card,
.metric-card,
.section-card {
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  background: var(--background-color-content);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}

.page-hero h1 {
  margin: 4px 0 8px;
  font-size: clamp(1.6rem, 4vw, 2.5rem);
}

.page-hero p {
  margin: 0;
  color: var(--text-light-color);
}

.eyebrow,
.side-label {
  color: var(--neon-cyan);
  font-size: var(--text-xs);
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.ghost-button,
.search-row button,
.candidate,
.metric-card,
.activity-item {
  font-family: inherit;
}

.ghost-button,
.search-row button {
  flex-shrink: 0;
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  color: var(--text-default-color);
  background: var(--background-color-1);
  cursor: pointer;
  padding: 8px 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.ghost-button:hover,
.search-row button:hover {
  border-color: var(--input-active-color);
  background: var(--background-color-2);
}

.selectors,
.user-cards,
.split-grid,
.activities-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.selector-card,
.section-card {
  padding: 16px;
}

.selector-heading,
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-heading span {
  font-size: var(--text-lg);
  font-weight: 800;
}

.section-heading small,
.selector-heading strong {
  color: var(--text-light-color);
}

.search-row {
  display: flex;
  gap: 10px;
}

.search-row input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  outline: none;
  color: var(--text-default-color);
  background: var(--background-color-1);
  padding: 9px 11px;
  font-family: inherit;
}

.search-row input:focus {
  border-color: var(--input-active-color);
  background: var(--background-color-2);
}

.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.candidate {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 8px;
  color: var(--text-default-color);
  background: transparent;
  cursor: pointer;
  padding: 7px;
  text-align: left;
}

.candidate:hover {
  background: var(--background-color-2);
}

.candidate img,
.user-card img {
  border: 1px solid var(--divider-color);
  border-radius: 50%;
  object-fit: cover;
}

.candidate img {
  width: 32px;
  height: 32px;
}

.candidate span,
.candidate small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate small {
  color: var(--text-light-color);
}

.empty-state {
  padding: 56px 20px;
  border: 1px dashed var(--divider-color);
  border-radius: 12px;
  color: var(--text-light-color);
  text-align: center;
}

.user-card {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
}

.user-card img {
  width: 72px;
  height: 72px;
}

.user-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.user-main strong {
  font-size: var(--text-xl);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-main small,
.user-main em {
  color: var(--text-light-color);
  font-style: normal;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(70px, 1fr));
  gap: 8px;
}

.mini-stats div,
.overlap-grid div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  background: var(--section-background-color);
  padding: 10px;
}

.mini-stats span,
.overlap-grid span {
  color: var(--neon-cyan);
  font-size: var(--text-lg);
  font-weight: 900;
}

.mini-stats small,
.overlap-grid small {
  color: var(--text-light-color);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  padding: 14px;
}

.metric-title {
  color: var(--text-light-color);
  font-size: var(--text-sm);
}

.metric-values,
.platform-values {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.metric-values span,
.platform-values span {
  font-size: var(--text-lg);
  font-weight: 800;
}

.metric-values span:last-child,
.platform-values span:last-child {
  text-align: right;
}

.metric-values strong,
.platform-values strong {
  color: var(--text-light-color);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.chart-wrap {
  width: 100%;
  height: clamp(320px, 42vh, 480px);
}

.chart {
  width: 100%;
  height: 100%;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.platform-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--divider-color);
}

.platform-row:last-child {
  border-bottom: none;
}

.platform-name {
  color: var(--text-light-color);
}

.overlap-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.activity-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.activity-column > strong {
  color: var(--neon-cyan);
}

.activity-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 8px;
  color: var(--text-default-color);
  padding: 8px;
  text-decoration: none;
}

.activity-item:hover {
  background: var(--background-color-2);
}

.activity-item span,
.activity-item small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-item small,
.activity-empty {
  color: var(--text-light-color);
}

@media (max-width: 900px) {
  .selectors,
  .user-cards,
  .split-grid,
  .activities-compare {
    grid-template-columns: 1fr;
  }

  .user-card {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .user-card img {
    width: 56px;
    height: 56px;
  }

  .mini-stats {
    grid-column: 1 / -1;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .compare-page {
    width: 100%;
    padding: 0;
  }

  .page-hero {
    align-items: flex-start;
    flex-direction: column;
    border-left: none;
    border-right: none;
    border-radius: 0;
  }

  .metric-grid,
  .overlap-grid {
    grid-template-columns: 1fr;
  }

  .chart-wrap {
    height: 320px;
  }
}
</style>
