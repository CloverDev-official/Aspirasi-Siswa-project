export type SubmissionFeature = "menfess" | "songfess" | "aspiration"
export type ScheduleTarget = "shared" | "aspiration"

export type ScheduleConfig = {
    target: ScheduleTarget
    enabled_days: number[]
    open_at: string
    close_at: string
    timezone: string
}

export type ScheduleConfigCollection = {
    shared: ScheduleConfig
    aspiration: ScheduleConfig
}

export type ScheduleStatus = {
    feature: string
    label: string
    is_open: boolean
    days: string
    open_at: string
    close_at: string
    timezone: string
    server_time: string
    next_open_at?: string
    next_close_at?: string
    schedule_text: string
}

type ApiResponse<T> = {
    success: boolean
    code: string
    message: string
    data?: T
}

const featureLabelMap: Record<SubmissionFeature, string> = {
    menfess: "Menfess",
    songfess: "Songfess",
    aspiration: "Aspirasi",
}

function fallbackStatus(feature: SubmissionFeature): ScheduleStatus {
    const now = new Date()
    const guessedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

    return {
        feature,
        label: featureLabelMap[feature],
        is_open: false,
        days: "-",
        open_at: "-",
        close_at: "-",
        timezone: guessedTimezone,
        server_time: now.toISOString(),
        schedule_text: "Jadwal mengikuti konfigurasi server",
    }
}

function isScheduleStatus(value: unknown): value is ScheduleStatus {
    if (!value || typeof value !== "object") {
        return false
    }

    const record = value as Record<string, unknown>
    return (
        typeof record.feature === "string" &&
        typeof record.label === "string" &&
        typeof record.is_open === "boolean" &&
        typeof record.schedule_text === "string"
    )
}

export async function fetchScheduleStatus(feature: SubmissionFeature): Promise<ScheduleStatus> {
    try {
        const response = await fetch(`/api/v1/schedule/status/${feature}`)
        const payload: ApiResponse<ScheduleStatus> | null = await response.json().catch(() => null)

        if (response.ok && payload?.data && isScheduleStatus(payload.data)) {
            return payload.data
        }
    } catch (_error) {
        // Fallback to local rule when API status endpoint is not reachable.
    }

    return fallbackStatus(feature)
}

export async function fetchAllScheduleStatus(): Promise<ScheduleStatus[]> {
    try {
        const response = await fetch("/api/v1/schedule/status")
        const payload: ApiResponse<{ items?: ScheduleStatus[] }> | null = await response.json().catch(() => null)

        if (response.ok && Array.isArray(payload?.data?.items)) {
            return payload.data.items.filter(isScheduleStatus)
        }
    } catch (_error) {
        // Fallback handled below.
    }

    return [fallbackStatus("menfess"), fallbackStatus("songfess"), fallbackStatus("aspiration")]
}

export function defaultScheduleConfig(): ScheduleConfig {
    const guessedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

    return {
        target: "shared",
        enabled_days: [],
        open_at: "",
        close_at: "",
        timezone: guessedTimezone,
    }
}

function defaultScheduleConfigForTarget(target: ScheduleTarget): ScheduleConfig {
    return {
        ...defaultScheduleConfig(),
        target,
    }
}

export function defaultScheduleConfigCollection(): ScheduleConfigCollection {
    return {
        shared: defaultScheduleConfigForTarget("shared"),
        aspiration: defaultScheduleConfigForTarget("aspiration"),
    }
}

function isScheduleConfig(value: unknown): value is ScheduleConfig {
    if (!value || typeof value !== "object") {
        return false
    }

    const record = value as Record<string, unknown>
    return (
        (record.target === "shared" || record.target === "aspiration") &&
        Array.isArray(record.enabled_days) &&
        typeof record.open_at === "string" &&
        typeof record.close_at === "string" &&
        typeof record.timezone === "string"
    )
}

function isScheduleConfigCollection(value: unknown): value is ScheduleConfigCollection {
    if (!value || typeof value !== "object") {
        return false
    }

    const record = value as Record<string, unknown>
    return isScheduleConfig(record.shared) && isScheduleConfig(record.aspiration)
}

export async function fetchScheduleConfigAdmin(
    fetcher: typeof fetch,
    target: ScheduleTarget,
): Promise<ScheduleConfig> {
    try {
        const response = await fetcher(`/api/v1/admin/schedule/config/${target}`, {
            method: "GET",
        })
        const payload: ApiResponse<ScheduleConfig> | null = await response.json().catch(() => null)

        if (response.ok && payload?.data && isScheduleConfig(payload.data)) {
            return payload.data
        }
    } catch (_error) {
        // Fallback handled below.
    }

    return defaultScheduleConfigForTarget(target)
}

export async function fetchAllScheduleConfigAdmin(fetcher: typeof fetch): Promise<ScheduleConfigCollection> {
    try {
        const response = await fetcher("/api/v1/admin/schedule/config", {
            method: "GET",
        })
        const payload: ApiResponse<ScheduleConfigCollection> | null = await response.json().catch(() => null)

        if (response.ok && payload?.data && isScheduleConfigCollection(payload.data)) {
            return payload.data
        }
    } catch (_error) {
        // Fallback handled below.
    }

    return defaultScheduleConfigCollection()
}

export async function updateScheduleConfigAdmin(
    fetcher: typeof fetch,
    target: ScheduleTarget,
    config: Pick<ScheduleConfig, "enabled_days" | "open_at" | "close_at">,
): Promise<{ ok: boolean; message: string; data?: ScheduleConfig }> {
    try {
        const response = await fetcher(`/api/v1/admin/schedule/config/${target}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(config),
        })

        const payload: ApiResponse<ScheduleConfig> | null = await response.json().catch(() => null)
        if (!response.ok) {
            return {
                ok: false,
                message: payload?.message ?? "Gagal memperbarui jadwal",
            }
        }

        return {
            ok: true,
            message: payload?.message ?? "Jadwal berhasil diperbarui",
            data: payload?.data,
        }
    } catch (_error) {
        return {
            ok: false,
            message: "Tidak dapat terhubung ke server",
        }
    }
}
