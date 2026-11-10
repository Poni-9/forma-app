// Exercise the actual shipped AI client, resolved from index.html, with only its
// environment dependencies stubbed. No live accounts, API calls or paid usage.
// Run: node --experimental-vm-modules --test ai-client.test.mjs
// To demonstrate the regression: FORMAI_AI_TEST_REF=HEAD <same command>.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
import {createContext, SourceTextModule, SyntheticModule} from 'node:vm';
import {activeGraph} from './active-graph.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
// Integration clients share the same basename; identify the AI module by its
// public endpoint paths, never by a build-specific hashed filename.
const clients = [...activeGraph().modules].filter(path => /^assets\/client-[\w-]+\.js$/.test(path))
  .filter(path => readFileSync(new URL('../' + path, import.meta.url), 'utf8').includes('/api/gemini'));
assert.equal(clients.length, 1, 'one reachable AI client must be present');
const clientURL = new URL('../' + clients[0], import.meta.url).href;
const clientPath = relative(root, fileURLToPath(clientURL));
const source = process.env.FORMAI_AI_TEST_REF
  ? execFileSync('git', ['show', `${process.env.FORMAI_AI_TEST_REF}:${clientPath}`], {cwd: root, encoding: 'utf8'})
  : readFileSync(new URL(clientURL), 'utf8');

class AIError extends Error {
  constructor(kind, message, info = null) { super(message); this.kind = kind; this.info = info; }
}
const json = (body, status = 200) => () => new Response(JSON.stringify(body), {
  status, headers: {'content-type': 'application/json'},
});
const brokenJSON = () => new Response('{invalid', {status: 200, headers: {'content-type': 'application/json'}});
const networkFailure = () => { throw new TypeError('Simulated offline transport'); };
const sequence = (...steps) => {
  let index = 0;
  return (...args) => steps[Math.min(index++, steps.length - 1)](...args);
};
const allowed = {ok: true, skrbnik: false, kljuc: true};
const pendingJob = {id: 'fixture-job', state: 'tece', faza: 'misli', hb: 1};
const completeJob = {id: 'fixture-job', state: 'koncano', text: '{"answer":"OK"}'};
const request = {system: 'Test fixture only', messages: [], purpose: 'trener', effort: 'low'};
const plain = value => JSON.parse(JSON.stringify(value));

async function fixture(handlers = {}) {
  const calls = [], tokens = [], telemetry = [], values = new Map();
  let usage = 0, now = 1800000000000, token = 'fixture-old-firebase-token-000000000001', nextTimer = 0;
  const timers = new Map();
  class ClockDate extends Date { static now() { return now; } }
  const context = createContext({
    Response, TextDecoder, TextEncoder, AbortController,
    AbortSignal: {timeout: () => new AbortController().signal},
    Date: ClockDate,
    localStorage: {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)},
    // Retry/poll waits advance a virtual clock, so the original 15-minute bug
    // terminates deterministically too. Long request timers remain passive.
    setTimeout(callback, ms) {
      const id = ++nextTimer;
      timers.set(id, callback);
      if (ms <= 3000) queueMicrotask(() => {
        if (timers.delete(id)) { now += ms; callback(); }
      });
      return id;
    },
    clearTimeout: id => timers.delete(id),
    fetch: async (url, options = {}) => {
      const call = {url: String(url), path: new URL(url).pathname, method: options.method || 'GET', options};
      calls.push(call);
      let handler;
      if (call.path === '/api/claude/dostop') handler = handlers.access;
      else if (call.path === '/api/claude' && call.method === 'POST') handler = handlers.post;
      else if (call.path.startsWith('/api/claude/job/') && call.method === 'GET') handler = handlers.poll;
      else if (call.path.startsWith('/api/claude/job/') && call.method === 'DELETE') return json({ok: true})();
      else if (call.path === '/api/gemini') handler = handlers.gemini;
      else if (call.path === '/api/gemini/stream') handler = handlers.stream;
      assert.ok(handler, `Unexpected mocked request: ${call.method} ${call.path}`);
      return handler(call);
    },
  });
  // These are the public imports of the currently shipped client. Loading the
  // client through VM modules preserves its full transport/parsing/cache logic.
  const dependencies = {
    index: {P: 'https://fixture.invalid', t: (text, ...args) => text.replace(/\{(\d+)\}/g, (_, n) => args[n] ?? ''), F: 20, g: () => 'sl'},
    start: {
      aK: AIError,
      af: async force => {
        tokens.push(!!force);
        if (force) token = 'fixture-new-firebase-token-000000000002';
        return token;
      },
      aG: (...args) => telemetry.push(args), fL: () => { usage++; },
      aT: value => String(value), aU: {dejanjeR: []},
    },
  };
  const module = new SourceTextModule(source, {context, identifier: clientURL});
  await module.link(specifier => {
    const data = /\/index-/.test(specifier) ? dependencies.index : /\/start-/.test(specifier) ? dependencies.start : null;
    assert.ok(data, `Unexpected client dependency: ${specifier}`);
    return new SyntheticModule(Object.keys(data), function () {
      for (const [key, value] of Object.entries(data)) this.setExport(key, value);
    }, {context});
  });
  await module.evaluate();
  return {
    api: module.namespace, calls, tokens, telemetry,
    get usage() { return usage; },
    count: (path, method = 'GET') => calls.filter(call => call.path === path && call.method === method).length,
    advance: ms => { now += ms; },
  };
}

