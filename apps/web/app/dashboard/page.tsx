import { ChartAreaInteractive } from "@//components/chart-area-interactive"
import { SectionCards } from "@//components/section-cards"
import { ApiKeyManager } from "@/components/api-key-manager"
import { AnalyticsDataTable } from "@/components/analytics-data-table"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import type { AnalyticsData } from "@/types/analytics"

async function getAnalyticsData(): Promise<AnalyticsData | null> {
  try {
    const headersList = await headers()
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    const host = headersList.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    const response = await fetch(`${baseUrl}/api/dashboard/analytics`, {
      headers: Object.fromEntries(headersList.entries()),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Failed to fetch analytics data:', response.statusText)
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return null
  }
}

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Fetch analytics data
  const analyticsData = await getAnalyticsData()

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards data={analyticsData?.summary} />
        <div className="px-4 lg:px-6">
          <ApiKeyManager />
        </div>
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={analyticsData?.chartData} />
        </div>
        <AnalyticsDataTable data={analyticsData?.recentUsage} />
      </div>
    </div>
  )
}