// Source of the 3.76.50 distribution hotfix. Keep this contract in the source app.
import {P as proxy, t} from './index-kbgVKkft.js';

export class AuthTicketError extends Error {
  constructor(kind, message, status = 0, code = null) {
    super(message); this.name = 'AuthTicketError';
    this.kind = kind; this.status = status; this.code = code;
  }
}
const messages = {
  auth: () => t('Prijava je potekla — prijavi se znova, da povežeš napravo.'),
  forbidden: () => t('Strežnik je zavrnil povezovanje (403). Poskusi se prijaviti znova.'),
  rate_limit: () => t('Preveč poskusov povezovanja — počakaj minuto in poskusi znova.'),
  server: () => t('Strežnik trenutno ne more pripraviti povezave — poskusi znova čez minuto.'),
  protocol: () => t('Strežnik je vrnil neveljaven odgovor za povezavo — poskusi znova.'),
  timeout: () => t('Priprava povezave traja predolgo — preveri internet in poskusi znova.'),
  cancelled: () => t('Povezovanje je preklicano.'),
  network: () => t('Povezave s strežnikom ni mogoče vzpostaviti — preveri internet in poskusi znova.'),
};
const error = (kind, status = 0, code = null) => new AuthTicketError(kind, messages[kind](), status, code);

async function authUrl(path, token, suffix = '', options = {}) {
  if (!token) throw error('auth', 401, 'prijava_potrebna');
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  if (options.signal?.aborted) throw error('cancelled');
  options.signal?.addEventListener('abort', abort, {once: true});
  const timer = setTimeout(() => { timedOut = true; controller.abort(); },
    Math.max(1, Math.min(options.timeoutMs ?? 20000, 20000)));
  try {
    const response = await fetch(`${proxy}/api/auth/ticket`, {
      method: 'POST', headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store', signal: controller.signal,
    });
    // Read only an allowlisted machine code. Never display arbitrary server text.
    let body;
    try { body = await response.json(); }
    catch (cause) {
      if (controller.signal.aborted) throw cause;
      if (response.ok) throw error('protocol', response.status, 'invalid_json');
    }
    const code = typeof body?.error === 'string' && /^[a-z0-9_]{1,64}$/.test(body.error) ? body.error : null;
    if (!response.ok) {
      const kind = response.status === 401 ? 'auth' : response.status === 403 ? 'forbidden'
        : response.status === 429 ? 'rate_limit' : response.status >= 500 ? 'server' : 'protocol';
      throw error(kind, response.status, code);
    }
    if (typeof body?.k !== 'string' || !/^[A-Za-z0-9_-]{32,64}$/.test(body.k))
      throw error('protocol', response.status, 'invalid_ticket');
    if (controller.signal.aborted) throw error(timedOut ? 'timeout' : 'cancelled');
    return `${proxy}${path}?k=${encodeURIComponent(body.k)}${suffix}`;
  } catch (cause) {
    if (cause instanceof AuthTicketError) throw cause;
    if (controller.signal.aborted) throw error(timedOut ? 'timeout' : 'cancelled');
    throw error('network');
  } finally {
    clearTimeout(timer); options.signal?.removeEventListener('abort', abort);
  }
}
export {authUrl as a};
