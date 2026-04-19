interface ConnectionStatusProps {
  connected: boolean;
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-xl border border-edge bg-surface px-4 py-2">
      <div className={connected ? "connection-live" : "stage-dot stage-dot-failure"} />
      <span className="text-sm font-medium text-ink-muted">
        {connected ? "Live" : "Disconnected"}
      </span>
    </div>
  );
}
