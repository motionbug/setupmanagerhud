import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DashboardIcon } from "./DashboardIcon";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { StoredEvent, SetupManagerWebhook } from "@/types";
import { isFinishedWebhook } from "@/types";

type ThroughputQuality = "good" | "ok" | "slow";

function getThroughputQuality(mbps: number, type: "upload" | "download"): ThroughputQuality {
  if (type === "download") {
    if (mbps >= 50) return "good";
    if (mbps >= 10) return "ok";
    return "slow";
  }
  if (mbps >= 20) return "good";
  if (mbps >= 5) return "ok";
  return "slow";
}

function getQualityColor(quality: ThroughputQuality): string {
  switch (quality) {
    case "good": return "text-status-success font-semibold";
    case "ok": return "text-status-warning font-semibold";
    case "slow": return "text-status-failure font-semibold";
  }
}

function getQualityLabel(quality: ThroughputQuality): string {
  switch (quality) {
    case "good": return "Good";
    case "ok": return "OK";
    case "slow": return "Slow";
  }
}

function getOverallQuality(download?: number, upload?: number): ThroughputQuality | null {
  if (download === undefined && upload === undefined) return null;
  const qualities: ThroughputQuality[] = [];
  if (download !== undefined) qualities.push(getThroughputQuality(download / 1e6, "download"));
  if (upload !== undefined) qualities.push(getThroughputQuality(upload / 1e6, "upload"));
  if (qualities.includes("slow")) return "slow";
  if (qualities.includes("ok")) return "ok";
  return "good";
}

function NetworkIndicator({ download, upload }: { download?: number; upload?: number }) {
  const quality = getOverallQuality(download, upload);
  if (quality === null) return <span className="text-ink-ghost">—</span>;

  const dotClass =
    quality === "good" ? "stage-dot-success" :
    quality === "ok" ? "stage-dot-warning" :
    "stage-dot-failure";

  return (
    <div className="flex justify-center">
      <div className={`stage-dot ${dotClass}`} />
    </div>
  );
}

interface EventsTableProps {
  events: StoredEvent[];
  maxVisible?: number;
}

export function EventsTable({ events, maxVisible = 50 }: EventsTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const visibleEvents = events.slice(0, maxVisible);

  const toggleRow = (eventId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const formatTime = (timestamp: string | number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="data-table overflow-x-auto rounded-b-xl">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-edge-subtle hover:bg-transparent">
            <TableHead className="w-12"></TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Finished</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-center">Network</TableHead>
            <TableHead>Serial</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-16 text-lg text-ink-faint">
                No events yet. Waiting for webhook data...
              </TableCell>
            </TableRow>
          ) : (
            visibleEvents.map((event) => {
              const payload = event.payload;
              const isExpanded = expandedRows.has(event.eventId);
              const isStarted = payload.event === "com.jamf.setupmanager.started";
              const isFinished = isFinishedWebhook(payload);
              const actions = isFinished ? (payload.enrollmentActions || []) : [];
              const failedCount = actions.filter((a) => a.status === "failed").length;

              return (
                <React.Fragment key={event.eventId}>
                  <TableRow className="hover:bg-surface-raised border-0">
                    <TableCell className="py-3.5 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-control-hover rounded-lg"
                        onClick={() => toggleRow(event.eventId)}
                      >
                        {isExpanded ? (
                          <DashboardIcon icon={ArrowDown01Icon} size={18} className="text-accent" />
                        ) : (
                          <DashboardIcon icon={ArrowRight01Icon} size={18} className="text-ink-muted" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <span className={`status-badge ${isStarted ? "status-badge-active" : "status-badge-success"}`}>
                        {payload.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 mono">
                      {formatTime(payload.started)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 mono">
                      {isFinished ? formatTime(payload.finished) : <span className="text-ink-ghost">—</span>}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 mono">
                      {isFinished ? formatDuration(payload.duration) : <span className="text-ink-ghost">—</span>}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isFinished ? (
                        <NetworkIndicator
                          download={payload.downloadThroughput}
                          upload={payload.uploadThroughput}
                        />
                      ) : (
                        <span className="text-ink-ghost text-center block">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 mono">
                      {payload.serialNumber}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-ink-muted">
                      {payload.modelName}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {actions.length > 0 ? (
                        <span className="mono">
                          <span className="text-status-success">{actions.length - failedCount}</span>
                          <span className="text-ink-ghost">/</span>
                          <span className="text-ink-muted">{actions.length}</span>
                          {failedCount > 0 && (
                            <span className="text-status-failure ml-2">
                              ({failedCount} failed)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-ink-ghost">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-surface-raised border-0">
                      <TableCell colSpan={9} className="p-6">
                        <EventDetail payload={payload} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function NetworkInfo({ upload, download }: { upload?: number; download?: number }) {
  if (upload === undefined && download === undefined) return null;

  const uploadMbps = upload !== undefined ? upload / 1e6 : undefined;
  const downloadMbps = download !== undefined ? download / 1e6 : undefined;

  return (
    <div className="mb-5 pb-5 border-b border-edge-subtle">
      <p className="stat-label mb-3">Network</p>
      <div className="flex items-center gap-8">
        {downloadMbps !== undefined && (() => {
          const quality = getThroughputQuality(downloadMbps, "download");
          return (
            <div className="flex items-center gap-2.5">
              <DashboardIcon icon={ArrowDown01Icon} size={18} className="text-ink-faint" />
              <span className="mono text-lg">{downloadMbps.toFixed(1)} Mbps</span>
              <span className={getQualityColor(quality)}>{getQualityLabel(quality)}</span>
            </div>
          );
        })()}
        {uploadMbps !== undefined && (() => {
          const quality = getThroughputQuality(uploadMbps, "upload");
          return (
            <div className="flex items-center gap-2.5">
              <DashboardIcon icon={ArrowUp01Icon} size={18} className="text-ink-faint" />
              <span className="mono text-lg">{uploadMbps.toFixed(1)} Mbps</span>
              <span className={getQualityColor(quality)}>{getQualityLabel(quality)}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function EventDetail({ payload }: { payload: SetupManagerWebhook }) {
  const isFinished = isFinishedWebhook(payload);

  return (
    <div>
      {isFinished && (
        <NetworkInfo upload={payload.uploadThroughput} download={payload.downloadThroughput} />
      )}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-6">
        <DetailItem label="macOS Version" value={payload.macOSVersion} />
        <DetailItem label="macOS Build" value={payload.macOSBuild} />
        <DetailItem label="Model ID" value={payload.modelIdentifier} />
        <DetailItem label="Setup Manager" value={`v${payload.setupManagerVersion}`} />

        {isFinished && payload.computerName && (
          <DetailItem label="Computer Name" value={payload.computerName} />
        )}

        {isFinished && payload.userEntry?.userID && (
          <DetailItem label="User ID" value={payload.userEntry.userID} />
        )}

        {isFinished && payload.userEntry?.department && (
          <DetailItem label="Department" value={payload.userEntry.department} />
        )}
      </div>

      {isFinished && payload.enrollmentActions && payload.enrollmentActions.length > 0 && (
        <div className="mt-5 pt-5 border-t border-edge-subtle">
          <p className="stat-label mb-3">Enrollment Actions</p>
          <div className="flex flex-wrap gap-2">
            {payload.enrollmentActions.map((action, idx) => (
              <span
                key={idx}
                className={`status-badge ${action.status === "finished" ? "status-badge-success" : "status-badge-failure"}`}
              >
                {action.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <p className="text-lg font-medium text-ink mt-1">{value}</p>
    </div>
  );
}
