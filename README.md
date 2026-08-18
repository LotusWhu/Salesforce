# 邻里帮 RenRenBang

面向海外华人社区的生活服务平台，覆盖 iOS / Android / Web 三端，一个 App 搞定：

- **跑腿代办**（类似 Airtasker / 咸鱼帮忙）：发布任务 → 报价 → 接单 → 完成确认，覆盖代买票、代看房拍照、代排队、代购、搬家帮手等。
- **上门服务预约**：居家保洁、上门美甲、钢琴教学等，选时段下单，**短信验证码确认预约**，确认后自动**同步到服务提供者的 Google 日历**。
- **拼车接送机**（类似 Nearme）：接送机/市内拼车，可填航班号方便举牌接机，费用按座位均摊。
- **分类信息**（类似 Craigslist）：二手交易、租房、招聘求职、社区活动等本地分类信息。

默认面向澳洲华人社区（AUD 计价、+61 手机号、中文优先界面），架构上不绑定单一城市/国家，可扩展至北美等其他市场。

## 技术架构

Monorepo（pnpm workspaces），前后端 TypeScript 全栈：

```
apps/
  api/      NestJS + Prisma + PostgreSQL —— 后端 API
  web/      Next.js (App Router) + Tailwind —— 网页版
  mobile/   Expo (React Native) + expo-router —— iOS / Android App
packages/
  shared-types/   三端共用的枚举 / DTO / interface 类型定义
```

- **认证**：手机号 + 短信验证码（Twilio）登录，JWT 签发。
- **支付**：Stripe PaymentIntent，担保交易（escrow）风格 —— 下单先 HELD，任务/预约确认完成后再 RELEASED。
- **日历同步**：Google Calendar OAuth，预约确认后为服务提供者创建日程事件。
- **数据库**：PostgreSQL + Prisma，Schema 见 `apps/api/prisma/schema.prisma`，覆盖四大模块 + 用户/评价/聊天/支付/通知等通用能力。

## 本地开发

### 环境准备

```bash
corepack enable   # 或自行安装 pnpm
docker compose up -d   # 启动本地 PostgreSQL (见根目录 docker-compose.yml)
pnpm install
```

### 后端 API

```bash
cp apps/api/.env.example apps/api/.env   # 填入 DATABASE_URL / TWILIO_* / GOOGLE_* / STRIPE_* 等
pnpm --filter @renrenbang/api prisma:generate
pnpm --filter @renrenbang/api prisma:migrate
pnpm dev:api        # http://localhost:3001  (Swagger 文档: /docs)
```

开发环境下如果没有配置 `TWILIO_*`，验证码不会真实发送短信，接口会在响应里返回 `debugCode` 字段方便本地测试。

### 网页版

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web        # http://localhost:3000
```

### iOS / Android App (Expo)

```bash
cp apps/mobile/.env.example apps/mobile/.env
pnpm dev:mobile     # 打开 Expo Dev Tools，用 Expo Go 扫码，或按 i/a 启动模拟器
```

## 主要环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | 短信验证码发送 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_OAUTH_REDIRECT_URL` | Google Calendar 授权，用于预约同步日程 |
| `STRIPE_SECRET_KEY` | 支付 / 服务费 / 担保交易 |
| `NEXT_PUBLIC_API_URL` (web) / `EXPO_PUBLIC_API_URL` (mobile) | 前端指向后端 API 的地址 |

## 目录速览

- `apps/api/prisma/schema.prisma`：完整数据模型（User、Task/TaskOffer、ServiceListing/Booking、CarpoolTrip/CarpoolBooking、ClassifiedListing、Review、Payment、Notification 等）。
- `apps/api/src/{tasks,services,carpool,classifieds}`：四大业务模块的 NestJS Controller/Service/DTO。
- `apps/web/src/app/{tasks,services,carpool,classifieds}`：网页版对应页面（列表/发布/详情）。
- `apps/mobile/app/(tabs)/{tasks,services,carpool,classifieds}`：App 端对应页面，底部 Tab + 二级 Stack 导航。
- `packages/shared-types`：三端共用类型，新增字段/枚举时优先在这里改，再同步各端使用处。

## 当前进度与后续规划

已完成四大模块的核心闭环（发布 → 处理 → 确认/完成）、手机号验证码登录、Google Calendar 预约同步、Stripe 支付意向创建。后续可继续完善：

- 图片上传（当前以 URL 字符串形式传入，需接入对象存储如 S3/R2 + 客户端上传组件）
- 地图选点与真实地理编码（当前 `GeoPoint` 支持 lat/lng，前端表单暂用占位坐标 0,0，需接入 Google Places/Maps SDK）
- 站内消息聊天页面（数据模型已设计 `Conversation`/`Message`，尚未接 UI）
- 支付担保交易的释放/退款触发逻辑、Stripe Connect 分账给跑腿者/服务提供者/车主
- 推送通知（`Notification` 表已就位，可接 Expo Push / FCM / APNs）
- 多城市/多语言（en/zh）切换的完整落地
