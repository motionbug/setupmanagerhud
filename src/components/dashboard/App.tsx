import * as React from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { KpiCards } from "./KpiCards";
import { EventsTable } from "./EventsTable";
import { EventsChart } from "./EventsChart";
import { ActionsChart } from "./ActionsChart";
import { Filters } from "./Filters";
import { ConnectionStatus } from "./ConnectionStatus";
import { ThemeToggle } from "./ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilterState } from "@/types";
import { isFinishedWebhook } from "@/types";

export function App() {
  const { connected, events, stats } = useWebSocket();
  const [filters, setFilters] = React.useState<FilterState>({
    eventType: "all",
    macOSVersion: "",
    model: "",
    timeRange: "all",
    search: "",
  });

  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => {
      const payload = event.payload;

      if (filters.eventType === "started" && payload.event !== "com.jamf.setupmanager.started") {
        return false;
      }
      if (filters.eventType === "finished" && payload.event !== "com.jamf.setupmanager.finished") {
        return false;
      }
      if (filters.eventType === "failed") {
        if (!isFinishedWebhook(payload)) {
          return false;
        }
        const actions = payload.enrollmentActions || [];
        if (!actions.some((a) => a.status === "failed")) {
          return false;
        }
      }

      if (filters.macOSVersion && !payload.macOSVersion.includes(filters.macOSVersion)) {
        return false;
      }

      if (filters.model && !payload.modelName.toLowerCase().includes(filters.model.toLowerCase())) {
        return false;
      }

      if (filters.timeRange !== "all") {
        const now = Date.now();
        const ranges = { hour: 3600000, day: 86400000, week: 604800000 };
        if (now - event.timestamp > ranges[filters.timeRange]) {
          return false;
        }
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const userID = isFinishedWebhook(payload) ? payload.userEntry?.userID : undefined;
        const computerName = isFinishedWebhook(payload) ? payload.computerName : undefined;
        const searchableFields = [
          payload.serialNumber,
          payload.modelName,
          computerName,
          payload.macOSVersion,
          userID,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchableFields.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  if (!connected && events.length === 0) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header connected={false} />
        <main className="mx-auto max-w-[1600px] px-6 py-8">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header connected={connected} />
      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="space-y-8">
          {/* Pipeline Stats */}
          <KpiCards
            started={stats.started}
            finished={stats.finished}
            avgDuration={stats.avgDuration}
            failedActions={stats.failedActions}
            successRate={stats.successRate}
            total={stats.total}
            onFailedActionsClick={() => setFilters((f) => ({ ...f, eventType: "failed" }))}
          />

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel">
              <div className="panel-header flex items-center justify-between">
                <span className="section-title">Enrollment Outcomes</span>
              </div>
              <div className="panel-body">
                <EventsChart events={filteredEvents} embedded />
              </div>
            </div>
            <div className="panel">
              <div className="panel-header flex items-center justify-between">
                <span className="section-title">Action Quality</span>
              </div>
              <div className="panel-body">
                <ActionsChart events={filteredEvents} embedded />
              </div>
            </div>
          </div>

          {/* Events Section */}
          <div className="panel">
            <div className="panel-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <span className="section-title">Recent Events</span>
              <Filters filters={filters} onFiltersChange={setFilters} events={events} />
            </div>
            <div className="p-0">
              <EventsTable events={filteredEvents} />
            </div>
          </div>
        </div>
      </main>
      <PoweredByJamf />
    </div>
  );
}

function Header({ connected }: { connected: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-edge bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Setup Manager HUD</h1>
          <ConnectionStatus connected={connected} />
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}

function PoweredByJamf() {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-edge bg-surface/90 px-4 py-2 text-sm font-medium text-ink-muted backdrop-blur shadow-sm">
      <span className="inline-flex items-center gap-2">
        Powered by Jamf
        <img
          src="/jamf-icon-white.svg"
          alt="Jamf"
          className="hidden h-4 w-auto dark:block"
        />
        <img
          src="/jamf-icon-dark.svg"
          alt="Jamf"
          className="block h-4 w-auto dark:hidden"
        />
      </span>
    </div>
  );
}
