import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AnalyticsSummary } from "@/types/analytics"

interface SectionCardsProps {
  data?: AnalyticsSummary | null
}

export function SectionCards({ data }: SectionCardsProps) {
  // Default values when data is not available
  const totalUsage = data?.totalUsage ?? 0
  const chatCount = data?.chatCount ?? 0
  const searchCount = data?.searchCount ?? 0
  const avgTokens = data?.avgTokens ?? 0
  const trendPercentage = data?.trendPercentage ?? 0
  const isPositiveTrend = trendPercentage >= 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total AI Usage</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalUsage.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPositiveTrend ? <IconTrendingUp /> : <IconTrendingDown />}
              {isPositiveTrend ? '+' : ''}{trendPercentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPositiveTrend ? 'Trending up' : 'Trending down'} this month{' '}
            {isPositiveTrend ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Combined chat and search usage
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>AI Chat Sessions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {chatCount.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {totalUsage > 0 ? ((chatCount / totalUsage) * 100).toFixed(0) : 0}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Assistant conversations
          </div>
          <div className="text-muted-foreground">
            Total chat interactions
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Web Searches</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {searchCount.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {totalUsage > 0 ? ((searchCount / totalUsage) * 100).toFixed(0) : 0}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Search-augmented responses
          </div>
          <div className="text-muted-foreground">AI-powered web searches</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg Tokens/Request</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgTokens.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Efficient
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Token efficiency metrics
          </div>
          <div className="text-muted-foreground">Average per interaction</div>
        </CardFooter>
      </Card>
    </div>
  )
}
