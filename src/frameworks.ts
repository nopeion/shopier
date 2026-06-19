import { ValidationError } from './errors';
import { PaymentLinkResult } from './payments';
import { ShopierWebhookDispatchResult, ShopierWebhookRouter, WebhookHeadersInput } from './webhooks';

export interface NodeLikeResponse {
  status?: (code: number) => NodeLikeResponse;
  type?: (value: string) => NodeLikeResponse;
  json?: (body: unknown) => unknown;
  send?: (body: string) => unknown;
  setHeader?: (name: string, value: string) => unknown;
  end?: (body?: string) => unknown;
}

export interface WebhookRequestLike {
  headers: WebhookHeadersInput;
  text: () => Promise<string>;
}

export function createHtmlResponse(html: string, init: ResponseInit = {}): Response {
  return createWebResponse(html, {
    ...init,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...headersToRecord(init.headers),
    },
  });
}

export function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return createWebResponse(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headersToRecord(init.headers),
    },
  });
}

export function createRedirectResponse(url: string, status = 303): Response {
  return createWebResponse(null, {
    status,
    headers: {
      location: url,
    },
  });
}

export function createPaymentResponse(payment: PaymentLinkResult): Response {
  const checkoutHtml = payment.checkoutHtml ?? payment.hostedCheckoutHtml ?? payment.fastPayHtml;

  if (checkoutHtml) {
    return createHtmlResponse(checkoutHtml);
  }

  return createRedirectResponse(payment.paymentUrl);
}

export function sendHtml(res: NodeLikeResponse, html: string, status = 200): unknown {
  if (typeof res.status === 'function') {
    res.status(status);
  }

  if (typeof res.type === 'function') {
    res.type('html');
  } else if (typeof res.setHeader === 'function') {
    res.setHeader('content-type', 'text/html; charset=utf-8');
  }

  if (typeof res.send === 'function') {
    return res.send(html);
  }

  if (typeof res.end === 'function') {
    return res.end(html);
  }

  return undefined;
}

export function sendJson(res: NodeLikeResponse, body: unknown, status = 200): unknown {
  if (typeof res.status === 'function') {
    res.status(status);
  }

  if (typeof res.json === 'function') {
    return res.json(body);
  }

  const serialized = JSON.stringify(body);
  if (typeof res.setHeader === 'function') {
    res.setHeader('content-type', 'application/json; charset=utf-8');
  }

  if (typeof res.send === 'function') {
    return res.send(serialized);
  }

  if (typeof res.end === 'function') {
    return res.end(serialized);
  }

  return undefined;
}

export async function handleWebhookRequest<TBody = unknown>(
  request: WebhookRequestLike,
  router: ShopierWebhookRouter
): Promise<Response> {
  const body = await request.text();
  const result = await router.dispatch<TBody>(request.headers, body);

  return createJsonResponse(toSerializableDispatchResult(result));
}

function toSerializableDispatchResult(result: ShopierWebhookDispatchResult): Record<string, unknown> {
  return {
    ok: true,
    handled: result.handled,
    handlerCount: result.handlerCount,
    event: {
      id: result.event.id,
      type: result.event.type,
      createdAt: result.event.createdAt,
    },
  };
}

function headersToRecord(headers: ResponseInit['headers'] | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  const normalizedEntries: Array<[string, string]> = Object.entries(headers).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map(String).join(', ') : String(value),
  ]);

  return Object.fromEntries(normalizedEntries);
}

function createWebResponse(body: string | null, init: ResponseInit): Response {
  if (typeof Response === 'undefined') {
    throw new ValidationError('Global Response is required for fetch-style framework helpers');
  }

  return new Response(body, init);
}
