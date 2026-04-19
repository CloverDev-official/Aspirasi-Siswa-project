import { motion } from "framer-motion"
import { ArrowFromBottom } from "@boxicons/react"
import React, { useEffect, useState } from "react"
import ScheduleClosedCard from "../../components/user/schedule-closed-card"
import { fetchScheduleStatus, type ScheduleStatus } from "../../lib/schedule"

type AspirasiApiPayload = {
    message?: string
    code?: string
    data?: {
        status?: ScheduleStatus
    }
}

export default function Aspirasi() {
    const [showSuccess, setShowSuccess] = useState(false)
    const [loading, setLoading] = useState(false) 
    const [loadingSchedule, setLoadingSchedule] = useState(true)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [nama, setNama ] = useState("")
    const [harapan, setHarapan] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const [schedule, setSchedule] = useState<ScheduleStatus | null>(null)
    const maxFileSize = 15 * 1024 * 1024
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".mp4", ".mov", ".avi", ".mkv", ".webm", ".3gp"]

    useEffect(() => {
        let active = true

        const loadSchedule = async () => {
            try {
                const data = await fetchScheduleStatus("aspiration")
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
            setUploadProgress(0)
            setErrorMessage("")

            const filename = file?.name.toLowerCase() ?? ""
            const hasAllowedExtension = allowedExtensions.some((ext) => filename.endsWith(ext))

            if (file && !hasAllowedExtension) {
                setErrorMessage("Format file belum didukung. Gunakan JPG, PNG, GIF, WEBP, HEIC, HEIF, MP4, MOV, AVI, MKV, WEBM, atau 3GP")
                return
            }

            if (file && file.size > maxFileSize) {
                setErrorMessage("Ukuran file maksimal 15 MB")
                return
            }

            const formData = new FormData()
            formData.append("name", nama.trim())
            formData.append("message", harapan.trim())
            if (file) {
                formData.append("file", file)
            }

            const payload = await new Promise<Record<string, unknown> | null>((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                xhr.open("POST", "/api/v1/aspiration")
                xhr.responseType = "json"

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100)
                        setUploadProgress(percent)
                    }
                }

                xhr.onerror = () => {
                    reject(new Error("Gagal mengirim aspirasi"))
                }

                xhr.onload = () => {
                    const response = xhr.response
                    const data = response && typeof response === "object" ? (response as AspirasiApiPayload) : null

                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadProgress(100)
                        resolve(data as unknown as Record<string, unknown>)
                        return
                    }

                    if (data?.data?.status) {
                        setSchedule(data.data.status)
                    }

                    const message = typeof data?.message === "string" ? data.message : "Gagal mengirim aspirasi"
                    reject(new Error(message))
                }

                xhr.send(formData)
            })

            setShowSuccess(true)
            setNama("")
            setHarapan("")
            setFile(null)
            setErrorMessage("")
            if (payload) {
                void payload
            }
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message)
                return
            }

            setErrorMessage("Terjadi kesalahan yang tidak diketahui")
        } finally {
            setLoading(false)
            setTimeout(() => setUploadProgress(0), 700)
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
                <ScheduleClosedCard title="Aspirasi" scheduleText={schedule.schedule_text} nextOpenAt={schedule.next_open_at} />
            </div>
        )
    }

    return (
        <div className="mt-14 w-full md:w-3xl" >
            <form onSubmit={handleSubmit}  className="flex flex-col gap-4" >
                {/* nanma pengirim */}
                <div className="flex flex-col gap-1" >
                    <label className="text-white font-medium text-lg capitalize" >nama ( Opsional )</label>
                    <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="px-4 py-2 rounded-lg bg-white shadow-md transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400" placeholder="nama Anda" />
                </div>
                {/* pesan */}
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize" >harapan</label>
                    <textarea required value={harapan} onChange={(e) => setHarapan(e.target.value)} className="bg-white shadow-md h-48 p-4 rounded-lg transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"></textarea>
                </div>
                {/* gambar atau video */}
                <div className="flex flex-col gap-1 relative" >
                    <label className="text-white font-medium text-lg capitalize" >foto atau video (opsional, max 15 MB)</label>
                    <input 
                        accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.mp4,.mov,.avi,.mkv,.webm,.3gp"
                        onChange={(e) => {
                            if (e.target.files) {
                                setFile(e.target.files[0])
                            }
                        }}
                        type="file"
                        className="px-4 pl-12 py-2 rounded-lg bg-white shadow-md transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400 text-gray-400" />
                    <div className="absolute left-5 top-10">
                        <ArrowFromBottom className="text-gray-400" />
                    </div>
                </div>

                {loading && file && (
                    <div className="flex flex-col gap-2 rounded-lg bg-black/20 p-3">
                        <div className="flex items-center justify-between text-sm text-white">
                            <span>Progress upload</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
                            <div
                                className="h-full rounded-full bg-[#FBE49D] transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <p className="text-red-100 text-sm text-center bg-red-500/35 rounded-md px-3 py-2">
                        {errorMessage}
                    </p>
                )}
                {/* btn  kirim */}
                <motion.button type="submit" disabled={loading} whileHover={{scale: 1.05}} whileTap={{scale:1}} className="bg-[#942B3A] rounded-lg px-4 py-1 shadow-md text-white capitalize w-28 mt-5 shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E]">
                    {loading ? "Mengirim" : "kirim"}
                </motion.button>
            </form>
            {/* MODAL KONFIRMASI */}
            {showSuccess&& (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] p-5 sm:p-6 text-center shadow-[0_22px_50px_rgba(0,0,0,0.38)]">
                        <div className="flex flex-col items-center">
                            <div className="flex justify-center items-center">
                                <img src="/gambar-modal-konfirmasi.png" alt="konfirmasi aspirasi" className="w-40 sm:w-44 h-auto" />
                            </div>
                            <p className="text-white text-shadow-sm font-bold text-xl sm:text-2xl mt-5">
                                Aspirasi Kamu Sudah Terkirim ✨
                            </p>
                            <p className="text-white text-base sm:text-lg text-shadow-sm mt-2 leading-relaxed" >
                                Terima kasih sudah menyampaikan aspirasimu. Pesanmu sudah kami terima dan akan diteruskan ke pihak terkait.
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