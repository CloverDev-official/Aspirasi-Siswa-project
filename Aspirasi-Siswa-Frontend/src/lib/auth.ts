export type AdminSessionStatus = "authorized" | "unauthorized" | "error"

type ValidateStepStatus = AdminSessionStatus | "needs-refresh"

type AuthTokensResponse = {
    data?: {
        access_token?: string
        refresh_token?: string
    } | null
}

type ValidateResponse = {
    code?: string
    data?: {
        valid?: boolean
        role?: string
    } | null
}

export const ACCESS_TOKEN_COOKIE_KEY = "admin_access_token"
export const REFRESH_TOKEN_COOKIE_KEY = "admin_refresh_token"

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function setCookie(name: string, value: string, maxAgeSeconds: number) {
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function getCookieValue(name: string): string | null {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`))

    if (!match) {
        return null
    }

    return decodeURIComponent(match[1])
}

export function getAccessToken(): string | null {
    return getCookieValue(ACCESS_TOKEN_COOKIE_KEY)
}

export function getRefreshToken(): string | null {
    return getCookieValue(REFRESH_TOKEN_COOKIE_KEY)
}

export function clearAuthTokens() {
    deleteCookie(ACCESS_TOKEN_COOKIE_KEY)
    deleteCookie(REFRESH_TOKEN_COOKIE_KEY)
}

export function storeAuthTokens(accessToken: string, refreshToken?: string) {
    setCookie(ACCESS_TOKEN_COOKIE_KEY, accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS)

    if (refreshToken) {
        setCookie(REFRESH_TOKEN_COOKIE_KEY, refreshToken, REFRESH_TOKEN_MAX_AGE_SECONDS)
    }
}

export async function refreshAccessToken(signal?: AbortSignal): Promise<"refreshed" | "unauthorized" | "error"> {
    const refreshToken = getRefreshToken()

    if (!refreshToken) {
        clearAuthTokens()
        return "unauthorized"
    }

    try {
        const response = await fetch("/api/v1/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
            signal,
        })

        const payload: AuthTokensResponse | null = await response.json().catch(() => null)

        if (response.status === 200) {
            const nextAccessToken = payload?.data?.access_token
            const nextRefreshToken = payload?.data?.refresh_token ?? refreshToken

            if (!nextAccessToken) {
                return "error"
            }

            storeAuthTokens(nextAccessToken, nextRefreshToken)
            return "refreshed"
        }

        if (response.status === 400 || response.status === 401 || response.status === 403) {
            clearAuthTokens()
            return "unauthorized"
        }

        if (response.status >= 500) {
            return "error"
        }

        return "unauthorized"
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error
        }

        return "error"
    }
}

async function validateAdminAccessToken(signal?: AbortSignal): Promise<ValidateStepStatus> {
    const accessToken = getAccessToken()

    if (!accessToken) {
        return getRefreshToken() ? "needs-refresh" : "unauthorized"
    }

    try {
        const response = await fetch("/api/v1/auth/validate", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            signal,
        })

        if (response.status === 200) {
            const payload: ValidateResponse | null = await response.json().catch(() => null)
            const isValid = payload?.code === "ACCESS_TOKEN_VALID" && payload?.data?.valid === true
            const isAdmin = payload?.data?.role === "admin"

            if (isValid && isAdmin) {
                return "authorized"
            }

            return "unauthorized"
        }

        if (response.status === 401) {
            return "needs-refresh"
        }

        if (response.status === 403) {
            return "unauthorized"
        }

        if (response.status >= 500) {
            return "error"
        }

        return "unauthorized"
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error
        }

        return "error"
    }
}

export async function validateAdminSession(signal?: AbortSignal): Promise<AdminSessionStatus> {
    const firstValidation = await validateAdminAccessToken(signal)

    if (firstValidation === "authorized" || firstValidation === "unauthorized" || firstValidation === "error") {
        return firstValidation
    }

    const refreshStatus = await refreshAccessToken(signal)

    if (refreshStatus === "unauthorized") {
        return "unauthorized"
    }

    if (refreshStatus === "error") {
        return "error"
    }

    const secondValidation = await validateAdminAccessToken(signal)

    if (secondValidation === "needs-refresh") {
        clearAuthTokens()
        return "unauthorized"
    }

    return secondValidation
}

export async function fetchWithAdminAuth(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const makeRequest = () => {
        const headers = new Headers(init.headers)
        const accessToken = getAccessToken()

        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`)
        }

        return fetch(input, {
            ...init,
            headers,
        })
    }

    const firstResponse = await makeRequest()

    if (firstResponse.status !== 401) {
        return firstResponse
    }

    const refreshStatus = await refreshAccessToken(init.signal ?? undefined)

    if (refreshStatus !== "refreshed") {
        return firstResponse
    }

    return makeRequest()
}
