import { Filter, Trash } from "@boxicons/react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchWithAdminAuth } from "../../lib/auth"
import { ConfirmDeleteModal, ToastStack, type ToastItem, type ToastType } from "../../components/admin/feedback"

type AspirationItem = {
    id: number
    name: string
    message: string
    file_path?: string
    created_at?: string
}

type PaginationData = {
    page: number
    limit: number
    total: number
    total_pages: number
}

type AspirationListResponse = {
    code?: string
    message?: string
    data?: {
        items?: AspirationItem[]
        pagination?: PaginationData
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

function extractErrorMessage(payload: unknown, fallback: string): string {
    if (typeof payload === "object" && payload !== null && "message" in payload) {
        const message = (payload as { message?: unknown }).message
        if (typeof message === "string" && message.trim() !== "") {
            return message
        }
    }

    return fallback
}

export default function ListAspirasi() {
    const navigate = useNavigate()
    const [items, setItems] = useState<AspirationItem[]>([])
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [showFilter, setShowFilter] = useState(false)
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [nameFilter, setNameFilter] = useState("")
    const [queryFilter, setQueryFilter] = useState("")
    const [monthPickerFilter, setMonthPickerFilter] = useState("")
    const [appliedFilter, setAppliedFilter] = useState({
        name: "",
        query: "",
        month: "",
        year: "",
    })

    const [page, setPage] = useState(1)
    const [limit] = useState(8)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [reloadKey, setReloadKey] = useState(0)

    const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null)
    const [previewMedia, setPreviewMedia] = useState<{
        id: number
        url: string
        type: string
    } | null>(null)

    const showToast = (type: ToastType, message: string) => {
        const id = Date.now() + Math.floor(Math.random() * 1000)
        setToasts((previous) => [...previous, { id, type, message }])

        window.setTimeout(() => {
            setToasts((previous) => previous.filter((toast) => toast.id !== id))
        }, 3500)
    }

    const hasSelection = selectedIds.length > 0
    const currentYear = new Date().getFullYear()
    const yearOptions = useMemo(() => {
        return Array.from({ length: 7 }, (_, index) => String(currentYear - index))
    }, [currentYear])

    useEffect(() => {
        return () => {
            if (previewMedia) {
                URL.revokeObjectURL(previewMedia.url)
            }
        }
    }, [previewMedia])

    useEffect(() => {
        const controller = new AbortController()

        const loadAspirasi = async () => {
            try {
                setLoading(true)
                setErrorMessage("")

                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                })

                if (appliedFilter.name.trim()) {
                    params.set("name", appliedFilter.name.trim())
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

                const response = await fetchWithAdminAuth(`/api/v1/admin/aspiration?${params.toString()}`, {
                    method: "GET",
                    signal: controller.signal,
                })

                const payload: AspirationListResponse | null = await response.json().catch(() => null)

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        navigate("/admin", { replace: true })
                        return
                    }

                    throw new Error(payload?.message ?? "Gagal mengambil data aspirasi")
                }

                const nextItems = Array.isArray(payload?.data?.items) ? payload.data.items : []
                const pagination = payload?.data?.pagination

                setItems(nextItems)
                setTotalItems(Number(pagination?.total ?? 0))
                setTotalPages(Math.max(1, Number(pagination?.total_pages ?? 1)))
                setSelectedIds([])
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

        void loadAspirasi()

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

    const confirmDeleteSelected = async () => {
        if (!hasSelection) {
            return
        }

        try {
            setDeleting(true)

            const response = await fetchWithAdminAuth(`/api/v1/admin/aspiration/bulk-delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: selectedIds }),
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => null)
                throw new Error(extractErrorMessage(payload, "Sebagian data gagal dihapus"))
            }

            showToast("success", "Data terpilih berhasil dihapus")
            setSelectedIds([])
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

    const handlePreview = async (id: number) => {
        try {
            setPreviewLoadingId(id)

            const response = await fetchWithAdminAuth(`/api/v1/admin/aspiration/media/${id}`, {
                method: "GET",
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => null)
                throw new Error(extractErrorMessage(payload, "Gagal memuat preview media"))
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            setPreviewMedia((previous) => {
                if (previous) {
                    URL.revokeObjectURL(previous.url)
                }

                return {
                    id,
                    url,
                    type: blob.type,
                }
            })
        } catch (error) {
            if (error instanceof Error) {
                showToast("error", error.message)
                return
            }

            showToast("error", "Terjadi kesalahan saat memuat preview")
        } finally {
            setPreviewLoadingId(null)
        }
    }

    const closePreview = () => {
        setPreviewMedia((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous.url)
            }
            return null
        })
    }

    const submitFilter = () => {
        const [pickedYear, pickedMonth] = monthPickerFilter.split("-")

        setAppliedFilter({
            name: nameFilter,
            query: queryFilter,
            month: pickedMonth ? String(Number(pickedMonth)) : "",
            year: pickedYear ?? "",
        })
        setPage(1)
    }

    const resetFilter = () => {
        setNameFilter("")
        setQueryFilter("")
        setMonthPickerFilter("")
        setAppliedFilter({
            name: "",
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
                        disabled={!hasSelection || loading}
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
                            value={nameFilter}
                            onChange={(event) => setNameFilter(event.target.value)}
                            placeholder="Filter nama"
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
                        <button
                            onClick={submitFilter}
                            className="bg-[#942B3A] text-white rounded-lg px-4 py-2 shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E]"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={resetFilter}
                            className="bg-white text-[#942B3A] rounded-lg px-4 py-2"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="mt-10 rounded-2xl bg-white/20 px-6 py-8 text-center text-white backdrop-blur-md shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E]">
                    Memuat data aspirasi...
                </div>
            )}

            {errorMessage && !loading && (
                <div className="mt-6 rounded-2xl bg-red-500/25 px-6 py-4 text-center text-white backdrop-blur-md">
                    {errorMessage}
                </div>
            )}

            {!loading && !errorMessage && items.length === 0 && (
                <div className="mt-10 rounded-2xl bg-white/20 px-6 py-8 text-center text-white backdrop-blur-md">
                    Belum ada aspirasi yang cocok dengan filter.
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
                            <button
                                onClick={() => void handlePreview(item.id)}
                                disabled={!item.file_path || previewLoadingId === item.id}
                                className="bg-[#942B3A] text-white rounded-full px-4 py-1 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {previewLoadingId === item.id ? "Memuat..." : "Preview"}
                            </button>
                        </div>
                        <table className="table-auto border-collapse w-full mt-3">
                            <tbody>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">Nama:</th>
                                    <td className="text-left break-words">{item.name || "Anonim"}</td>
                                </tr>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">Aspirasi:</th>
                                    <td className="text-left break-words">{item.message}</td>
                                </tr>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">Lampiran:</th>
                                    <td className="text-left break-words">{item.file_path ? "Ada media" : "-"}</td>
                                </tr>
                                <tr>
                                    <th className="text-left pr-4 align-top whitespace-nowrap">Created:</th>
                                    <td className="text-left break-words">{formatDate(item.created_at)}</td>
                                </tr>
                            </tbody>
                        </table>
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
                message={`Hapus ${selectedIds.length} data aspirasi terpilih? Tindakan ini tidak bisa dibatalkan.`}
                loading={deleting}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={() => void confirmDeleteSelected()}
            />

            {previewMedia && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-[#FBE49D] border-2 border-[#8C1007] rounded-2xl p-4 max-w-3xl w-full">
                        <div className="flex justify-between items-center mb-3">
                            <p className="font-semibold text-[#8C1007]">Preview Lampiran Aspirasi #{previewMedia.id}</p>
                            <button onClick={closePreview} className="bg-[#942B3A] text-white rounded-lg px-3 py-1">
                                Tutup
                            </button>
                        </div>

                        {previewMedia.type.startsWith("video/") ? (
                            <video src={previewMedia.url} controls className="w-full max-h-[70dvh] rounded-lg bg-black" />
                        ) : (
                            <img src={previewMedia.url} alt="Preview aspirasi" className="w-full max-h-[70dvh] object-contain rounded-lg bg-black/10" />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
