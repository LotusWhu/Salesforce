# LocalHub

> **LocalHub 是技术占位名**，不是最终品牌名（品牌/商标需要另外确认，确定后全局替换 `@localhub/*` 包名、bundle id、UI 文案即可，详见下方"改名"说明）。

面向海外华人社区的生活服务平台，覆盖 iOS / Android / Web 三端，一个 App 搞定：

- **跑腿代办**（类似 Airtasker / 咸鱼帮忙）：发布任务 → 报价 → 接单 → 完成确认，覆盖代买票、代看房拍照、代排队、代购、搬家帮手等。发布者可勾选**加急**标记，任务列表支持"只看加急"筛选。
- **上门服务预约**（对标咸鱼/一亿网 + Airtasker 两种模式）：不强制按分类拆档，改为服务提供者发布时自行勾选**支持"即时"快速下单**（一键选中最早可用时间段即可预约，适合保洁、美甲等标准化服务；钢琴教学等非标服务也可以按需开启）。下单后**短信验证码确认预约**，确认后自动**同步到服务提供者的 Google 日历**。
- **拼车接送机**（对标 NearMe）：To Airport / From Airport 表单（机场+航站楼、接送地点、登车时间或航班到达时间、乘客/行李数、单程往返、时间灵活度）。乘客发起需求后系统**自动匹配到已有行程**（就近时间优先），匹配不到则进入待匹配池，等司机发布新行程时自动吸纳；**单价随拼车人数增多动态下调**，愿意等待、拼进更多人的车更便宜。
- **分类信息**（对标 yeeyi 分类信息）：本地资讯、房屋租赁/交易、车辆交易、求职招聘、二手市场、生意买卖、宠物交易、会计税务、物流搬运、清洁通渠、园艺绿化、水管电工、保姆月嫂、建筑家装、驾校招生、贷款、生活服务等近 20 个分类。

默认面向澳洲华人社区（AUD 计价、+61 手机号、中文优先界面），架构上不绑定单一城市/国家，可扩展至北美等其他市场。

## 关于改名

`LocalHub` 只是开发阶段的技术占位名，全局替换脚本如下（品牌名确定后执行一次即可）：

