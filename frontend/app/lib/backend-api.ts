type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

type CsrfResponse = {
  token: string;
  headerName: string;
};

let csrfToken: CsrfResponse | null = null;

async function loadCsrf(force = false) {
  if (!csrfToken || force) {
    const response = await fetch("/backend-api/api/auth/csrf", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Security token could not be loaded");
    const envelope = (await response.json()) as ApiEnvelope<CsrfResponse>;
    csrfToken = envelope.data;
  }
  return csrfToken;
}

export async function backendApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");

  if (isMutation) {
    const csrf = await loadCsrf();
    headers.set(csrf.headerName, csrf.token);
  }

  let response = await fetch(`/backend-api/api${path}`, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  if (isMutation && response.status === 403) {
    const csrf = await loadCsrf(true);
    headers.set(csrf.headerName, csrf.token);
    response = await fetch(`/backend-api/api${path}`, {
      ...options,
      method,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string }
    | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }
  return payload as ApiEnvelope<T>;
}
