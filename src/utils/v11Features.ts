import type {
  CoreStatisticPeriodData,
  CoreStatisticPlatformPeriodItem,
  CoreSubmitLogGetByIdData,
} from "@/utils/api";

export interface AchievementBadge {
  key: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  tone: "cyan" | "blue" | "gold" | "red" | "muted";
}

export interface WeeklyReportMetric {
  label: string;
  value: string;
  hint: string;
}

export interface WeeklyReport {
  title: string;
  summary: string;
  advice: string;
  metrics: WeeklyReportMetric[];
}

export interface TeamDashboardMember {
  userId: number;
  name: string;
  username: string;
  avatar: string;
  acTotal: number;
  submitTotal: number;
  weekAc: number;
  weekSubmit: number;
  monthAc: number;
  monthSubmit: number;
}

export interface TeamDashboard {
  weekAc: number;
  weekSubmit: number;
  monthAc: number;
  activeMembers: number;
  leader: TeamDashboardMember | null;
  members: TeamDashboardMember[];
  summary: string;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

const isAccepted = (status: string): boolean => {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "ac" ||
    normalized.includes("accepted") ||
    normalized.includes("答案正确") ||
    normalized.includes("通过")
  );
};

const problemKey = (log: CoreSubmitLogGetByIdData): string => {
  const platform = String(log.platform || "Unknown").trim();
  const problem = String(log.problem || "").trim();
  const submitId = String(log.submitId || log.id || "").trim();
  return `${platform}:${problem || submitId}`;
};

const logsInDays = (logs: CoreSubmitLogGetByIdData[], days: number) => {
  const start = nowSeconds() - days * 86400;
  return logs.filter((log) => toNumber(log.time) >= start);
};

const logsBetween = (logs: CoreSubmitLogGetByIdData[], start: number, end: number) => {
  return logs.filter((log) => {
    const time = toNumber(log.time);
    return time >= start && time < end;
  });
};

const uniqueAcCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  const accepted = new Set<string>();
  logs.forEach((log) => {
    if (isAccepted(log.status)) {
      accepted.add(problemKey(log));
    }
  });
  return accepted.size;
};

const activeDayCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  return new Set(
    logs.map((log) => new Date(toNumber(log.time) * 1000).toISOString().slice(0, 10)),
  ).size;
};

const nightSubmitRatio = (logs: CoreSubmitLogGetByIdData[]): number => {
  if (logs.length === 0) return 0;
  const nightCount = logs.filter((log) => {
    const hour = new Date(toNumber(log.time) * 1000).getHours();
    return hour >= 23 || hour < 6;
  }).length;
  return nightCount / logs.length;
};