for (const [label, failure] of [
  ['network failure', networkFailure],
  ['HTTP 503', json({error: 'temporarily_unavailable'}, 503)],
  ['invalid JSON', brokenJSON],
  ['missing entitlement', json({})],
  ['string entitlement', json({ok: 'false'})],
  ['null payload', json(null)],
  ['array payload', json([])],
  ['error payload', json({ok: false, error: 'temporarily_unavailable'})],
  ['invalid key flag', json({ok: true, kljuc: 'yes'})],
  ['invalid admin flag', json({ok: true, skrbnik: 'yes'})],
]) {
  test(`Claude availability recovers immediately after ${label}`, async () => {
    const f = await fixture({access: sequence(failure, json(allowed))});
    assert.equal((await f.api.h()).ok, false);
    assert.equal((await f.api.h()).ok, true, 'transport/protocol failures must not be cached as a denial');
    assert.equal(f.count('/api/claude/dostop'), 2);
  });
}

test('Claude caches explicit valid denial, expires it and honors force refresh', async () => {
  const f = await fixture({access: sequence(json({ok: false}), json(allowed))});
  assert.equal((await f.api.h()).ok, false);
  assert.equal((await f.api.h()).ok, false);
  assert.equal(f.count('/api/claude/dostop'), 1);
  f.advance(600001);
  assert.equal((await f.api.h()).ok, true);
  await f.api.h(true);
  assert.equal(f.count('/api/claude/dostop'), 3);
});

test('Claude availability refreshes an expired token once and caches under the refreshed identity', async () => {
  const f = await fixture({access: sequence(json({error: 'neveljaven_token'}, 401), json(allowed))});
  assert.equal((await f.api.h()).ok, true);
  assert.deepEqual(f.tokens, [false, true]);
  assert.equal((await f.api.h()).ok, true);
  assert.equal(f.count('/api/claude/dostop'), 2, 'the refreshed token should hit the successful cache');
  assert.notEqual(f.calls[0].options.headers.Authorization, f.calls[1].options.headers.Authorization);
});

test('Claude availability never loops refreshing a rejected token', async () => {
  const f = await fixture({access: json({error: 'neveljaven_token'}, 401)});
  assert.equal((await f.api.h()).ok, false);
  assert.equal(f.count('/api/claude/dostop'), 2);
  assert.deepEqual(f.tokens, [false, true]);
});

test('Claude completes one queued job and cleans it up once', async () => {
  const f = await fixture({post: json({job: pendingJob}, 202), poll: json({job: completeJob})});
  assert.deepEqual(plain(await f.api.e(request)), {answer: 'OK'});
  assert.equal(f.count('/api/claude', 'POST'), 1);
  assert.equal(f.count('/api/claude/job/fixture-job'), 1);
  assert.equal(f.count('/api/claude/job/fixture-job', 'DELETE'), 1);
  assert.equal(f.usage, 1);
});

test('Claude reports a terminal job error without starting another paid request', async () => {
  const f = await fixture({post: json({job: pendingJob}, 202), poll: json({job: {id: 'fixture-job', state: 'napaka', status: 503, error: 'ai_placilo'}})});
  await assert.rejects(f.api.e(request), error => error.kind === 'network' && /ponudniku/.test(error.message));
  assert.equal(f.count('/api/claude', 'POST'), 1);
  assert.equal(f.count('/api/claude/job/fixture-job'), 1);
});

for (const [label, failure] of [
  ['network failure', networkFailure],
  ['HTTP 429', json({error: 'prehitro'}, 429)],
  ['HTTP 503', json({error: 'temporarily_unavailable'}, 503)],
  ['invalid JSON', brokenJSON],
  ['missing job', json({})],
  ['missing job state', json({job: {id: 'fixture-job'}})],
  ['completed job without text', json({job: {id: 'fixture-job', state: 'koncano'}})],
  ['failed job without error', json({job: {id: 'fixture-job', state: 'napaka'}})],
]) {
  test(`Claude bounds repeated polling ${label} without duplicate POST or DELETE`, async () => {
    const f = await fixture({post: json({job: pendingJob}, 202), poll: failure});
    await assert.rejects(f.api.e(request), error => error instanceof AIError);
    assert.equal(f.count('/api/claude/job/fixture-job'), 3, 'stop after three consecutive transient failures');
    assert.equal(f.count('/api/claude', 'POST'), 1);
    assert.equal(f.count('/api/claude/job/fixture-job', 'DELETE'), 0, 'a transport failure must preserve the server job for recovery');
  });
}

