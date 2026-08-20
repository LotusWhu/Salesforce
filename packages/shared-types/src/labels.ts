import {
  CarpoolType,
  ClassifiedCategory,
  ServiceCategory,
  TaskCategory,
  TaskStatus,
  BookingStatus,
} from "./enums";
import { Locale } from "./i18n";

export const TASK_CATEGORY_LABELS: Record<Locale, Record<TaskCategory, string>> = {
  zh: {
    [TaskCategory.BUY_TICKET]: "代买票",
    [TaskCategory.HOUSE_VIEWING_PHOTO]: "代看房拍照",
    [TaskCategory.DELIVERY]: "代取送物品",
    [TaskCategory.QUEUE_UP]: "代排队",
    [TaskCategory.SHOPPING]: "代购",
    [TaskCategory.MOVING]: "搬家帮手",
    [TaskCategory.ASSEMBLY]: "家具组装",
    [TaskCategory.IT_HELP]: "电脑/网络帮忙",
    [TaskCategory.DOCUMENT_HELP]: "文件/翻译协助",
    [TaskCategory.OTHER]: "其他",
  },
  en: {
    [TaskCategory.BUY_TICKET]: "Buy Tickets",
    [TaskCategory.HOUSE_VIEWING_PHOTO]: "House Viewing & Photos",
    [TaskCategory.DELIVERY]: "Pickup & Delivery",
    [TaskCategory.QUEUE_UP]: "Queue Up",
    [TaskCategory.SHOPPING]: "Shopping",
    [TaskCategory.MOVING]: "Moving Help",
    [TaskCategory.ASSEMBLY]: "Furniture Assembly",
    [TaskCategory.IT_HELP]: "Computer/Network Help",
    [TaskCategory.DOCUMENT_HELP]: "Document/Translation Help",
    [TaskCategory.OTHER]: "Other",
  },
};

export const TASK_STATUS_LABELS: Record<Locale, Record<TaskStatus, string>> = {
  zh: {
    [TaskStatus.OPEN]: "招募中",
    [TaskStatus.OFFERED]: "有人报价",
    [TaskStatus.ASSIGNED]: "已接单",
    [TaskStatus.IN_PROGRESS]: "进行中",
    [TaskStatus.SUBMITTED]: "待确认",
    [TaskStatus.COMPLETED]: "已完成",
    [TaskStatus.CANCELLED]: "已取消",
    [TaskStatus.DISPUTED]: "有争议",
  },
  en: {
    [TaskStatus.OPEN]: "Open",
    [TaskStatus.OFFERED]: "Offers received",
    [TaskStatus.ASSIGNED]: "Assigned",
    [TaskStatus.IN_PROGRESS]: "In progress",
    [TaskStatus.SUBMITTED]: "Awaiting confirmation",
    [TaskStatus.COMPLETED]: "Completed",
    [TaskStatus.CANCELLED]: "Cancelled",
    [TaskStatus.DISPUTED]: "Disputed",
  },
};

export const SERVICE_CATEGORY_LABELS: Record<Locale, Record<ServiceCategory, string>> = {
  zh: {
    [ServiceCategory.HOUSE_CLEANING]: "居家保洁",
    [ServiceCategory.MOVE_OUT_CLEANING]: "搬家退租清洁",
    [ServiceCategory.NAIL_SALON]: "上门美甲",
    [ServiceCategory.HAIR_STYLING]: "上门理发",
    [ServiceCategory.PIANO_LESSON]: "钢琴教学",
    [ServiceCategory.TUTORING]: "学科辅导",
    [ServiceCategory.MASSAGE]: "上门按摩",
    [ServiceCategory.PET_CARE]: "宠物照看",
    [ServiceCategory.OTHER]: "其他",
  },
  en: {
    [ServiceCategory.HOUSE_CLEANING]: "House Cleaning",
    [ServiceCategory.MOVE_OUT_CLEANING]: "Move-out Cleaning",
    [ServiceCategory.NAIL_SALON]: "Mobile Nail Salon",
    [ServiceCategory.HAIR_STYLING]: "Mobile Hair Styling",
    [ServiceCategory.PIANO_LESSON]: "Piano Lessons",
    [ServiceCategory.TUTORING]: "Tutoring",
    [ServiceCategory.MASSAGE]: "Mobile Massage",
    [ServiceCategory.PET_CARE]: "Pet Care",
    [ServiceCategory.OTHER]: "Other",
  },
};

