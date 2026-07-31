import { offlineDB } from '@/lib/offline-db';

interface ApiRequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

export type ApiResponse<T = any> = 
    | { status: "ok"; data: T; response: Response }
    | { status: "auth_expired"; error: string }
    | { status: "queued_offline"; message: string };

let currentAccessTokenGetter: (() => string | null) | null = null;
let currentAccessTokenSetter: ((token: string | null, expiresAt: number | null) => void) | null = null;

export function registerAuthAccessors(
    getter: () => string | null,
    setter: (token: string | null, expiresAt: number | null) => void
) {
    currentAccessTokenGetter = getter;
    currentAccessTokenSetter = setter;
}

async function tryRefresh(): Promise<string | null> {
    try {
        const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
        });
        if (res.ok) {
            const data = await res.json();
            if (data.accessToken && currentAccessTokenSetter) {
                currentAccessTokenSetter(data.accessToken, Date.now() + data.expiresIn * 1000);
            }
            return data.accessToken;
        }
    } catch {
        // Network error during refresh - return null without forcing re-auth
    }
    return null;
}

export async function apiRequest<T = any>(
    url: string,
    options: ApiRequestOptions = {},
    providedAccessToken?: string | null
): Promise<ApiResponse<T>> {
    let token = providedAccessToken || (currentAccessTokenGetter ? currentAccessTokenGetter() : null);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        let res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });

        if (res.status === 401) {
            // GERÇEK auth hatası — silent refresh dene
            const refreshedToken = await tryRefresh();
            if (refreshedToken) {
                headers['Authorization'] = `Bearer ${refreshedToken}`;
                res = await fetch(url, {
                    ...options,
                    headers,
                    credentials: 'include'
                });
            } else {
                return { status: "auth_expired", error: "Oturum süresi doldu — tekrar giriş yapın." };
            }
        }

        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        return { status: "ok", data, response: res };

    } catch (networkError: any) {
        // Bağlantı koptu — OTURUM KESİNLİKLE SONLANDIRILMAYACAK, isteği offline kuyruğa al
        try {
            if (options.method && options.method !== 'GET') {
                await offlineDB.addPendingLog({
                    operationId: url,
                    type: 'API_RETRY',
                    category: 'NETWORK_OFFLINE',
                    message: JSON.stringify({ url, options })
                });
            }
        } catch (e) {
            console.error("Failed to queue offline request", e);
        }

        return { 
            status: "queued_offline", 
            message: "Bağlantı yok — veriler bekliyor, otomatik gönderilecek." 
        };
    }
}
