# WUST Algo Frontend

WUST Algo Frontend 是 WUST ACM 算法训练数据平台的前端项目，基于 Vue 3、TypeScript 和 Vite 构建。项目用于展示 OJ 绑定、刷题动态、个人资料、团队、消息、数据统计与后台管理等功能。

后端仓库：`https://github.com/everlastingQAQ/WUST-Algo-tracker`

## 功能概览

- 首页统计：总 AC、今日/本周/本月/今年数据，以及 AtCoder、牛客、洛谷、CodeForces、QOJ 平台拆分统计。
- OJ 绑定：支持 AtCoder、NowCoder、LuoGu、CodeForces、QOJ。
- 个人资料：头像链接、邮箱通知、密码修改、团队信息与成员刷题数据。
- 团队系统：创建团队、邀请成员、编辑团队名称和头像、队长管理成员。
- 消息页：默认展示私信会话，支持发送私信、未读提醒、系统消息和团队邀请处理入口。
- 数据统计：公开统计页、用户排名、团队排名、提交趋势图。
- 训练状态：根据近期提交、AC 增长、AC 率、最后提交时间、深夜提交比例和平台覆盖自动给用户打训练标签。
- 后台管理：用户管理、角色/分组调整、密码重置、教练/管理员群发站内消息、系统邀请码配置。
- 主题与布局：支持多主题、响应式统计页、统一页脚。
- 访问控制：未登录用户不可查看动态、比赛和排名数据；统计概览仍可公开查看。

## 当前功能边界

当前版本不包含“两人数据对比”页面，左侧栏没有数据对比入口，个人资料页也不提供“与 TA 对比”按钮。若访问 `/compare`，前端会进入通用 NotFound 页面。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Axios
- ECharts
- Font Awesome

## 本地开发

要求 Node.js `^20.19.0 || >=22.12.0`。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

仅预览构建产物：

```bash
npm run preview
```

## 部署

部署脚本默认配合后端仓库的 `/opt/wust-algo` 目录结构：

```text
/opt/wust-algo/
├── frontend/
├── tracker/
├── bin/
├── conf/
└── infra/
```

准备配置：

```bash
cd /opt/wust-algo/frontend
cp deploy/.env.example deploy/.env
nano deploy/.env
```

关键配置：

- `DOMAIN`：站点域名或 IP。
- `NGINX_PORT`：Nginx 监听端口。
- `USER_UPSTREAM`：用户服务地址，默认 `127.0.0.1:8000`。
- `CORE_UPSTREAM`：核心数据服务地址，默认 `127.0.0.1:8001`。
- `BACKEND_UPSTREAM`：后端 gateway 地址。

执行部署：

```bash
bash deploy/scripts/deploy-frontend.sh
```

脚本会执行依赖安装、生产构建、渲染 Nginx 配置并 reload Nginx。

## 后端接口约定

生产环境 Nginx 会把前端请求反代到后端：

- `/api/user/*` -> 用户服务 `/v1/user/*`
- `/api/core/*` -> 核心数据服务 `/v1/core/*`
- `/api/agent/*` -> AI 总结服务 `/v1/agent/*`

前端会对密码进行 SHA-256 后提交，后端存储和校验的也是哈希值。

## 私信与消息

消息入口位于左侧栏“消息”。默认进入“私信”页签，可搜索用户并发起会话；“系统消息”页签保留团队邀请和系统通知。

前端使用的私信接口：

- `GET /api/user/message/conversations`：会话列表。
- `GET /api/user/message/thread?userId=<id>`：与指定用户的聊天记录。
- `POST /api/user/message/send`：发送私信。
- `POST /api/user/message/read`：标记会话已读。
- `GET /api/user/message/unread-count`：未读数量。
- `POST /api/user/message/broadcast`：教练和管理员群发站内消息。

首页消息卡会显示最近私信提醒；个人资料页查看他人主页时提供“发消息”入口。

## 页面访问规则

- 未登录访问 `/allActivities` 时显示“登录后可以查看动态”，不请求动态接口。
- 未登录访问 `/contest` 或 `/contest/:id` 时显示“登录后可以查看比赛”，不请求比赛接口。
- 未登录访问 `/statistics` 时保留基础统计和趋势图，但隐藏用户排名和团队排名。
- 登录后可查看动态、比赛、排名，并可使用私信功能。

## 训练状态标签

个人资料页会显示最多 3 个训练状态标签，数据统计页的用户排名会显示一个核心状态。标签由前端根据真实数据自动计算：

- `稳定训练中`：最近保持提交和 AC。
- `爆发上升中`：本周或本月 AC 相比上一周期增长明显。
- `疯狂补题`：近期提交密度较高。
- `WA 战神`：提交很多但 AC 比例偏低。
- `夜间训练型`：最近提交中深夜比例较高。
- `多平台开荒`：近期覆盖多个 OJ 平台。
- `疑似掉队`：多天无提交或暂无提交记录。
- `观察期`：数据不足以判断明显状态。

当前提交日志没有题目难度和题单完成字段，因此不会伪造“1700+ 高难突破”或“题单完成”状态；后续如果后端补充题目难度、标签、题单数据，可在 `src/utils/trainingStatus.ts` 中扩展规则。

## 常用维护命令

```bash
npm run build
sudo nginx -t
sudo systemctl reload nginx
```

部署后可验证：

```bash
curl -I http://127.0.0.1:8088/
curl -I http://127.0.0.1:8088/allActivities
curl -I http://127.0.0.1:8088/contest
curl -I http://127.0.0.1:8088/statistics
```

由于 Vue Router history fallback，`/compare` 可能仍返回静态站点 `200`，但页面内容应由前端路由渲染为 NotFound，且构建产物中不应包含数据对比入口。

如果更新后浏览器仍显示旧页面，请强制刷新或清理浏览器缓存。

## 致谢

本项目基于无锡学院相关开源项目继续开发，感谢原项目在 GitHub 上贡献的源码。
