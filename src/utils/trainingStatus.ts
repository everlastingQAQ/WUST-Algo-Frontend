import type { CoreStatisticPeriodData, CoreSubmitLogGetByIdData } from "@/utils/api";

export type TrainingStatusTone =
  | "steady"
  | "rising"
  | "warning"
  | "intense"
  | "night"
  | "explore"
  | "neutral";

export interface TrainingStatusBadge {
  label: string;
  description: string;
  tone: TrainingStatusTone;
}

interface TrainingStatusInput {
  period?: CoreStatisticPeriodData | null;
  recentLogs?: CoreSubmitLogGetByIdData[];
  lastSubmit?: string | number | null;
  maxCount?: number;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isAccepted = (status: string): boolean => {
  const normalized = status.trim().toLowerCase();
  return normalized === "ac" || normalized.includes("accepted");
};

const daysSince = (timestamp?: string | number | null): number | null => {
  const time = toNumber(timestamp);
  if (!time) return null;
  return Math.max(0, (nowSeconds() - time) / 86400);
};

const recentNightRatio = (logs: CoreSubmitLogGetByIdData[]): number | null => {
  if (logs.length < 8) return null;
  const nightCount = logs.filter((log) => {
    const hour = new Date(toNumber(log.time) * 1000).getHours();
    return hour >= 23 || hour < 6;
  }).length;
  return nightCount / logs.length;
};

const uniqueRecentPlatforms = (logs: CoreSubmitLogGetByIdData[]): number => {
  return new Set(logs.map((log) => log.platform).filter(Boolean)).size;
};

const recentAcceptedCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  return logs.filter((log) => isAccepted(log.status)).length;
};

const pushUnique = (list: TrainingStatusBadge[], badge: TrainingStatusBadge) => {
  if (!list.some((item) => item.label === badge.label)) {
    list.push(badge);
  }
};

export const buildTrainingStatuses = ({
  period,
  recentLogs = [],
  lastSubmit,
  maxCount = 3,
}: TrainingStatusInput): TrainingStatusBadge[] => {
  const badges: TrainingStatusBadge[] = [];
  const thisWeekAc = toNumber(period?.ac?.thisWeek);
  const lastWeekAc = toNumber(period?.ac?.lastWeek);
  const thisMonthAc = toNumber(period?.ac?.thisMonth);
  const lastMonthAc = toNumber(period?.ac?.lastMonth);
  const thisWeekSubmit = toNumber(period?.submit?.thisWeek);
  const thisMonthSubmit = toNumber(period?.submit?.thisMonth);
  const totalAc = toNumber(period?.ac?.total);
  const totalSubmit = toNumber(period?.submit?.total);
  const weeklyAcceptRate = thisWeekSubmit > 0 ? thisWeekAc / thisWeekSubmit : null;
  const totalAcceptRate = totalSubmit > 0 ? totalAc / totalSubmit : null;
  const inactiveDays = daysSince(lastSubmit ?? recentLogs[0]?.time);
  const nightRatio = recentNightRatio(recentLogs);
  const platformCount = uniqueRecentPlatforms(recentLogs);
  const recentAc = recentAcceptedCount(recentLogs);

  if (totalSubmit === 0 || (inactiveDays !== null && inactiveDays >= 10)) {
    pushUnique(badges, {
      label: "疑似掉队",
      description: inactiveDays === null ? "暂无提交记录" : `已约 ${Math.floor(inactiveDays)} 天没有提交`,
      tone: "warning",
    });
  }

  if (
    (thisWeekAc >= 8 && thisWeekAc >= Math.max(lastWeekAc * 1.8, lastWeekAc + 5)) ||
    (thisMonthAc >= 20 && thisMonthAc >= Math.max(lastMonthAc * 1.5, lastMonthAc + 10))
  ) {
    pushUnique(badges, {
      label: "爆发上升中",
      description: "近期 AC 增长明显，训练势头很强",
      tone: "rising",
    });
  }

  if (thisWeekSubmit >= 40 || thisMonthSubmit >= 120 || recentAc >= 20) {
    pushUnique(badges, {
      label: "疯狂补题",
      description: "近期提交密度很高，正在集中补训练量",
      tone: "intense",
    });
  }

  if (
    (thisWeekSubmit >= 20 && weeklyAcceptRate !== null && weeklyAcceptRate < 0.35) ||
    (totalSubmit >= 80 && totalAcceptRate !== null && totalAcceptRate < 0.35)
  ) {
    pushUnique(badges, {
      label: "WA 战神",
      description: "提交很多但 AC 占比较低，建议关注调试质量",
      tone: "warning",
    });
  }

  if (nightRatio !== null && nightRatio >= 0.35) {
    pushUnique(badges, {
      label: "夜间训练型",
      description: `近提交中深夜比例约 ${Math.round(nightRatio * 100)}%`,
      tone: "night",
    });
  }

  if (platformCount >= 3) {
    pushUnique(badges, {
      label: "多平台开荒",
      description: "近期覆盖多个 OJ 平台，训练面较广",
      tone: "explore",
    });
  }

  if (!badges.some((item) => item.label === "疑似掉队") && thisWeekSubmit >= 8 && thisMonthAc >= 10) {
    pushUnique(badges, {
      label: "稳定训练中",
      description: "最近保持活跃，有持续提交和 AC",
      tone: "steady",
    });
  }

  if (badges.length === 0) {
    pushUnique(badges, {
      label: "观察期",
      description: "训练数据还不够明显，继续积累后会自动更新状态",
      tone: "neutral",
    });
  }

  return badges.slice(0, maxCount);
};
