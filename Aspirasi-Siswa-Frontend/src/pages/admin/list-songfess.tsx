import { Filter, Trash } from "@boxicons/react"
import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchWithAdminAuth } from "../../lib/auth"
import { ConfirmDeleteModal, ToastStack, type ToastItem, type ToastType } from "../../components/admin/feedback"

type SongfessItem = {
    id: number
    to: string
    from: string
    song_name: string
    message: string
    created_at?: string
}

type PaginationData = {
    page: number
    limit: number
    total: number
    total_pages: number
}

type SongfessListResponse = {
    message?: string
    data?: {
        items?: SongfessItem[]
        pagination?: PaginationData
    }
}

type GenerateImageResponse = {
    message?: string
    data?: {
        path?: string
    }
}

function formatDate(value?: string): string {
    if (!value) {
        return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

function parseMessage(payload: unknown, fallback: string): string {
    if (typeof payload === "object" && payload !== null && "message" in payload) {
        const message = (payload as { message?: unknown }).message
        if (typeof message === "string" && message.trim() !== "") {
            return message
        }
    }

    return fallback
}

function triggerDownload(blob: Blob, filename: string) {
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}

export default function ListSongfess() {
    const navigate = useNavigate()

    const [items, setItems] = useState<SongfessItem[]>([])
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [showFilter, setShowFilter] = useState(false)
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [fromFilter, setFromFilter] = useState("")
    const [toFilter, setToFilter] = useState("")
    const [songFilter, setSongFilter] = useState("")
    const [queryFilter, setQueryFilter] = useState("")
    const [monthPickerFilter, setMonthPickerFilter] = useState("")
    const [appliedFilter, setAppliedFilter] = useState({
        from: "",
        to: "",
        song: "",
        query: "",
        month: "",
        year: "",
    })

    const [page, setPage] = useState(1)
    const [limit] = useState(8)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [reloadKey, setReloadKey] = useState(0)

    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

    const showToast = (type: ToastType, message: string) => {
        const id = Date.now() + Math.floor(Math.random() * 1000)
        setToasts((previous) => [...previous, { id, type, message }])

        window.setTimeout(() => {
            setToasts((previous) => previous.filter((toast) => toast.id !== id))
        }, 3500)
    }

    const currentYear = new Date().getFullYear()
    const yearOptions = useMemo(() => {
        return Array.from({ length: 7 }, (_, index) => String(currentYear - index))
    }, [currentYear])

    useEffect(() => {
        const controller = new AbortController()

        const loadSongfess = async () => {
            try {
                setLoading(true)
                setErrorMessage("")

                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                })

                if (appliedFilter.from.trim()) {
                    params.set("from", appliedFilter.from.trim())
                }

                if (appliedFilter.to.trim()) {
                    params.set("to", appliedFilter.to.trim())
                }

                if (appliedFilter.song.trim()) {
                    params.set("song_name", appliedFilter.song.trim())
                }

                if (appliedFilter.query.trim()) {
                    params.set("q", appliedFilter.query.trim())
                }

                if (appliedFilter.month) {
                    params.set("month", appliedFilter.month)
                }

                if (appliedFilter.year) {
                    params.set("year", appliedFilter.year)
                }

                const response = await fetchWithAdminAuth(`/api/v1/admin/songfess?${params.toString()}`, {
                    method: "GET",
                    signal: controller.signal,
                })

                const payload: SongfessListResponse | null = await response.json().catch(() => null)

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        navigate("/admin", { replace: true })
                        return
                    }

                    throw new Error(payload?.message ?? "Gagal mengambil data songfess")
                }

                const nextItems = Array.isArray(payload?.data?.items) ? payload.data.items : []
                const pagination = payload?.data?.pagination

                setItems(nextItems)
                setSelectedIds([])
                setTotalItems(Number(pagination?.total ?? 0))
                setTotalPages(Math.max(1, Number(pagination?.total_pages ?? 1)))
            } catch (error) {
                if (controller.signal.aborted) {
                    return
                }

                if (error instanceof Error) {
                    setErrorMessage(error.message)
                    return
                }

                setErrorMessage("Terjadi kesalahan yang tidak diketahui")
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        void loadSongfess()

        return () => {
            controller.abort()
        }
    }, [navigate, page, limit, appliedFilter, reloadKey])

    const toggleSelect = (id: number) => {
        setSelectedIds((previous) =>
            previous.includes(id) ? previous.filter((itemId) => itemId !== id) : [...previous, id],
        )
    }

    const toggleSelectAllVisible = () => {
        if (items.length === 0) {
            return
        }

        const visibleIds = items.map((item) => item.id)
        const allSelected = visibleIds.every((id) => selectedIds.includes(id))

        if (allSelected) {
            setSelectedIds((previous) => previous.filter((id) => !visibleIds.includes(id)))
            return
        }

        const next = new Set([...selectedIds, ...visibleIds])
        setSelectedIds(Array.from(next))
    }

    const fetchRenderedBlob = async (id: number): Promise<Blob> => {
        const generateResponse = await fetchWithAdminAuth(`/api/v1/admin/songfess/image/${id}`, {
            method: "GET",
        })

        const generatePayload: GenerateImageResponse | null = await generateResponse.json().catch(() => null)

        if (!generateResponse.ok) {
            throw new Error(generatePayload?.message ?? "Gagal generate gambar songfess")
        }

        const path = generatePayload?.data?.path
        if (!path) {
            throw new Error("Path gambar tidak ditemukan")
        }

        const downloadResponse = await fetchWithAdminAuth(path, { method: "GET" })
        if (!downloadResponse.ok) {
            throw new Error("Gagal mengunduh gambar hasil render")
        }

        return downloadResponse.blob()
    }

    const handleDownload = async (id: number) => {
        try {
            setActionLoadingId(id)

            const blob = await fetchRenderedBlob(id)
            triggerDownload(blob, `songfess-${id}.png`)
            showToast("success", "Gambar songfess berhasil diunduh")
        } catch (error) {
            if (error instanceof Error) {
                showToast("error", error.message)
                return
            }

            showToast("error", "Terjadi kesalahan saat download")
        } finally {
            setActionLoadingId(null)
        }
    }

    const handleShare = async (id: number) => {
        try {
            setActionLoadingId(id)

            const blob = await fetchRenderedBlob(id)
            const file = new File([blob], `songfess-${id}.png`, { type: blob.type || "image/png" })

            if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
                await navigator.share({
                    title: "Songfess",
                    text: "Bagikan hasil render songfess",
                    files: [file],
                })
                showToast("success", "Dialog share berhasil dibuka")
                return
            }

            triggerDownload(blob, `songfess-${id}.png`)
            showToast("success", "Perangkat belum mendukung share file. Gambar diunduh sebagai alternatif.")
        } catch (error) {
            if (error instanceof Error) {
                showToast("error", error.message)
                return
            }

            showToast("error", "Terjadi kesalahan saat posting")
        } finally {
            setActionLoadingId(null)
        }
    }

    const confirmDeleteSelected = async () => {
        if (selectedIds.length === 0) {
            return
        }

        try {
            setDeleting(true)

            const response = await fetchWithAdminAuth(`/api/v1/admin/songfess/bulk-delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: selectedIds }),
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => null)
                throw new Error(parseMessage(payload, "Sebagian data gagal dihapus"))
            }

            setSelectedIds([])
            showToast("success", "Data songfess terpilih berhasil dihapus")
            setShowDeleteModal(false)

            if (items.length === selectedIds.length && page > 1) {
                setPage((previous) => previous - 1)
            } else {
                setReloadKey((previous) => previous + 1)
            }
        } catch (error) {
            if (error instanceof Error) {
                showToast("error", error.message)
                return
            }

            showToast("error", "Terjadi kesalahan saat menghapus data")
        } finally {
            setDeleting(false)
        }
    }

    const applyFilter = () => {
        const [pickedYear, pickedMonth] = monthPickerFilter.split("-")

        setAppliedFilter({
            from: fromFilter,
            to: toFilter,
            song: songFilter,
            query: queryFilter,
            month: pickedMonth ? String(Number(pickedMonth)) : "",
            year: pickedYear ?? "",
        })
        setPage(1)
    }

    const resetFilter = () => {
        setFromFilter("")
        setToFilter("")
        setSongFilter("")
        setQueryFilter("")
        setMonthPickerFilter("")
        setAppliedFilter({
            from: "",
            to: "",
            song: "",
            query: "",
            month: "",
            year: "",
        })
        setPage(1)
    }

    const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

    return (
        <div className="mt-10 w-full md:w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white text-sm bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md">
                    Total data: {totalItems}
                </div>
                <div className="flex items-center gap-2">
                    <ToastStack toasts={toasts} />
                    <button
                        onClick={toggleSelectAllVisible}
                        className="bg-transparent bg-opacity-30 backdrop-blur-lg py-2 px-4 rounded-xl shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1]"
                    >
                        {allVisibleSelected ? "Batal pilih" : "Pilih semua"}
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={selectedIds.length === 0 || loading}
                        className="flex items-center justify-center gap-2 bg-transparent bg-opacity-30 backdrop-blur-lg py-2 px-4 rounded-xl shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Trash className="w-6 h-6" />
                        Hapus ({selectedIds.length})
                    </button>
                    <button
                        onClick={() => setShowFilter((previous) => !previous)}
                        className="flex items-center justify-center bg-transparent bg-opacity-30 backdrop-blur-lg py-2 px-4 rounded-xl shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1]"
                    >
                        <Filter className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {showFilter && (
                <div className="mt-4 rounded-2xl bg-white/15 p-4 backdrop-blur-md shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={fromFilter}
                            onChange={(event) => setFromFilter(event.target.value)}
                            placeholder="Filter dari siapa"
                            className="px-3 py-2 rounded-lg bg-white shadow-md focus:outline-none"
                        />
                        <input
                            type="text"
                            value={toFilter}
                            onChange={(event) => setToFilter(event.target.value)}
                            placeholder="Filter untuk siapa"
                            className="px-3 py-2 rounded-lg bg-white shadow-md focus:outline-none"
                        />
                        <input
                            type="text"
                            value={songFilter}
                            onChange={(event) => setSongFilter(event.target.value)}
                            placeholder="Filter judul lagu"
                            className="px-3 py-2 rounded-lg bg-white shadow-md focus:outline-none"
                        />
                        <input
                            type="text"
                            value={queryFilter}
                            onChange={(event) => setQueryFilter(event.target.value)}
                            placeholder="Cari isi pesan"
                            className="px-3 py-2 rounded-lg bg-white shadow-md focus:outline-none"
                        />
                        <label className="rounded-lg bg-white px-3 py-2 shadow-md focus-within:outline-none">
                            <span className="mb-1 block text-xs text-gray-500">Bulan dan tahun</span>
                            <input
                                type="month"
                                value={monthPickerFilter}
                                onChange={(event) => setMonthPickerFilter(event.target.value)}
                                min={`${yearOptions[yearOptions.length - 1]}-01`}
                                max={`${yearOptions[0]}-12`}
                                className="w-full bg-transparent text-sm text-gray-900 focus:outline-none"
                            />
                        </label>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={applyFilter} className="bg-[#942B3A] text-white rounded-lg px-4 py-2">
                            Terapkan
                        </button>
                        <button onClick={resetFilter} className="bg-white text-[#942B3A] rounded-lg px-4 py-2">
                            Reset
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="mt-10 rounded-2xl bg-white/20 px-6 py-8 text-center text-white backdrop-blur-md">
                    Memuat data songfess...
                </div>
            )}

            {errorMessage && !loading && (
                <div className="mt-6 rounded-2xl bg-red-500/25 px-6 py-4 text-center text-white backdrop-blur-md">
                    {errorMessage}
                </div>
            )}

            {!loading && !errorMessage && items.length === 0 && (
                <div className="mt-10 rounded-2xl bg-white/20 px-6 py-8 text-center text-white backdrop-blur-md">
                    Belum ada songfess yang cocok dengan filter.
                </div>
            )}

            <div className="flex flex-col gap-4 mt-10">
                {!loading && !errorMessage && items.map((item) => (
                    <div key={item.id} className="bg-[#FBE49D] border-2 border-[#8C1007] rounded-2xl p-4 shadow-md">
                        <div className="flex items-start justify-between gap-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => toggleSelect(item.id)}
                                    className="w-4 h-4"
                                />
                                Pilih
                            </label>
                        </div>

                        <table className="table-auto border-collapse w-full mt-3">
                            <tbody>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">From:</th>
                                    <td className="text-left break-words">{item.from}</td>
                                </tr>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">To:</th>
                                    <td className="text-left break-words">{item.to}</td>
                                </tr>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">Song:</th>
                                    <td className="text-left break-words">{item.song_name}</td>
                                </tr>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">Message:</th>
                                    <td className="text-left break-words">{item.message}</td>
                                </tr>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">Created:</th>
                                    <td className="text-left break-words">{formatDate(item.created_at)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="flex flex-row w-full gap-3 mt-4">
                            <button
                                onClick={() => void handleDownload(item.id)}
                                disabled={actionLoadingId === item.id}
                                className="basis-full bg-[#942B3A] rounded-full py-2 px-4 text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                            >
                                {actionLoadingId === item.id ? "Memproses..." : "download"}
                            </button>
                            <button
                                onClick={() => void handleShare(item.id)}
                                disabled={actionLoadingId === item.id}
                                className="basis-full bg-[#942B3A] rounded-full py-2 px-4 text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                            >
                                posting
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-8">
                <button
                    onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                    disabled={page <= 1 || loading}
                    className="bg-[#942B3A] text-white rounded-lg px-4 py-2 disabled:opacity-60"
                >
                    Sebelumnya
                </button>
                <p className="text-white text-sm">
                    Halaman {page} / {totalPages}
                </p>
                <button
                    onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                    disabled={page >= totalPages || loading}
                    className="bg-[#942B3A] text-white rounded-lg px-4 py-2 disabled:opacity-60"
                >
                    Selanjutnya
                </button>
            </div>

            <ConfirmDeleteModal
                open={showDeleteModal}
                title="Konfirmasi Hapus"
                message={`Hapus ${selectedIds.length} data songfess terpilih? Tindakan ini tidak bisa dibatalkan.`}
                loading={deleting}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={() => void confirmDeleteSelected()}
            />
        </div>
    )
}
