export interface AnalyticsSummary {
  totalUsage: number;
  chatCount: number;
  searchCount: number;
  imageCount: number;
  avgTokens: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  last30DaysCount: number;
  trendPercentage: number;
}

export interface ChartDataPoint {
  date: string;
  chat: number;
  web_search: number;
  image_generation: number;
}

export interface RecentUsage {
  id: string;
  type: 'chat' | 'web_search' | 'image_generation';
  model: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date | string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  chartData: ChartDataPoint[];
  recentUsage: RecentUsage[];
}
