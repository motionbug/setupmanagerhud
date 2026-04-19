import { DashboardIcon } from "./DashboardIcon";
import {
  Activity01Icon,
  Tick01Icon,
  Clock01Icon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

interface KpiCardsProps {
  started: number;
  finished: number;
  avgDuration: number;
  failedActions: number;
  successRate: number;
  total: number;
  onFailedActionsClick?: () => void;
}

export function KpiCards({
  started,
  finished,
  avgDuration,
  failedActions,
  successRate,
  onFailedActionsClick,
}: KpiCardsProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const stages: {
    label: string;
    value: string | number;
    icon: IconSvgElement;
    status: "active" | "success" | "failure" | "neutral";
    onClick?: () => void;
    glow?: boolean;
    showSuccessRate?: boolean;
  }[] = [
    {
      label: "Started",
      value: started,
      icon: Activity01Icon,
      status: "active",
    },
    {
      label: "Finished",
      value: finished,
      icon: Tick01Icon,
      status: "success",
      showSuccessRate: true,
    },
    {
      label: "Avg Duration",
      value: formatDuration(avgDuration),
      icon: Clock01Icon,
      status: "neutral",
    },
    {
      label: "Failed Actions",
      value: failedActions,
      icon: AlertDiamondIcon,
      status: failedActions > 0 ? "failure" : "neutral",
      onClick: failedActions > 0 ? onFailedActionsClick : undefined,
      glow: failedActions > 0,
    },
  ];

  const statusColor = {
    active: "text-jamf-blue",
    success: "text-jamf-green",
    failure: "text-jamf-red",
    neutral: "text-ink-muted",
  };

  const dotColor = {
    active: "stage-dot-active",
    success: "stage-dot-success",
    failure: "stage-dot-failure",
    neutral: "stage-dot-idle",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stages.map((stage, idx) => (
        <div
          key={stage.label}
          className={`panel relative p-6 ${
            stage.onClick ? "cursor-pointer hover:bg-surface-raised transition-colors" : ""
          } ${stage.glow ? "failure-glow" : ""}`}
          onClick={stage.onClick}
        >
          {/* Stage indicator dot + label */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`stage-dot ${dotColor[stage.status]}`} />
            <span className="stat-label">{stage.label}</span>
          </div>

          {/* Value + Icon inline */}
          <div className="flex items-center gap-3">
            <span className={`stat-value ${statusColor[stage.status]}`}>
              {stage.value}
            </span>
            <DashboardIcon
              icon={stage.icon}
              size={28}
              className={`${statusColor[stage.status]} opacity-40`}
            />
          </div>

          {/* Success rate indicator for finished */}
          {stage.showSuccessRate && (
            <div className="mt-2 flex items-center gap-2">
              <span className="stat-delta text-jamf-green">{successRate}%</span>
              <span className="text-base text-ink-ghost">success rate</span>
            </div>
          )}

          {/* Pipeline connector arrow (except last) */}
          {idx < stages.length - 1 && (
            <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 text-ink-ghost">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M4 8h8M8 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
