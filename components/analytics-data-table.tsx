"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  IconMessage,
  IconWorldSearch,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RecentUsage } from "@/types/analytics"

interface AnalyticsDataTableProps {
  data?: RecentUsage[] | null
}

export function AnalyticsDataTable({ data }: AnalyticsDataTableProps) {
  const recentUsage = data || []

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>Recent AI Usage</CardTitle>
        <CardDescription>
          Your latest AI interactions and usage details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentUsage.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsage.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5">
                        {usage.type === 'chat' ? (
                          <IconMessage className="size-3" />
                        ) : (
                          <IconWorldSearch className="size-3" />
                        )}
                        {usage.type === 'chat' ? 'Chat' : 'Web Search'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {usage.model}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {usage.tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(usage.timestamp), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No usage data available yet. Start using AI features to see your activity.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
