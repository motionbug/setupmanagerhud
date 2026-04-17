import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StoredEvent, WebhookPayload } from "@/types";

interface EventsChartProps {
  events: StoredEvent[];
  embedded?: boolean;
}

type TimeRange = "day" | "week" | "month" | "all";

const SUCCESS_COLOR = "var(--chart-2)";
const FAILURE_COLOR = "var(--chart-5)";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "day", label: "24h" },
  { value: "week", label: "7d" },
  { value: "month", label: "30d" },
  { value: "all", label: "All" },
];

export function EventsChart({ events, embedded = false }: EventsChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("week");
  const chartData = createTimeBuckets(events, timeRange);

  if (events.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 text-muted-foreground">
        No event data yet
      </div>
    );
  }

  const chart = (
    <div className="space-y-4">
      <div className="flex justify-end gap-1">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              timeRange === range.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
      {chartData.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 text-muted-foreground">
          No data for selected time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={0} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar
              dataKey="success"
              name="Success"
              fill={SUCCESS_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="failure"
              name="Failure"
              fill={FAILURE_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  if (embedded) {
    return chart;
  }

  return <div>{chart}</div>;
}

function createTimeBuckets(events: StoredEvent[], timeRange: TimeRange) {
  const finishedEvents = events.filter(
    (e) => e.payload.event === "com.jamf.setupmanager.finished"
  );

  if (finishedEvents.length === 0) return [];

  const now = Date.now();
  const oneHour = 3600000;
  const oneDay = 86400000;

  const cutoffMap: Record<TimeRange, number> = {
    day: now - oneDay,
    week: now - 7 * oneDay,
    month: now - 30 * oneDay,
    all: 0,
  };
  const cutoff = cutoffMap[timeRange];

  const eventTimes = finishedEvents
    .map((e) => {
      const payload = e.payload as WebhookPayload;
      const time = new Date(payload.finished || payload.started).getTime();
      const actions = payload.enrollmentActions || [];
      const hasFailed = actions.some((a) => a.status === "failed");
      return { time, success: !hasFailed };
    })
    .filter((e) => !isNaN(e.time) && e.time >= cutoff);

  if (eventTimes.length === 0) return [];

  const timestamps = eventTimes.map((e) => e.time);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  let bucketSize: number;
  let formatOptions: Intl.DateTimeFormatOptions;
  let maxBuckets: number;

  if (timeRange === "day") {
    bucketSize = oneHour;
    formatOptions = { hour: "numeric" };
    maxBuckets = 24;
  } else if (timeRange === "week") {
    bucketSize = oneDay;
    formatOptions = { weekday: "short" };
    maxBuckets = 7;
  } else if (timeRange === "month") {
    bucketSize = oneDay;
    formatOptions = { month: "short", day: "numeric" };
    maxBuckets = 15;
  } else {
    const range = maxTime - minTime;
    if (range <= 7 * oneDay) {
      bucketSize = oneDay;
      formatOptions = { weekday: "short" };
    } else {
      bucketSize = oneDay;
      formatOptions = { month: "short", day: "numeric" };
    }
    maxBuckets = 15;
  }

  const buckets: Map<number, { success: number; failure: number }> = new Map();
  const startBucket = Math.floor(minTime / bucketSize) * bucketSize;
  const endBucket = Math.floor(maxTime / bucketSize) * bucketSize;

  for (let bucket = startBucket; bucket <= endBucket; bucket += bucketSize) {
    buckets.set(bucket, { success: 0, failure: 0 });
  }

  for (const { time, success } of eventTimes) {
    const bucket = Math.floor(time / bucketSize) * bucketSize;
    const data = buckets.get(bucket);
    if (data) {
      if (success) {
        data.success++;
      } else {
        data.failure++;
      }
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, data]) => ({
      label: new Date(timestamp).toLocaleString("en-US", formatOptions),
      ...data,
    }))
    .slice(-maxBuckets);
}
