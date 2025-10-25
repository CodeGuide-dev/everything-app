export interface AnalyticsSummary {
  totalUsage: number;
  chatCount: number;
  searchCount: number;
  avgTokens: number;
  last30DaysCount: number;
  trendPercentage: number;
}

export interface ChartDataPoint {
  date: string;
  chat: number;
  web_search: number;
}

export interface RecentUsage {
  id: string;
  type: 'chat' | 'web_search';
  model: string;
  tokens: number;
  timestamp: Date | string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  chartData: ChartDataPoint[];
  recentUsage: RecentUsage[];
}
