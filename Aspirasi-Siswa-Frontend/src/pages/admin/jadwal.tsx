import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ToastStack, type ToastItem, type ToastType } from "../../components/admin/feedback"
import { fetchWithAdminAuth } from "../../lib/auth"
import {
    defaultScheduleConfigCollection,
    fetchAllScheduleConfigAdmin,
    fetchAllScheduleStatus,
    updateScheduleConfigAdmin,
    type ScheduleConfig,
    type ScheduleConfigCollection,
    type ScheduleStatus,
    type ScheduleTarget,
} from "../../lib/schedule"

const featureOrder = ["menfess", "songfess", "aspiration"]

const dayLabelMap: Record<string, string> = {
    sunday: "Minggu",
    monday: "Senin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Kamis",
    friday: "Jumat",
    saturday: "Sabtu",
}

function formatDaysToIndonesian(days: string): string {
    if (!days || days.trim() === "-") {
        return "-"
    }

    return days
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => dayLabelMap[value.toLowerCase()] ?? value)
        .join(", ")
}

function formatDateTime(value?: string): string {
    if (!value) {
        return "-"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "-"
    }

    return date.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function JadwalAdmin() {
    const [items, setItems] = useState<ScheduleStatus[]>([])
    const [configs, setConfigs] = useState<ScheduleConfigCollection>(defaultScheduleConfigCollection())
    const [loading, setLoading] = useState(true)
    const [savingTarget, setSavingTarget] = useState<ScheduleTarget | null>(null)
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const dayOptions = [
        { value: 1, label: "Senin" },
        { value: 2, label: "Selasa" },
        { value: 3, label: "Rabu" },
        { value: 4, label: "Kamis" },
        { value: 5, label: "Jumat" },
        { value: 6, label: "Sabtu" },
        { value: 0, label: "Minggu" },
    ]

    useEffect(() => {
        let active = true

        const load = async () => {
            try {
                const [statusData, configData] = await Promise.all([
                    fetchAllScheduleStatus(),
                    fetchAllScheduleConfigAdmin(fetchWithAdminAuth),
                ])
                if (!active) {
                    return
                }

                setItems(statusData)
                setConfigs(configData)
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        void load()

        return () => {
            active = false
        }
    }, [])

    const orderedItems = useMemo(() => {
        const scoreMap = new Map(featureOrder.map((value, index) => [value, index]))
        return [...items].sort((a, b) => {
            const left = scoreMap.get(a.feature) ?? 999
            const right = scoreMap.get(b.feature) ?? 999
            return left - right
        })
    }, [items])

    const patchConfig = (target: ScheduleTarget, patch: Partial<ScheduleConfig>) => {
        setConfigs((prev) => ({
            ...prev,
            [target]: {
                ...prev[target],
                ...patch,
            },
        }))
    }

    const showToast = (type: ToastType, message: string) => {
        const id = Date.now() + Math.floor(Math.random() * 1000)
        setToasts((previous) => [...previous, { id, type, message }])

        window.setTimeout(() => {
            setToasts((previous) => previous.filter((toast) => toast.id !== id))
        }, 3500)
    }

    const toggleDay = (target: ScheduleTarget, day: number) => {
        const targetConfig = configs[target]
        const next = targetConfig.enabled_days.includes(day)
            ? targetConfig.enabled_days.filter((value) => value !== day)
            : [...targetConfig.enabled_days, day]

        patchConfig(target, {
            enabled_days: next.sort((a, b) => a - b),
        })
    }

    const saveSchedule = async (target: ScheduleTarget) => {
        setSavingTarget(target)

        const selectedConfig = configs[target]
        const result = await updateScheduleConfigAdmin(fetchWithAdminAuth, target, {
            enabled_days: selectedConfig.enabled_days,
            open_at: selectedConfig.open_at,
            close_at: selectedConfig.close_at,
        })

        if (!result.ok) {
            showToast("error", result.message)
            setSavingTarget(null)
            return
        }

        const [statusData, configData] = await Promise.all([
            fetchAllScheduleStatus(),
            fetchAllScheduleConfigAdmin(fetchWithAdminAuth),
        ])

        setItems(statusData)
        setConfigs(configData)
        showToast("success", "Jadwal berhasil diperbarui")
        setSavingTarget(null)
    }

    const targetCards: Array<{ target: ScheduleTarget; title: string; description: string }> = [
        {
            target: "shared",
            title: "Menfess + Songfess",
            description: "Kedua layanan ini memakai jadwal yang sama.",
        },
        {
            target: "aspiration",
            title: "Aspirasi",
            description: "Layanan aspirasi bisa menggunakan jadwal berbeda.",
        },
    ]

    const container = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.45,
                ease: "easeOut" as const,
                staggerChildren: 0.12,
            },
        },
    }

    const itemVariant = {
        hidden: { opacity: 0, y: 14 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.35,
                ease: "easeOut" as const,
            },
        },
    }

    return (
        <motion.div className="mt-14 w-full md:w-4xl" initial="hidden" animate="show" variants={container}>
            <motion.div variants={itemVariant} className="rounded-2xl bg-black/20 border border-[#E8BB86]/60 backdrop-blur-md p-6">
                <h2 className="text-[#FBE49D] text-3xl md:text-4xl font-black uppercase tracking-wide">Jadwal Layanan</h2>
                <p className="text-white mt-3">
                    Atur jadwal per grup layanan. Menfess dan Songfess memakai jadwal bersama, sedangkan Aspirasi bisa disetel sendiri.
                </p>
            </motion.div>

            <motion.div variants={itemVariant} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {targetCards.map((card) => {
                    const current = configs[card.target]

                    return (
                        <motion.div
                            key={card.target}
                            className="rounded-2xl bg-black/25 border border-[#E8BB86]/60 p-5 shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E]"
                            variants={itemVariant}
                            whileHover={{ y: -2 }}
                        >
                            <p className="text-[#FBE49D] text-lg font-bold uppercase">{card.title}</p>
                            <p className="text-white/90 text-sm mt-1">{card.description}</p>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {dayOptions.map((day) => {
                                    const active = current.enabled_days.includes(day.value)
                                    return (
                                        <button
                                            key={`${card.target}-${day.value}`}
                                            type="button"
                                            onClick={() => toggleDay(card.target, day.value)}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                                active
                                                    ? "bg-[#FBE49D] text-[#7A1E2D]"
                                                    : "bg-white/15 text-white hover:bg-white/20"
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-white font-medium">Jam Buka</label>
                                    <input
                                        type="time"
                                        value={current.open_at}
                                        onChange={(event) => patchConfig(card.target, { open_at: event.target.value })}
                                        className="rounded-lg px-3 py-2 bg-white text-[#7A1E2D] font-semibold"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-white font-medium">Jam Tutup</label>
                                    <input
                                        type="time"
                                        value={current.close_at}
                                        onChange={(event) => patchConfig(card.target, { close_at: event.target.value })}
                                        className="rounded-lg px-3 py-2 bg-white text-[#7A1E2D] font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-5">
                                <button
                                    type="button"
                                    disabled={savingTarget !== null}
                                    onClick={() => void saveSchedule(card.target)}
                                    className="bg-[#942B3A] rounded-lg px-5 py-2 text-white font-semibold shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] disabled:opacity-60"
                                >
                                    {savingTarget === card.target ? "Menyimpan..." : "Simpan Jadwal"}
                                </button>
                            </div>
                        </motion.div>
                    )
                })}
            </motion.div>

            <ToastStack toasts={toasts} />

            {loading && (
                <motion.div
                    variants={itemVariant}
                    className="mt-6 rounded-2xl bg-black/20 border border-[#E8BB86]/40 px-5 py-4 text-white"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                    Memuat status jadwal...
                </motion.div>
            )}

            {!loading && (
                <motion.div variants={itemVariant} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {orderedItems.map((statusItem) => (
                        <motion.div
                            key={statusItem.feature}
                            className="rounded-2xl bg-black/25 border border-[#E8BB86]/50 p-4 shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E]"
                            variants={itemVariant}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-white text-xl font-bold uppercase">{statusItem.label}</p>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        statusItem.is_open ? "bg-emerald-500/30 text-emerald-100" : "bg-red-500/30 text-red-100"
                                    }`}
                                >
                                    {statusItem.is_open ? "BUKA" : "TUTUP"}
                                </span>
                            </div>

                            <p className="text-[#FBE49D] mt-3 text-sm break-words whitespace-normal">{statusItem.schedule_text}</p>
                            <div className="mt-4 space-y-2 text-sm text-white/95">
                                <p className="break-words whitespace-normal">
                                    Hari:
                                    <span className="block mt-1 break-words whitespace-normal leading-relaxed">
                                        {formatDaysToIndonesian(statusItem.days)}
                                    </span>
                                </p>
                                <p>Jam buka: {statusItem.open_at} WIB</p>
                                <p>Jam tutup: {statusItem.close_at} WIB</p>
                                <p>Waktu server: {formatDateTime(statusItem.server_time)} WIB</p>
                                {!statusItem.is_open && <p>Buka berikutnya: {formatDateTime(statusItem.next_open_at)} WIB</p>}
                                {statusItem.is_open && <p>Tutup berikutnya: {formatDateTime(statusItem.next_close_at)} WIB</p>}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    )
}