```bash
# 把 NEW_NAME 换成正式品牌名（建议用不含空格的英文标识符）
grep -rl "localhub\|LocalHub" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" --include="*.yml" . \
  | grep -v node_modules | xargs sed -i \
    -e 's/@localhub\//@NEW_NAME\//g' \
    -e 's/LocalHub/NEW_DISPLAY_NAME/g' \
    -e 's/localhub/NEW_NAME/g'
pnpm install   # 重新生成 lockfile
```
执行后记得同步改 `apps/mobile/app.json` 里的 `bundleIdentifier`/`package`（应用商店一旦发布这两个 ID 不能再改），以及 `docker-compose.yml` 的数据库名。

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
pnpm --filter @localhub/api prisma:generate
pnpm --filter @localhub/api prisma:migrate
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
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_OAUTH_REDIRECT_URL` | Google Calendar 授权，用于预约同步日程；`GOOGLE_OAUTH_REDIRECT_URL` 需配置成 API 的 `/me/google-calendar/callback` |
| `WEB_APP_URL` | 网页版地址，Google 授权完成后由 API 跳转回网页版 `/me` |
| `STRIPE_SECRET_KEY` | 支付 / 服务费 / 担保交易 |
| `NEXT_PUBLIC_API_URL` (web) / `EXPO_PUBLIC_API_URL` (mobile) | 前端指向后端 API 的地址 |

## 目录速览

- `apps/api/prisma/schema.prisma`：完整数据模型（User、Task/TaskOffer、ServiceListing/Booking、CarpoolTrip/CarpoolBooking/CarpoolRequest、ClassifiedListing、Review、Payment、Notification 等）。
- `apps/api/src/carpool/carpool.service.ts`：拼车自动匹配 + 动态定价核心逻辑（`matchPendingRequestsToTrip` / `computePricePerSeat`）。
- `apps/api/src/services/services.service.ts`：`getNextAvailable` 计算支持"即时"下单服务的最早可预约时段。
- `apps/api/src/users/users.controller.ts`：`me/google-calendar/callback` 是 Google OAuth 授权后浏览器直接跳转的公开回调（无需 JWT，身份靠 `state` 里的 userId 还原），完成后跳回网页版 `/me`。
- `apps/api/src/{tasks,services,carpool,classifieds}`：四大业务模块的 NestJS Controller/Service/DTO。
- `apps/web/src/app/{tasks,services,carpool,classifieds}`：网页版对应页面（列表/发布/详情）。
- `apps/web/src/app/me`：个人中心（连接/断开 Google 日历）+ `me/schedule`（服务提供者预约日程，按日期分组，可标记完成/取消，供个体户如钢琴老师管理自己的预约）。
- `apps/mobile/app/(tabs)/{tasks,services,carpool,classifieds}`：App 端对应页面，底部 Tab + 二级 Stack 导航。
- `apps/mobile/app/(tabs)/profile`：`index.tsx` 个人中心（含 Google 日历连接入口），`schedule.tsx` 预约日程管理，与网页版逻辑对应。
- `packages/shared-types`：三端共用类型，新增字段/枚举时优先在这里改，再同步各端使用处。

## 地图功能 (List/Map 切换 + 地图选点)

跑腿任务、上门服务、分类信息三个模块都支持 **列表 / 地图** 视图切换、关键词搜索、分类筛选，发布表单里可以直接在地图上点选位置（对标 realestate.com.au 的浏览体验）。

当前用 **OpenStreetMap 免费瓦片占位**（不需要 API Key/计费），架构上做了 Provider 抽象，后续换 Google Maps 只需要改这两个文件，调用方（列表页/表单）的 props 接口不用动：

- 网页版：`apps/web/src/components/MapView.tsx`（Leaflet + `react-leaflet`，`DynamicMapView.tsx` 做了 `next/dynamic` 的 SSR 禁用包装）
- App 端：`apps/mobile/src/components/MapView.tsx`（`react-native-webview` 里内嵌一个自包含的 Leaflet HTML 页面，这样 iOS/Android 都不需要 Google Maps SDK/API Key 就能跑）
- 两端都配了 `apps/*/src/components/LocationPicker.tsx`：点击地图选点 + 可选地址描述文本，回填到发布表单的 `location: {lat, lng, address}` 字段

⚠️ 地图瓦片（`tile.openstreetmap.org`）走的是真实外网请求，本仓库当前的开发沙箱网络策略屏蔽了这类外部域名，所以瓦片图片在这个沙箱里加载不出来（会看到空白/灰色底图），但地图容器、点击选点、标记点、List/Map 切换等交互逻辑都已经用 Playwright 端到端验证过，属于沙箱网络限制而非代码问题，用户自己的电脑/正式部署环境不受影响。

`ServiceListing` 新增了 `locationLat/locationLng/locationAddress`（原来只有 `Task`、`ClassifiedListing` 有坐标字段），API 统一通过 `location: GeoPoint` 收发。

后续要换 Google Maps：申请 API Key 后，把 `MapView.tsx` 里的 `TileLayer`/HTML 换成 Google Maps JS SDK（网页版）或 `react-native-maps` 的 `PROVIDER_GOOGLE`（App 端）即可，不需要改动业务页面。

## 图片上传

跑腿任务、上门服务、分类信息的发布表单都接了真实的图片上传（不再是手填 URL 字符串），只支持 **jpg/png**，单文件 **≤30MB**：

- 后端 `apps/api/src/uploads/`：`POST /uploads`（JWT 鉴权，`multipart/form-data`）校验 mimetype/大小后落盘，返回 `{url, mimeType, sizeBytes}`。存储层做了 `StorageProvider` 接口抽象，`LocalDiskStorageProvider` 是零配置的本地磁盘占位实现（文件存在 `apps/api/storage/uploads/`，本地开发不需要任何云账号），通过 `main.ts` 里的 `app.useStaticAssets` 在 `/uploads/*` 对外提供访问；后续要换 S3 / Cloudflare R2，只需要新增一个实现 `StorageProvider` 接口的 Provider 并按 env 切换，`UploadsController`/前端调用方都不用改。
- `ServiceListing`/`ClassifiedListing`/`Task`(`attachmentUrls`) 的发布表单和详情页都接了 `ImageUploader`（选图→自动上传→回填 URL 数组）和 `PhotoGallery`（详情页缩略图画廊）组件，web (`apps/web/src/components/ImageUploader.tsx`) 用原生 `<input type="file">`，mobile (`apps/mobile/src/components/ImageUploader.tsx`) 用 `expo-image-picker`。任务的"完成凭证"提交也从手填逗号分隔 URL 换成了同一套上传组件。
- 已用真实二进制 PNG 端到端验证：鉴权拒绝未登录请求、mimetype 白名单拒绝非法类型、超过 30MB 返回 413、上传成功后文件可通过返回的 URL 公开访问，以及 Playwright 驱动网页端实际选图→上传→提交→详情页展示全流程。

## 当前进度与后续规划

已完成四大模块的核心闭环（发布 → 处理 → 确认/完成）、手机号验证码登录、Google Calendar 预约同步、Stripe 支付意向创建、List/Map 视图切换、图片上传。后续可继续完善：

- 地址文本自动转坐标 (正向地理编码)：当前地图选点是手动点击，地址输入框只是纯文本标签，还没接 Nominatim/Google Geocoding API 自动把打字的地址转成坐标
- 站内消息聊天页面（数据模型已设计 `Conversation`/`Message`，尚未接 UI）；语音消息也需要复用图片上传的存储层（音频 mimetype 已经在 `ALLOWED_AUDIO_MIME_TYPES` 里预留好了）
- 支付担保交易的释放/退款触发逻辑、Stripe Connect 分账给跑腿者/服务提供者/车主
- 推送通知（`Notification` 表已就位，可接 Expo Push / FCM / APNs）
- 多城市/多语言（en/zh）切换的完整落地
