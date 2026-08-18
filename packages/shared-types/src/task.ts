import { TaskCategory, TaskOfferStatus, TaskStatus } from "./enums";

export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface TaskDto {
  id: string;
  posterId: string;
  category: TaskCategory;
  title: string;
  description: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency: string; // "AUD"
  location?: GeoPoint | null;
  isRemote: boolean; // 例如代买票可远程完成，无需上门
  dueDate?: string | null;
  status: TaskStatus;
  assignedTaskerId?: string | null;
  attachmentUrls: string[]; // 需求参考图/票务链接截图等
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  category: TaskCategory;
  title: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  location?: GeoPoint;
  isRemote?: boolean;
  dueDate?: string;
  attachmentUrls?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  dueDate?: string;
  status?: TaskStatus;
}

export interface TaskOfferDto {
  id: string;
  taskId: string;
  taskerId: string;
  price: number;
  message?: string | null;
  status: TaskOfferStatus;
  createdAt: string;
}

export interface CreateTaskOfferDto {
  price: number;
  message?: string;
}

export interface SubmitTaskCompletionDto {
  // 跑腿者提交完成凭证，如代买票的票据照片、看房拍照的照片集
  proofUrls: string[];
  note?: string;
}

export interface ListTasksQuery {
  category?: TaskCategory;
  status?: TaskStatus;
  city?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
