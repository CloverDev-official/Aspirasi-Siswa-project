import { motion } from "framer-motion"
import React, { useEffect, useState } from "react"
import ScheduleClosedCard from "../../components/user/schedule-closed-card"
import { fetchScheduleStatus, type ScheduleStatus } from "../../lib/schedule"

type SongfessApiPayload = {
    message?: string
    code?: string
    data?: {
        status?: ScheduleStatus
    }
}

export default function Songfess() {
    const [showSuccess, setShowSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingSchedule, setLoadingSchedule] = useState(true)
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")
    const [songName, setSongName] = useState("")
    const [message, setMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [schedule, setSchedule] = useState<ScheduleStatus | null>(null)

    useEffect(() => {
        let active = true

        const loadSchedule = async () => {
            try {
                const data = await fetchScheduleStatus("songfess")
                if (active) {
                    setSchedule(data)
                }
            } finally {
                if (active) {
                    setLoadingSchedule(false)
                }
            }
        }

        void loadSchedule()

        return () => {
            active = false
        }
    }, [])

    const isClosed = schedule ? !schedule.is_open : false

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (isClosed) {
            setErrorMessage("Jadwal pengiriman sedang tutup")
            return
        }
        void sendToApi()
    }

    const sendToApi = async () => {
        try {
            setLoading(true)
            setErrorMessage("")

            const res = await fetch("/api/v1/songfess", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: from.trim(),
                    to: to.trim(),
                    song_name: songName.trim(),
                    message: message.trim(),
                }),
            })

            const payload: SongfessApiPayload | null = await res.json().catch(() => null)

            if (!res.ok) {
                if (payload?.data?.status) {
                    setSchedule(payload.data.status)
                }
                const apiMessage = payload?.message ?? "Gagal mengirim songfess"
                throw new Error(apiMessage)
            }

            setShowSuccess(true)
            setFrom("")
            setTo("")
            setSongName("")
            setMessage("")
            setErrorMessage("")
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message)
                return
            }

            setErrorMessage("Terjadi kesalahan yang tidak diketahui")
        } finally {
            setLoading(false)
        }
    }

    if (loadingSchedule) {
        return (
            <div className="mt-14 w-full md:w-3xl">
                <div className="rounded-2xl bg-black/20 border border-[#E8BB86]/50 px-5 py-4 text-white">
                    Memuat jadwal layanan...
                </div>
            </div>
        )
    }

    if (isClosed && schedule) {
        return (
            <div className="mt-14 w-full md:w-3xl">
                <ScheduleClosedCard title="Songfess" scheduleText={schedule.schedule_text} nextOpenAt={schedule.next_open_at} />
            </div>
        )
    }

    return (
        <div className="mt-14 w-full md:w-3xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        nama pengirim
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="Masukkan nama pengirim pesan"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        nama penerima
                    </label>
                    <input
                        type="text"
                        required
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="Masukkan nama orang yang menerima pesan"
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        judul lagu
                    </label>
                    <input
                        type="text"
                        required
                        value={songName}
                        onChange={(e) => setSongName(e.target.value)}
                        placeholder="Contoh: Sempurna - Andra and The Backbone"
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        pesan
                    </label>
                    <textarea
                        value={message}
                        required
                        placeholder="Masukkan pesan yang ingin di sampaikan"
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-white shadow-md h-48 p-4 rounded-lg focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                {errorMessage && (
                    <p className="text-red-100 text-sm text-center bg-red-500/35 rounded-md px-3 py-2">
                        {errorMessage}
                    </p>
                )}

                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 1 }}
                    disabled={loading}
                    className="bg-[#942B3A] rounded-lg px-4 py-1 shadow-md text-white w-28 mt-5 shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E]"
                >
                    {loading ? "Mengirim" : "Kirim"}
                </motion.button>
            </form>

            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] p-5 sm:p-6 text-center shadow-[0_22px_50px_rgba(0,0,0,0.38)]">
                        <div className="flex flex-col items-center">
                            <div className="flex justify-center items-center">
                                <img src="/gambar-modal-konfirmasi.png" alt="konfirmasi songfess" className="w-40 sm:w-44 h-auto" />
                            </div>
                            <p className="text-white text-shadow-sm font-bold text-xl sm:text-2xl mt-5">
                                Songfess Kamu Sudah Terkirim 🎵
                            </p>
                            <p className="text-white text-base sm:text-lg text-shadow-sm mt-2 leading-relaxed">
                                Pesan dan lagu pilihanmu sudah kami simpan. Tinggal tunggu momen yang pas buat dibagikan.
                            </p>

                            <button
                                onClick={() => setShowSuccess(false)}
                                className="bg-[#942B3A] p-4 w-full sm:w-52 rounded-lg text-center text-white shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] mt-5 transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1]"
                            >
                                kembali
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}