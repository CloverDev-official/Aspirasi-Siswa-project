export type ToastType = "success" | "error"

export type ToastItem = {
    id: number
    type: ToastType
    message: string
}

type ToastStackProps = {
    toasts: ToastItem[]
}

export function ToastStack({ toasts }: ToastStackProps) {
    if (toasts.length === 0) {
        return null
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex max-w-sm flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`rounded-xl px-4 py-3 text-sm text-white shadow-lg backdrop-blur-md ${toast.type === "success" ? "bg-emerald-600/85" : "bg-red-600/85"}`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    )
}

type ConfirmDeleteModalProps = {
    open: boolean
    title: string
    message: string
    loading: boolean
    confirmLabel?: string
    onCancel: () => void
    onConfirm: () => void
}

export function ConfirmDeleteModal({
    open,
    title,
    message,
    loading,
    confirmLabel = "Ya, Hapus",
    onCancel,
    onConfirm,
}: ConfirmDeleteModalProps) {
    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-md rounded-2xl border-2 border-[#8C1007] bg-[#FBE49D] p-5 shadow-2xl">
                <h3 className="text-xl font-bold text-[#8C1007]">{title}</h3>
                <p className="mt-2 text-[#5A1A22]">{message}</p>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-[#8C1007] bg-white px-4 py-2 text-[#8C1007] disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-lg bg-[#8C1007] px-4 py-2 text-white disabled:opacity-60"
                    >
                        {loading ? "Menghapus..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