export const BOOKING_STATUS_LABELS: Record<Locale, Record<BookingStatus, string>> = {
  zh: {
    [BookingStatus.PENDING_CONFIRMATION]: "待验证码确认",
    [BookingStatus.CONFIRMED]: "已确认",
    [BookingStatus.IN_PROGRESS]: "服务中",
    [BookingStatus.COMPLETED]: "已完成",
    [BookingStatus.CANCELLED]: "已取消",
    [BookingStatus.NO_SHOW]: "未到场",
  },
  en: {
    [BookingStatus.PENDING_CONFIRMATION]: "Awaiting OTP confirmation",
    [BookingStatus.CONFIRMED]: "Confirmed",
    [BookingStatus.IN_PROGRESS]: "In progress",
    [BookingStatus.COMPLETED]: "Completed",
    [BookingStatus.CANCELLED]: "Cancelled",
    [BookingStatus.NO_SHOW]: "No-show",
  },
};

export const CARPOOL_TYPE_LABELS: Record<Locale, Record<CarpoolType, string>> = {
  zh: {
    [CarpoolType.AIRPORT_PICKUP]: "接机",
    [CarpoolType.AIRPORT_DROPOFF]: "送机",
    [CarpoolType.CITY_RIDE]: "市内拼车",
  },
  en: {
    [CarpoolType.AIRPORT_PICKUP]: "Airport Pickup",
    [CarpoolType.AIRPORT_DROPOFF]: "Airport Dropoff",
    [CarpoolType.CITY_RIDE]: "City Ride",
  },
};

export const CLASSIFIED_CATEGORY_LABELS: Record<Locale, Record<ClassifiedCategory, string>> = {
  zh: {
    [ClassifiedCategory.LOCAL_INFO]: "本地资讯",
    [ClassifiedCategory.RENTAL]: "房屋租赁",
    [ClassifiedCategory.REAL_ESTATE_SALE]: "房屋交易",
    [ClassifiedCategory.VEHICLE]: "车辆交易",
    [ClassifiedCategory.JOB]: "求职招聘",
    [ClassifiedCategory.SECOND_HAND]: "二手市场",
    [ClassifiedCategory.BUSINESS_SALE]: "生意买卖",
    [ClassifiedCategory.PET]: "宠物交易",
    [ClassifiedCategory.ACCOUNTING_TAX]: "会计税务",
    [ClassifiedCategory.MOVING_LOGISTICS]: "物流搬运",
    [ClassifiedCategory.CLEANING]: "清洁通渠",
    [ClassifiedCategory.GARDENING]: "园艺绿化",
    [ClassifiedCategory.PLUMBING_ELECTRICAL]: "水管电工",
    [ClassifiedCategory.NANNY_CONFINEMENT]: "保姆月嫂",
    [ClassifiedCategory.RENOVATION]: "建筑家装",
    [ClassifiedCategory.DRIVING_SCHOOL]: "驾校招生",
    [ClassifiedCategory.LOAN]: "贷款",
    [ClassifiedCategory.LIFE_SERVICES]: "生活服务",
    [ClassifiedCategory.FREE]: "免费赠送",
    [ClassifiedCategory.OTHER]: "其他",
  },
  en: {
    [ClassifiedCategory.LOCAL_INFO]: "Local Info",
    [ClassifiedCategory.RENTAL]: "Rentals",
    [ClassifiedCategory.REAL_ESTATE_SALE]: "Real Estate for Sale",
    [ClassifiedCategory.VEHICLE]: "Vehicles",
    [ClassifiedCategory.JOB]: "Jobs",
    [ClassifiedCategory.SECOND_HAND]: "Second-hand",
    [ClassifiedCategory.BUSINESS_SALE]: "Businesses for Sale",
    [ClassifiedCategory.PET]: "Pets",
    [ClassifiedCategory.ACCOUNTING_TAX]: "Accounting & Tax",
    [ClassifiedCategory.MOVING_LOGISTICS]: "Moving & Logistics",
    [ClassifiedCategory.CLEANING]: "Cleaning",
    [ClassifiedCategory.GARDENING]: "Gardening",
    [ClassifiedCategory.PLUMBING_ELECTRICAL]: "Plumbing & Electrical",
    [ClassifiedCategory.NANNY_CONFINEMENT]: "Nanny & Confinement Care",
    [ClassifiedCategory.RENOVATION]: "Renovation & Construction",
    [ClassifiedCategory.DRIVING_SCHOOL]: "Driving School",
    [ClassifiedCategory.LOAN]: "Loans",
    [ClassifiedCategory.LIFE_SERVICES]: "Life Services",
    [ClassifiedCategory.FREE]: "Free Stuff",
    [ClassifiedCategory.OTHER]: "Other",
  },
};
