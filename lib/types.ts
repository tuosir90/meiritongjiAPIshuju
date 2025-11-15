/**
 * API接口配置
 */
export interface ApiConfig {
  id: string;
  name: string;
  color?: string; // 用于图表展示
}

/**
 * 单个API的费用记录
 */
export interface ApiCost {
  apiId: string;
  cost: number;
}

/**
 * 每日记录
 */
export interface DailyRecord {
  id: string;
  date: string; // ISO格式日期字符串
  apiCosts: ApiCost[]; // 各API的费用
  imageCount: number; // 生成图片总数
  totalCost: number; // 当日总费用
  notes?: string; // 备注
}

/**
 * 应用数据结构
 */
export interface AppData {
  version?: string; // 数据版本号（可选，用于版本控制）
  lastUpdated?: string; // 最后更新时间（可选）
  apis: ApiConfig[]; // API配置列表
  records: DailyRecord[]; // 每日记录
}
