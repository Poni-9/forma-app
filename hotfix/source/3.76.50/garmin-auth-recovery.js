// Pure adapter, exercised through the actual shipped Garmin client in tests.
// A CORS-blocked ticket error is never assumed to be an authentication error.
// The existing readable /garmin/status endpoint must independently confirm 401.
export function createGarminAuthFlow({getToken, hasSession, getOwner, authUrl, proxy, ErrorType, t, navigate}) {
  let pending = null;
  const fail = (kind, message, status = 0, code = null) => new ErrorType(kind, t(message), status, code);
  const expired = () => fail('auth', 'Prijava je potekla — prijavi se znova, da povežeš Garmin.', 401, 'prijava_potrebna');
  const timeout = () => fail('timeout', 'Priprava povezave traja predolgo — preveri internet in poskusi znova.');
  const cancelled = () => fail('cancelled', 'Povezovanje je preklicano.');

  async function run(options) {
    const owner = getOwner();
    const deadline = Date.now() + 30000;
    let refreshed = false;
    const check = () => {
      if (options.signal?.aborted) throw cancelled();
      if (getOwner() !== owner) throw fail('auth', 'Račun se je med povezovanjem spremenil — poskusi znova.', 401, 'account_changed');
      if (Date.now() >= deadline) throw timeout();
    };
    async function bounded(work, limit, onTimeout = () => {}) {
      check();
      let timer;
      let abort;
      try {
        const result = await Promise.race([
          Promise.resolve().then(work),
          new Promise((_, reject) => {
            timer = setTimeout(() => { onTimeout(); reject(timeout()); }, Math.min(limit, deadline - Date.now()));
            abort = () => { onTimeout(); reject(cancelled()); };
            options.signal?.addEventListener('abort', abort, {once: true});
          }),
        ]);
        check(); return result;
      } finally {
        clearTimeout(timer); options.signal?.removeEventListener('abort', abort);
      }
    }
    async function token(force) {
      if (force) refreshed = true;
      return bounded(() => getToken(force).catch(() => null), 10000);
    }
    async function authWasRejected(value) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
      const controller = new AbortController();
      try {
        const response = await bounded(() => fetch(`${proxy}/garmin/status`, {
          method: 'GET', headers: {Authorization: `Bearer ${value}`, Accept: 'application/json'},
          cache: 'no-store', signal: controller.signal,
        }), 7000, () => controller.abort());
        return response.status === 401;
      } catch (cause) {
        if (cause?.code === 'account_changed' || options.signal?.aborted || Date.now() >= deadline) throw cause;
        return false;
      } finally { controller.abort(); }
    }
    let value = await token(false);
    if (!value) value = await token(true);
    if (!value) {
      if (!hasSession()) throw expired();
      throw fail('network', 'Prijave ni mogoče osvežiti — preveri internet in poskusi znova.');
    }
    for (;;) {
      check();
      try {
        const url = await authUrl('/garmin/auth', value, '', {
          signal: options.signal, timeoutMs: Math.min(20000, deadline - Date.now()),
        });
        check(); navigate(url); return;
      } catch (cause) {
        check();
        let rejected = cause?.status === 401;
        // This is a read-only diagnosis, not a replacement ticket endpoint.
        if (!rejected && cause?.kind === 'network') rejected = await authWasRejected(value);
        if (rejected) {
          if (refreshed) throw expired();
          value = await token(true);
          if (!value) throw expired();
          continue;
        }
        if (cause instanceof ErrorType) throw cause;
        throw new ErrorType(cause?.kind || 'network', cause?.message || t('Povezava z Garminom ni uspela.'), cause?.status || 0, cause?.code || null);
      }
    }
  }
  return function connect(options = {}) {
    if (pending) return pending;
    pending = run(options).finally(() => { pending = null; });
    return pending;
  };
}
