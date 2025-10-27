# AI Usage Analytics Setup

This document explains how to set up and use the AI usage analytics feature in the dashboard.

## Database Migration

Before using the analytics feature, you need to run the database migration to create the necessary tables.

### Option 1: Using the migration script

```bash
npx tsx scripts/migrate.ts
```

### Option 2: Manual SQL migration

If you prefer to run the migration manually, execute the SQL file:

```bash
psql $DATABASE_URL < drizzle/0003_add_ai_usage_analytics_table.sql
```

### What gets created

The migration creates:

1. **ai_feature_type enum**: Defines the types of AI features (`chat`, `web_search`)
2. **ai_usage table**: Stores usage logs with the following columns:
   - `id`: Unique identifier
   - `user_id`: Foreign key to the users table
   - `feature_type`: Type of AI feature used
   - `metadata`: JSON field for additional context (tokens, model, etc.)
   - `created_at`: Timestamp of usage
3. **Indexes**: Optimized indexes for efficient querying by user, date, and feature type

## How It Works

### 1. Usage Logging

Whenever a user interacts with AI features (chat or web search), the usage is automatically logged:

- **Location**: `app/api/chat/route.ts`
- **Function**: `logAIUsage()` from `lib/analytics/usage-logger.ts`
- **Data captured**:
  - User ID
  - Feature type (chat or web_search)
  - Model used (e.g., gpt-4o)
  - Tokens consumed
  - Session ID
  - Additional metadata

### 2. Analytics API

The analytics data is aggregated and served via:

- **Endpoint**: `/api/dashboard/analytics`
- **Authentication**: Uses better-auth to verify user identity
- **Returns**:
  - Summary metrics (total usage, trends, feature breakdown)
  - Time-series data for charts (last 90 days)
  - Recent usage activity (last 50 interactions)

### 3. Dashboard Display

The dashboard shows:

- **Section Cards**: Key metrics and trends
  - Total AI Usage
  - AI Chat Sessions
  - Web Searches
  - Average Tokens per Request

- **Interactive Chart**: Time-series visualization
  - Filterable by 7, 30, or 90 days
  - Separate lines for chat vs web search usage

- **Recent Usage Table**: Detailed activity log
  - Feature type
  - Model used
  - Tokens consumed
  - Timestamp

## Empty States

When a user has no usage data yet, helpful empty states guide them to start using AI features to generate analytics.

## Performance Considerations

- All queries use proper indexes for fast retrieval
- Analytics endpoint uses `cache: 'no-store'` to ensure fresh data
- Logging is asynchronous and won't block API responses
- Data is aggregated on-demand to avoid storing redundant statistics

## Testing

To test the analytics feature:

1. Make sure the database is running
2. Run the migration
3. Use the AI chat feature (with or without web search)
4. Navigate to `/dashboard` to see your analytics

## Troubleshooting

**No data showing up?**
- Check that the migration ran successfully
- Verify database connection in `.env`
- Check console logs for any errors in usage logging

**Charts not rendering?**
- Ensure you have at least one usage entry in the database
- Check browser console for client-side errors

**API errors?**
- Verify user is authenticated
- Check that all database indexes were created properly