const topPlatform = (logs: CoreSubmitLogGetByIdData[]): string => {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const platform = String(log.platform || "未知平台");
    counts.set(platform, (counts.get(platform) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无平台";
};

const consecutiveTrainingDays = (logs: CoreSubmitLogGetByIdData[]): number => {
  const days = new Set(
    logs.map((log) => new Date(toNumber(log.time) * 1000).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const clampProgress = (value: number, target: number) => {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
};

export const buildAchievementBadges = (
  period: CoreStatisticPeriodData | null,
  recentLogs: CoreSubmitLogGetByIdData[],
  platformStats: CoreStatisticPlatformPeriodItem[],
): AchievementBadge[] => {
  const totalAc = toNumber(period?.ac?.total);
  const totalSubmit = toNumber(period?.submit?.total);
  const thisWeekAc = toNumber(period?.ac?.thisWeek);
  const thisMonthAc = toNumber(period?.ac?.thisMonth);
  const acRate = totalSubmit > 0 ? totalAc / totalSubmit : 0;
  const recent30 = logsInDays(recentLogs, 30);
  const recent7 = logsInDays(recentLogs, 7);
  const platformCount = platformStats.filter((item) => toNumber(item.ac?.total) > 0).length;
  const activeDays7 = activeDayCount(recent7);
  const activeDays30 = activeDayCount(recent30);
  const streak = consecutiveTrainingDays(recentLogs);
  const nightRatio = nightSubmitRatio(recent30);

  const badges: AchievementBadge[] = [
    {
      key: "first-ac",
      label: "初次 AC",
      description: "完成第一道通过题，训练旅程启动。",
      icon: "✓",
      unlocked: totalAc >= 1,
      progress: clampProgress(totalAc, 1),
      tone: "cyan",
    },
    {
      key: "hundred-ac",
      label: "百题斩",
      description: "累计真实 AC 达到 100 题。",
      icon: "100",
      unlocked: totalAc >= 100,
      progress: clampProgress(totalAc, 100),
      tone: "gold",
    },
    {
      key: "thousand-ac",
      label: "千题收藏家",
      description: "累计真实 AC 达到 1000 题。",
      icon: "1K",
      unlocked: totalAc >= 1000,
      progress: clampProgress(totalAc, 1000),
      tone: "gold",
    },
    {
      key: "weekly-runner",
      label: "本周冲刺",
      description: "本周 AC 达到 10 题。",
      icon: "7D",
      unlocked: thisWeekAc >= 10,
      progress: clampProgress(thisWeekAc, 10),
      tone: "blue",
    },
    {
      key: "monthly-builder",
      label: "月度建设者",
      description: "本月 AC 达到 50 题。",
      icon: "30",
      unlocked: thisMonthAc >= 50,
      progress: clampProgress(thisMonthAc, 50),
      tone: "cyan",
    },
    {
      key: "multi-platform",
      label: "多平台开荒",
      description: "在至少 3 个 OJ 平台有 AC 记录。",
      icon: "OJ",
      unlocked: platformCount >= 3,
      progress: clampProgress(platformCount, 3),
      tone: "blue",
    },
    {
      key: "stable-week",
      label: "稳定训练中",
      description: "近 7 天至少 5 天有提交。",
      icon: "稳",
      unlocked: activeDays7 >= 5,
      progress: clampProgress(activeDays7, 5),
      tone: "cyan",
    },
    {
      key: "streak",
      label: "连续训练",
      description: "连续训练 7 天。",
      icon: "连",
      unlocked: streak >= 7,
      progress: clampProgress(streak, 7),
      tone: "gold",
    },
    {
      key: "night-owl",
      label: "夜间训练型",
      description: "近 30 天深夜提交占比超过 30%。",
      icon: "夜",
      unlocked: recent30.length >= 20 && nightRatio >= 0.3,
      progress: clampProgress(nightRatio, 0.3),
      tone: "blue",
    },
    {
      key: "efficient",
      label: "高效选手",
      description: "总提交不少于 50 且真实 AC / 提交达到 40%。",
      icon: "准",
      unlocked: totalSubmit >= 50 && acRate >= 0.4,
      progress: clampProgress(acRate, 0.4),
      tone: "cyan",
    },
    {
      key: "active-month",
      label: "月活达人",
      description: "近 30 天至少 15 天有提交。",
      icon: "活",
      unlocked: activeDays30 >= 15,
      progress: clampProgress(activeDays30, 15),
      tone: "cyan",
    },
  ];

  return badges.sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress);
};

export const buildWeeklyReport = (
  period: CoreStatisticPeriodData | null,
  recentLogs: CoreSubmitLogGetByIdData[],
): WeeklyReport => {
  const now = nowSeconds();
  const currentStart = now - 7 * 86400;
  const previousStart = now - 14 * 86400;
  const currentLogs = logsBetween(recentLogs, currentStart, now + 1);
  const previousLogs = logsBetween(recentLogs, previousStart, currentStart);
  const currentAc = uniqueAcCount(currentLogs);
  const previousAc = uniqueAcCount(previousLogs);
  const currentSubmit = currentLogs.length;
  const activeDays = activeDayCount(currentLogs);
  const growth = currentAc - previousAc;
  const platform = topPlatform(currentLogs);
  const totalAc = toNumber(period?.ac?.total);

  let title = "稳步训练周";
  if (currentAc >= 20 || growth >= 10) title = "爆发上升周";
  else if (activeDays >= 5) title = "稳定训练周";
  else if (currentSubmit >= 30 && currentAc <= 3) title = "调试复盘周";
  else if (currentSubmit === 0) title = "待启动周";

  const growthText = growth > 0 ? `比上周多 ${growth} 题` : growth < 0 ? `比上周少 ${Math.abs(growth)} 题` : "与上周持平";
  const summary = currentSubmit === 0
    ? "本周还没有提交记录，先用一道熟悉题把节奏找回来。"
    : `本周 AC ${currentAc} 题、提交 ${currentSubmit} 次、活跃 ${activeDays} 天，${growthText}，主要活跃于 ${platform}。`;

  let advice = "继续保持当前训练节奏，优先复盘最近 WA 较多的题目。";
  if (currentSubmit === 0) advice = "建议先做 1-2 道低压力题恢复手感。";
  else if (currentSubmit >= 30 && currentAc <= 3) advice = "近期提交不少但 AC 偏少，建议放慢节奏做题解复盘。";
  else if (growth >= 8) advice = "增长很明显，可以趁热增加一组稍高难度训练。";
  else if (activeDays <= 2) advice = "训练天数偏少，建议拆成更小的每日任务。";

  return {
    title,
    summary,
    advice,
    metrics: [
      { label: "本周 AC", value: `${currentAc}`, hint: `累计 ${totalAc} 题` },
      { label: "本周提交", value: `${currentSubmit}`, hint: "包含所有平台" },
      { label: "活跃天数", value: `${activeDays}`, hint: "近 7 天" },
      { label: "较上周", value: growth > 0 ? `+${growth}` : `${growth}`, hint: "AC 变化" },
    ],
  };
};

export const buildTeamDashboard = (members: TeamDashboardMember[]): TeamDashboard => {
  const sorted = [...members].sort((a, b) => b.weekAc - a.weekAc || b.monthAc - a.monthAc || b.acTotal - a.acTotal);
  const weekAc = members.reduce((sum, item) => sum + toNumber(item.weekAc), 0);
  const weekSubmit = members.reduce((sum, item) => sum + toNumber(item.weekSubmit), 0);
  const monthAc = members.reduce((sum, item) => sum + toNumber(item.monthAc), 0);
  const activeMembers = members.filter((item) => toNumber(item.weekSubmit) > 0 || toNumber(item.weekAc) > 0).length;
  const leader = sorted[0] || null;
  const summary = members.length === 0
    ? "暂无团队成员，创建团队后会生成训练看板。"
    : activeMembers === 0
      ? "本周团队还没有提交记录，可以从一次轻量训练开始。"
      : `本周 ${activeMembers}/${members.length} 名成员保持活跃，团队 AC ${weekAc} 题，${leader ? `${leader.name || leader.username} 暂列本周火力位。` : ""}`;

  return {
    weekAc,
    weekSubmit,
    monthAc,
    activeMembers,
    leader,
    members: sorted,
    summary,
  };
};
