import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DashboardIcon } from "./DashboardIcon";
import { Download01Icon, Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { FilterState, StoredEvent, SetupManagerWebhook } from "@/types";

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  events: StoredEvent[];
}

const DEFAULT_FILTERS: FilterState = {
  eventType: "all",
  macOSVersion: "",
  model: "",
  timeRange: "all",
  search: "",
};

export function Filters({ filters, onFiltersChange, events }: FiltersProps) {
  const macOSVersions = React.useMemo(() => {
    const versions = new Set(events.map((e) => e.payload.macOSVersion));
    return Array.from(versions).sort().reverse();
  }, [events]);

  const models = React.useMemo(() => {
    const modelSet = new Set(events.map((e) => e.payload.modelName));
    return Array.from(modelSet).sort();
  }, [events]);

  const hasActiveFilters =
    filters.eventType !== "all" ||
    filters.macOSVersion !== "" ||
    filters.model !== "" ||
    filters.search !== "";

  const clearFilters = () => onFiltersChange(DEFAULT_FILTERS);

  const handleExport = (format: "csv" | "json") => {
    const data = events.map((e) => e.payload);
    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      downloadFile("events.json", blob);
    } else {
      const csv = toCsv(data);
      const blob = new Blob([csv], { type: "text/csv" });
      downloadFile("events.csv", blob);
    }
  };

  const downloadFile = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sanitizeCsvValue = (str: string): string => {
    const FORMULA_CHARS = ["=", "+", "-", "@", "\t", "\r", "\n"];
    if (FORMULA_CHARS.some((c) => str.startsWith(c))) {
      str = "'" + str;
    }
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const toCsv = (rows: SetupManagerWebhook[]) => {
    const headers = [
      "event", "timestamp", "started", "finished", "duration",
      "serialNumber", "modelName", "computerName",
    ];
    const lines = [headers.join(",")];
    rows.forEach((payload) => {
      const values = headers.map((h) => {
        const v = (payload as unknown as Record<string, unknown>)[h];
        if (v === undefined || v === null) return "";
        return sanitizeCsvValue(String(v));
      });
      lines.push(values.join(","));
    });
    return lines.join("\n");
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative">
        <DashboardIcon
          icon={Search01Icon}
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-ghost"
        />
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="h-10 w-48 pl-10 text-base bg-control border-edge-subtle focus:border-accent rounded-lg"
        />
      </div>

      {/* Event type */}
      <Select
        value={filters.eventType}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, eventType: value as FilterState["eventType"] })
        }
      >
        <SelectTrigger className="h-10 w-32 text-base bg-control border-edge-subtle rounded-lg">
          <SelectValue placeholder="All events" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">All events</SelectItem>
          <SelectItem value="started">Started</SelectItem>
          <SelectItem value="finished">Finished</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      {/* macOS version */}
      <Select
        value={filters.macOSVersion || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, macOSVersion: value === "all" ? "" : value })
        }
      >
        <SelectTrigger className="h-10 w-28 text-base bg-control border-edge-subtle rounded-lg">
          <SelectValue placeholder="macOS" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">All macOS</SelectItem>
          {macOSVersions.map((version) => (
            <SelectItem key={version} value={version}>
              {version}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Model */}
      <Select
        value={filters.model || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, model: value === "all" ? "" : value })
        }
      >
        <SelectTrigger className="h-10 w-36 text-base bg-control border-edge-subtle rounded-lg">
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">All models</SelectItem>
          {models.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-10 px-3 text-base text-status-failure hover:bg-status-failure/10 rounded-lg"
        >
          <DashboardIcon icon={Cancel01Icon} size={18} className="mr-1.5" />
          Clear
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Count */}
      <span className="text-sm text-ink-faint tabular-nums">
        {events.length} events
      </span>

      {/* Export */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 px-4 text-base hover:bg-control-hover rounded-lg border-edge">
            <DashboardIcon icon={Download01Icon} size={18} className="mr-2 text-accent" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem onClick={() => handleExport("csv")} className="text-base">
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("json")} className="text-base">
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
