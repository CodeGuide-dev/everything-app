import { auth } from "@/lib/auth";
import { db, aiUsage } from "@/db";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Calculate date ranges
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get total usage counts by feature type
    const usageByFeature = await db
      .select({
        featureType: aiUsage.featureType,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(aiUsage)
      .where(eq(aiUsage.userId, userId))
      .groupBy(aiUsage.featureType);

    const chatCount = usageByFeature.find(u => u.featureType === 'chat')?.count || 0;
    const searchCount = usageByFeature.find(u => u.featureType === 'web_search')?.count || 0;
    const totalUsage = chatCount + searchCount;

    // Get usage counts from last 30 days for comparison
    const last30DaysUsage = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.userId, userId),
          gte(aiUsage.createdAt, last30Days)
        )
      );

    const last30DaysCount = last30DaysUsage[0]?.count || 0;

    // Get usage counts from previous 30 days for trend calculation
    const previous30Days = new Date(last30Days.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30DaysUsage = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.userId, userId),
          gte(aiUsage.createdAt, previous30Days),
          sql`${aiUsage.createdAt} < ${last30Days}`
        )
      );

    const previous30DaysCount = previous30DaysUsage[0]?.count || 0;

    // Calculate trend percentage
    const trendPercentage = previous30DaysCount > 0
      ? ((last30DaysCount - previous30DaysCount) / previous30DaysCount) * 100
      : last30DaysCount > 0 ? 100 : 0;

    // Get daily usage data for the last 90 days for the chart
    const dailyUsage = await db
      .select({
        date: sql<string>`DATE(${aiUsage.createdAt})`,
        featureType: aiUsage.featureType,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.userId, userId),
          gte(aiUsage.createdAt, last90Days)
        )
      )
      .groupBy(sql`DATE(${aiUsage.createdAt})`, aiUsage.featureType)
      .orderBy(sql`DATE(${aiUsage.createdAt})`);

    // Transform daily usage into chart format
    const chartDataMap = new Map<string, { date: string; chat: number; web_search: number }>();

    // Initialize all dates in the range with 0 counts
    for (let i = 0; i < 90; i++) {
      const date = new Date(last90Days);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      chartDataMap.set(dateStr, { date: dateStr, chat: 0, web_search: 0 });
    }

    // Fill in actual data
    dailyUsage.forEach(row => {
      const existing = chartDataMap.get(row.date);
      if (existing) {
        if (row.featureType === 'chat') {
          existing.chat = row.count;
        } else if (row.featureType === 'web_search') {
          existing.web_search = row.count;
        }
      }
    });

    const chartData = Array.from(chartDataMap.values());

    // Get recent usage for the table
    const recentUsage = await db
      .select({
        id: aiUsage.id,
        featureType: aiUsage.featureType,
        metadata: aiUsage.metadata,
        createdAt: aiUsage.createdAt,
      })
      .from(aiUsage)
      .where(eq(aiUsage.userId, userId))
      .orderBy(desc(aiUsage.createdAt))
      .limit(50);

    // Calculate average tokens per usage
    const totalTokens = recentUsage.reduce((sum, usage) => {
      const tokensUsed = (usage.metadata as any)?.tokensUsed || 0;
      return sum + tokensUsed;
    }, 0);
    const avgTokens = totalUsage > 0 ? Math.round(totalTokens / totalUsage) : 0;

    // Format response
    return NextResponse.json({
      summary: {
        totalUsage,
        chatCount,
        searchCount,
        avgTokens,
        last30DaysCount,
        trendPercentage: Math.round(trendPercentage * 10) / 10, // Round to 1 decimal
      },
      chartData,
      recentUsage: recentUsage.map(usage => ({
        id: usage.id,
        type: usage.featureType,
        model: (usage.metadata as any)?.model || 'N/A',
        tokens: (usage.metadata as any)?.tokensUsed || 0,
        timestamp: usage.createdAt,
      })),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
