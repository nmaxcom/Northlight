export type TraceSource = 'main' | 'renderer';

export type TraceCacheState = 'hit' | 'miss' | 'mixed';

export type TracePrimitive = string | number | boolean | null;

export type TraceDetails = Record<string, TracePrimitive>;

export type TraceEvent = {
  id: string;
  sessionId: string;
  timestamp: number;
  source: TraceSource;
  subsystem: string;
  event: string;
  requestId?: string;
  queryHash?: string;
  queryLength?: number;
  scopeHash?: string;
  localFilter?: string;
  durationMs?: number;
  resultCount?: number;
  cacheState?: TraceCacheState;
  pathHash?: string;
  kind?: string;
  outcome?: string;
  details?: TraceDetails;
};

export type TraceIdleSummary = {
  fromTimestamp: number;
  toTimestamp: number;
  idleMs: number;
  totalEvents: number;
  uniqueEventCount: number;
  topEvents: Array<{
    key: string;
    count: number;
    totalDurationMs: number;
  }>;
};

export type TraceDump = {
  enabled: boolean;
  sessionId: string;
  generatedAt: number;
  events: TraceEvent[];
};

type TraceBuffer = {
  push: (event: TraceEvent) => void;
  snapshot: () => TraceEvent[];
};

function stableHash(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function hashTraceValue(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return '';
  }

  return stableHash(normalized.toLowerCase());
}

export function summarizeTraceFilter(filter?: { kind?: string; extensions?: string[] } | null) {
  if (!filter) {
    return '';
  }

  const parts: string[] = [];

  if (filter.kind) {
    parts.push(filter.kind);
  }

  if (filter.extensions && filter.extensions.length > 0) {
    parts.push(`ext:${filter.extensions.map((entry) => entry.toLowerCase()).sort().join(',')}`);
  }

  return parts.join('|');
}

export function sanitizeTraceDetails(details?: Record<string, unknown> | null): TraceDetails | undefined {
  if (!details) {
    return undefined;
  }

  const entries = Object.entries(details)
    .map(([key, value]) => {
      if (value === null) {
        return [key, null] as const;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return [key, value] as const;
      }

      if (Array.isArray(value)) {
        return [key, value.join(',')] as const;
      }

      if (typeof value === 'object') {
        return [key, JSON.stringify(value)] as const;
      }

      return [key, String(value)] as const;
    })
    .filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function createTraceBuffer(limit: number): TraceBuffer {
  const events: TraceEvent[] = [];

  return {
    push(event) {
      events.push(event);
      if (events.length > limit) {
        events.splice(0, events.length - limit);
      }
    },
    snapshot() {
      return [...events];
    }
  };
}

export function summarizeTraceWindow(events: TraceEvent[], fromTimestamp: number, toTimestamp: number): TraceIdleSummary {
  const summaryByKey = new Map<string, { count: number; totalDurationMs: number }>();

  for (const event of events) {
    const key = `${event.source}:${event.subsystem}:${event.event}`;
    const current = summaryByKey.get(key) ?? { count: 0, totalDurationMs: 0 };
    current.count += 1;
    current.totalDurationMs += event.durationMs ?? 0;
    summaryByKey.set(key, current);
  }

  const topEvents = Array.from(summaryByKey.entries())
    .map(([key, value]) => ({
      key,
      count: value.count,
      totalDurationMs: Number(value.totalDurationMs.toFixed(1))
    }))
    .sort((left, right) => right.count - left.count || right.totalDurationMs - left.totalDurationMs || left.key.localeCompare(right.key))
    .slice(0, 8);

  return {
    fromTimestamp,
    toTimestamp,
    idleMs: Math.max(0, toTimestamp - fromTimestamp),
    totalEvents: events.length,
    uniqueEventCount: summaryByKey.size,
    topEvents
  };
}
