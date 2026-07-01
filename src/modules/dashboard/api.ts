// dashboard 领域 API
import { api } from '@/lib/http/client'

export interface StatItem {
  value: number
  trendPct: number
}

export interface DashboardStats {
  users: StatItem
  orders: StatItem
  revenue: StatItem
  active: StatItem
}

export interface TrendPoint {
  date: string
  value: number
}

export interface DistItem {
  name: string
  value: number
}

export interface DashboardCharts {
  trend: TrendPoint[]
  distribution: DistItem[]
}

export interface Activity {
  id: string
  title: string
  desc: string
  time: string
  type: 'primary' | 'success' | 'warning' | 'danger'
}

export type ChartRange = '7d' | '30d' | '90d'

export const fetchDashboardStats = () =>
  api.get<DashboardStats>('/api/dashboard/stats')

export const fetchDashboardCharts = (range: ChartRange) =>
  api.get<DashboardCharts>('/api/dashboard/charts', { params: { range } })

export const fetchDashboardActivities = () =>
  api.get<Activity[]>('/api/dashboard/activities')
