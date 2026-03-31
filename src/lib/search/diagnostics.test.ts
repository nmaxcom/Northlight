import { describe, expect, it } from 'vitest';
import {
  createTraceBuffer,
  hashTraceValue,
  sanitizeTraceDetails,
  summarizeTraceFilter,
  summarizeTraceWindow,
  type TraceEvent
} from './diagnostics';

function makeEvent(overrides: Partial<TraceEvent> = {}): TraceEvent {
  return {
    id: overrides.id ?? 'event-1',
    sessionId: overrides.sessionId ?? 'session-1',
    timestamp: overrides.timestamp ?? 1_000,
    source: overrides.source ?? 'main',
    subsystem: overrides.subsystem ?? 'search',
    event: overrides.event ?? 'complete',
    ...overrides
  };
}

describe('diagnostics helpers', () => {
  it('truncates the oldest trace events when the buffer reaches its limit', () => {
    const buffer = createTraceBuffer(3);

    buffer.push(makeEvent({ id: 'a' }));
    buffer.push(makeEvent({ id: 'b' }));
    buffer.push(makeEvent({ id: 'c' }));
    buffer.push(makeEvent({ id: 'd' }));

    expect(buffer.snapshot().map((event) => event.id)).toEqual(['b', 'c', 'd']);
  });

  it('hashes values without leaking raw text and remains stable', () => {
    expect(hashTraceValue('Snowboard IMG')).toBe(hashTraceValue('snowboard img'));
    expect(hashTraceValue('Snowboard IMG')).not.toContain('Snowboard');
    expect(hashTraceValue('')).toBe('');
  });

  it('serializes filter summaries into a compact deterministic string', () => {
    expect(summarizeTraceFilter({ kind: 'file', extensions: ['PNG', 'jpg'] })).toBe('file|ext:jpg,png');
    expect(summarizeTraceFilter(null)).toBe('');
  });

  it('sanitizes arbitrary details into trace-safe primitives', () => {
    expect(
      sanitizeTraceDetails({
        count: 3,
        ok: true,
        nested: { a: 1 },
        list: ['a', 'b']
      })
    ).toEqual({
      count: 3,
      ok: true,
      nested: '{"a":1}',
      list: 'a,b'
    });
  });

  it('aggregates idle windows by event key and total duration', () => {
    const summary = summarizeTraceWindow(
      [
        makeEvent({ source: 'renderer', subsystem: 'search', event: 'start', durationMs: 1.2 }),
        makeEvent({ id: '2', source: 'renderer', subsystem: 'search', event: 'start', durationMs: 2.5 }),
        makeEvent({ id: '3', source: 'main', subsystem: 'icon', event: 'complete', durationMs: 18.4 })
      ],
      1_000,
      4_000
    );

    expect(summary.idleMs).toBe(3_000);
    expect(summary.totalEvents).toBe(3);
    expect(summary.uniqueEventCount).toBe(2);
    expect(summary.topEvents[0]).toEqual({
      key: 'renderer:search:start',
      count: 2,
      totalDurationMs: 3.7
    });
  });
});
