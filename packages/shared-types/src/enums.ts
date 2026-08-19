// 通用枚举定义，api / web / mobile 三端共用

export enum UserRole {
  CUSTOMER = "CUSTOMER", // 发布任务/预约服务的普通用户
  PROVIDER = "PROVIDER", // 接单跑腿者/服务提供者/车主
  BOTH = "BOTH",
  ADMIN = "ADMIN",
}

export enum Language {
  ZH = "zh",
  EN = "en",
}

// ---------- 任务外包 / 跑腿代办 (Task) ----------
export enum TaskCategory {
  BUY_TICKET = "BUY_TICKET", // 代买票 (电影票/演出/展览等)
  HOUSE_VIEWING_PHOTO = "HOUSE_VIEWING_PHOTO", // 代看房拍照
  DELIVERY = "DELIVERY", // 代取送物品
  QUEUE_UP = "QUEUE_UP", // 代排队
  SHOPPING = "SHOPPING", // 代购
  MOVING = "MOVING", // 搬家帮手
  ASSEMBLY = "ASSEMBLY", // 家具组装
  IT_HELP = "IT_HELP", // 电脑/网络帮忙
  DOCUMENT_HELP = "DOCUMENT_HELP", // 文件/翻译协助
  OTHER = "OTHER",
}

export enum TaskStatus {
  OPEN = "OPEN", // 已发布，等待报价
  OFFERED = "OFFERED", // 已收到至少一个报价
  ASSIGNED = "ASSIGNED", // 已确定跑腿者
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED", // 跑腿者已提交完成凭证(如照片/票据)，等待确认
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
}

export enum TaskOfferStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

// ---------- 上门服务预约 (Service) ----------
export enum ServiceCategory {
  HOUSE_CLEANING = "HOUSE_CLEANING", // 保洁/租房清洁
  MOVE_OUT_CLEANING = "MOVE_OUT_CLEANING", // 搬家退租清洁
  NAIL_SALON = "NAIL_SALON", // 上门美甲
  HAIR_STYLING = "HAIR_STYLING", // 上门理发/美发
  PIANO_LESSON = "PIANO_LESSON", // 钢琴教学
  TUTORING = "TUTORING", // 学科辅导
  MASSAGE = "MASSAGE", // 按摩
  PET_CARE = "PET_CARE", // 宠物照看
  OTHER = "OTHER",
}

export enum PriceType {
  FIXED = "FIXED",
  HOURLY = "HOURLY",
}

export enum BookingStatus {
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION", // 已下单，等待短信验证码确认
  CONFIRMED = "CONFIRMED", // 已验证码确认，已同步Google日历
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

// ---------- 拼车接送机 (Carpool) ----------
export enum CarpoolType {
  AIRPORT_PICKUP = "AIRPORT_PICKUP", // 接机
  AIRPORT_DROPOFF = "AIRPORT_DROPOFF", // 送机
  CITY_RIDE = "CITY_RIDE", // 市内拼车
}

export enum CarpoolTripStatus {
  OPEN = "OPEN",
  FULL = "FULL",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum CarpoolBookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum CarpoolFareMode {
  ONE_WAY = "ONE_WAY",
  ROUND_TRIP = "ROUND_TRIP",
}

export enum CarpoolRequestStatus {
  PENDING = "PENDING", // 待匹配，进入匹配池等待
  MATCHED = "MATCHED", // 已自动匹配到某个行程
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

// ---------- 分类信息 (Classifieds, 对标 yeeyi 分类体系) ----------
export enum ClassifiedCategory {
  LOCAL_INFO = "LOCAL_INFO", // 本地资讯
  RENTAL = "RENTAL", // 房屋租赁
  REAL_ESTATE_SALE = "REAL_ESTATE_SALE", // 房屋交易
  VEHICLE = "VEHICLE", // 车辆交易
  JOB = "JOB", // 求职招聘
  SECOND_HAND = "SECOND_HAND", // 二手市场
  BUSINESS_SALE = "BUSINESS_SALE", // 生意买卖
  PET = "PET", // 宠物交易
  ACCOUNTING_TAX = "ACCOUNTING_TAX", // 会计税务
  MOVING_LOGISTICS = "MOVING_LOGISTICS", // 物流搬运
  CLEANING = "CLEANING", // 清洁通渠
  GARDENING = "GARDENING", // 园艺绿化
  PLUMBING_ELECTRICAL = "PLUMBING_ELECTRICAL", // 水管电工
  NANNY_CONFINEMENT = "NANNY_CONFINEMENT", // 保姆月嫂
  RENOVATION = "RENOVATION", // 建筑家装
  DRIVING_SCHOOL = "DRIVING_SCHOOL", // 驾校招生
  LOAN = "LOAN", // 贷款
  LIFE_SERVICES = "LIFE_SERVICES", // 生活服务
  FREE = "FREE", // 免费赠送
  OTHER = "OTHER",
}

export enum ClassifiedStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  EXPIRED = "EXPIRED",
  REMOVED = "REMOVED",
}

// ---------- 通用 ----------
export enum PaymentStatus {
  PENDING = "PENDING",
  HELD = "HELD", // 担保交易中(类似escrow)
  RELEASED = "RELEASED",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}

export enum PaymentRelatedType {
  TASK = "TASK",
  BOOKING = "BOOKING",
  CARPOOL_BOOKING = "CARPOOL_BOOKING",
}

export enum OtpPurpose {
  LOGIN = "LOGIN",
  BOOKING_CONFIRM = "BOOKING_CONFIRM",
  TASK_COMPLETE_CONFIRM = "TASK_COMPLETE_CONFIRM",
}

export enum OtpChannel {
  SMS = "SMS",
  EMAIL = "EMAIL",
}

export enum NotificationType {
  TASK_NEW_OFFER = "TASK_NEW_OFFER",
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_STATUS_CHANGED = "TASK_STATUS_CHANGED",
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
  BOOKING_REMINDER = "BOOKING_REMINDER",
  CARPOOL_BOOKED = "CARPOOL_BOOKED",
  CLASSIFIED_MESSAGE = "CLASSIFIED_MESSAGE",
  NEW_MESSAGE = "NEW_MESSAGE",
  REVIEW_RECEIVED = "REVIEW_RECEIVED",
}