test('Claude polling recovers and resets the transient failure streak after valid progress', async () => {
  const f = await fixture({
    post: json({job: pendingJob}, 202),
    poll: sequence(networkFailure, json({}, 503), json({job: {...pendingJob, hb: 4}}), networkFailure, json({}, 503), json({job: completeJob})),
  });
  assert.deepEqual(plain(await f.api.e(request)), {answer: 'OK'});
  assert.equal(f.count('/api/claude/job/fixture-job'), 6);
  assert.equal(f.count('/api/claude', 'POST'), 1);
});

for (const status of [403, 404]) {
  test(`Claude ends polling immediately on HTTP ${status}`, async () => {
    const f = await fixture({post: json({job: pendingJob}, 202), poll: json({error: 'denied'}, status)});
    await assert.rejects(f.api.e(request), error => error instanceof AIError);
    assert.equal(f.count('/api/claude/job/fixture-job'), 1);
    assert.equal(f.count('/api/claude', 'POST'), 1);
    assert.equal(f.count('/api/claude/job/fixture-job', 'DELETE'), 0);
  });
}

test('Claude polling refreshes an expired token and resumes the same job', async () => {
  const f = await fixture({post: json({job: pendingJob}, 202), poll: sequence(json({error: 'neveljaven_token'}, 401), json({job: completeJob}))});
  assert.deepEqual(plain(await f.api.e(request)), {answer: 'OK'});
  assert.deepEqual(f.tokens, [false, true]);
  assert.equal(f.count('/api/claude', 'POST'), 1);
  const polls = f.calls.filter(call => call.path.endsWith('/fixture-job') && call.method === 'GET');
  assert.notEqual(polls[0].options.headers.Authorization, polls[1].options.headers.Authorization);
});

test('Claude stops a repeated polling 401 after one token refresh', async () => {
  const f = await fixture({post: json({job: pendingJob}, 202), poll: json({error: 'neveljaven_token'}, 401)});
  await assert.rejects(f.api.e(request), error => error.kind === 'auth');
  assert.deepEqual(f.tokens, [false, true]);
  assert.equal(f.count('/api/claude/job/fixture-job'), 2);
  assert.equal(f.count('/api/claude', 'POST'), 1);
  assert.equal(f.count('/api/claude/job/fixture-job', 'DELETE'), 0);
});

test('Claude rejects a newly returned job without an id before polling', async () => {
  const f = await fixture({post: json({job: {state: 'tece'}}, 202), poll: json({})});
  await assert.rejects(f.api.e(request), error => error.kind === 'parse');
  assert.equal(f.calls.filter(call => call.method === 'GET').length, 0);
  assert.equal(f.count('/api/claude', 'POST'), 1);
});

test('Claude user cancellation still deletes the running job and removes the abort listener', async () => {
  const f = await fixture({post: json({job: pendingJob}, 202), poll: json({job: pendingJob})});
  const controller = new AbortController();
  let added = 0, removed = 0;
  const add = controller.signal.addEventListener.bind(controller.signal);
  const remove = controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.addEventListener = (...args) => { added++; return add(...args); };
  controller.signal.removeEventListener = (...args) => { removed++; return remove(...args); };
  await assert.rejects(f.api.e(request, {signal: controller.signal, onProgress: () => controller.abort()}), error => error instanceof AIError);
  assert.equal(f.count('/api/claude/job/fixture-job', 'DELETE'), 1);
  assert.equal(f.count('/api/claude/job/fixture-job'), 0);
  assert.equal(f.count('/api/claude', 'POST'), 1);
  assert.equal(added, removed);
});

test('Gemini distinguishes the user monthly quota from provider billing failure', async () => {
  const user = await fixture({gemini: json({error: 'limit', kind: 'mesec', limit: 100}, 402)});
  await assert.rejects(user.api.c([{text: 'Fixture'}]), error => error.kind === 'quota' && error.info.code === 'limit' && /Mesečna/.test(error.message));
  const provider = await fixture({gemini: json({error: 'ai_placilo'}, 503)});
  await assert.rejects(provider.api.c([{text: 'Fixture'}]), error => error.kind === 'network' && /ponudniku/.test(error.message));
  assert.equal(user.count('/api/gemini', 'POST'), 1);
  assert.equal(provider.count('/api/gemini', 'POST'), 1);
});

test('Gemini streaming joins chunks and does not start a fallback on success', async () => {
  const updates = [];
  const f = await fixture({stream: () => new Response('data: {"t":"Hello "}\n\ndata: {"t":"world"}\n\ndata: {"done":true}\n\n', {headers: {'content-type': 'text/event-stream'}})});
  assert.equal(await f.api.j([{text: 'Fixture'}], {onText: text => updates.push(text)}), 'Hello world');
  assert.deepEqual(updates, ['Hello ', 'Hello world']);
  assert.equal(f.count('/api/gemini/stream', 'POST'), 1);
  assert.equal(f.count('/api/gemini', 'POST'), 0);
});
