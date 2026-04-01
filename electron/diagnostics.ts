import {
  createTraceBuffer,
  hashTraceValue,
  sanitizeTraceDetails,
  summarizeTraceFilter,
  summarizeTraceWindow,
  type TraceDump,
  type TraceEvent,
  type TraceIdleSummary,
  type TraceSource
} from '../src/lib/search/diagnostics';
import { app } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LauncherTraceDumpFile, LocalIntentFilter } from '../src/lib/search/types';

const TRACE_BUFFER_LIMIT = 500;
const defaultEnabled = process.env.NORTHLIGHT_TRACE === '1';
const traceSessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const buffer = createTraceBuffer(TRACE_BUFFER_LIMIT);

let traceEnabled = defaultEnabled;
let eventSequence = 0;
let lastQueryChangeTimestamp = 0;

type TraceInput = {
  source?: TraceSource;
  subsystem: string;
  event: string;
  requestId?: string;
  query?: string | null;
  scopePath?: string | null;
  localFilter?: LocalIntentFilter | null;
  durationMs?: number;
  resultCount?: number;
  cacheState?: 'hit' | 'miss' | 'mixed';
  path?: string | null;
  kind?: string;
  outcome?: string;
  details?: Record<string, unknown> | null;
  timestamp?: number;
};

function nextEventId() {
  eventSequence += 1;
  return `${traceSessionId}-${eventSequence}`;
}

function writeTrace(event: TraceEvent) {
  buffer.push(event);

  const duration = event.durationMs !== undefined ? ` duration=${event.durationMs.toFixed(1)}ms` : '';
  const resultCount = event.resultCount !== undefined ? ` results=${event.resultCount}` : '';
  const requestId = event.requestId ? ` request=${event.requestId}` : '';
  const queryHash = event.queryHash ? ` query=${event.queryHash}/${event.queryLength ?? 0}` : '';
  const cacheState = event.cacheState ? ` cache=${event.cacheState}` : '';
  const outcome = event.outcome ? ` outcome=${event.outcome}` : '';

  console.log(`[trace ${event.source}:${event.subsystem}:${event.event}]${requestId}${queryHash}${cacheState}${resultCount}${duration}${outcome}`);
}

export function isTraceEnabled() {
  return traceEnabled;
}

export function getTraceState() {
  return {
    enabled: traceEnabled,
    sessionId: traceSessionId
  };
}

export function setTraceEnabled(enabled: boolean) {
  traceEnabled = enabled;

  recordTrace({
    subsystem: 'diagnostics',
    event: enabled ? 'enabled' : 'disabled',
    details: {
      source: 'api'
    }
  });

  return getTraceState();
}

export function recordTrace(input: TraceInput) {
  if (!traceEnabled) {
    return;
  }

  const event: TraceEvent = {
    id: nextEventId(),
    sessionId: traceSessionId,
    timestamp: input.timestamp ?? Date.now(),
    source: input.source ?? 'main',
    subsystem: input.subsystem,
    event: input.event,
    requestId: input.requestId,
    queryHash: hashTraceValue(input.query),
    queryLength: input.query?.trim().length,
    scopeHash: hashTraceValue(input.scopePath),
    localFilter: summarizeTraceFilter(input.localFilter),
    durationMs: input.durationMs !== undefined ? Number(input.durationMs.toFixed(1)) : undefined,
    resultCount: input.resultCount,
    cacheState: input.cacheState,
    pathHash: hashTraceValue(input.path),
    kind: input.kind,
    outcome: input.outcome,
    details: sanitizeTraceDetails(input.details)
  };

  if (event.source === 'renderer' && event.subsystem === 'renderer' && event.event === 'query-change') {
    lastQueryChangeTimestamp = event.timestamp;
  }

  writeTrace(event);
}

export async function traceSpan<T>(input: Omit<TraceInput, 'durationMs' | 'resultCount' | 'cacheState' | 'outcome'>, run: () => Promise<T>) {
  const startedAt = Date.now();

  try {
    const result = await run();
    const nextInput: TraceInput = {
      ...input,
      durationMs: Date.now() - startedAt,
      outcome: 'ok'
    };

    if (Array.isArray(result)) {
      nextInput.resultCount = result.length;
    }

    recordTrace(nextInput);
    return result;
  } catch (error) {
    recordTrace({
      ...input,
      durationMs: Date.now() - startedAt,
      outcome: 'error',
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
}

export function ingestRendererTrace(event: Omit<TraceInput, 'source'>) {
  recordTrace({
    ...event,
    source: 'renderer'
  });
}

export function getTraceDump(): TraceDump {
  return {
    enabled: traceEnabled,
    sessionId: traceSessionId,
    generatedAt: Date.now(),
    events: traceEnabled ? buffer.snapshot() : []
  };
}

export function getIdleTraceSummary(): TraceIdleSummary {
  const now = Date.now();
  const fromTimestamp = lastQueryChangeTimestamp || now;
  const summary = summarizeTraceWindow(
    buffer.snapshot().filter((event) => event.timestamp >= fromTimestamp && event.timestamp <= now),
    fromTimestamp,
    now
  );

  if (traceEnabled) {
    writeTrace({
      id: nextEventId(),
      sessionId: traceSessionId,
      timestamp: now,
      source: 'main',
      subsystem: 'diagnostics',
      event: 'idle-summary',
      details: {
        totalEvents: summary.totalEvents,
        topEvent: summary.topEvents[0]?.key ?? 'none',
        topCount: summary.topEvents[0]?.count ?? 0
      }
    });
  }

  return summary;
}

export async function writeTraceDumpFile(): Promise<LauncherTraceDumpFile> {
  const dump = getTraceDump();
  const traceDumpDir = join(app.getPath('userData'), 'trace-dumps');
  const filename = `trace-${dump.sessionId}-${dump.generatedAt}.json`;
  const outputPath = join(traceDumpDir, filename);

  await mkdir(traceDumpDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify({
    ...dump,
    idleSummary: getIdleTraceSummary()
  }, null, 2), 'utf8');

  recordTrace({
    subsystem: 'diagnostics',
    event: 'dump-written',
    details: {
      outputPath,
      eventCount: dump.events.length
    }
  });

  return {
    path: outputPath,
    sessionId: dump.sessionId,
    eventCount: dump.events.length,
    generatedAt: dump.generatedAt
  };
}
