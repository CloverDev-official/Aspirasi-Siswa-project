import { useEffect, useState, type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { validateAdminSession, type AdminSessionStatus } from "../lib/auth"

type SessionStatus = "loading" | AdminSessionStatus

type AdminMiddlewareProps = {
    children: ReactNode
}

export default function AdminMiddleware({ children }: AdminMiddlewareProps) {
    const location = useLocation()
    const [status, setStatus] = useState<SessionStatus>("loading")
    const [retryCount, setRetryCount] = useState(0)

    useEffect(() => {
        const controller = new AbortController()

        setStatus("loading")

        ;(async () => {
            try {
                const nextStatus = await validateAdminSession(controller.signal)

                if (!controller.signal.aborted) {
                    setStatus(nextStatus)
                }
            } catch (error) {
                if (controller.signal.aborted) {
                    return
                }

                if (error instanceof DOMException && error.name === "AbortError") {
                    return
                }

                setStatus("error")
            }
        })()

        return () => {
            controller.abort()
        }
    }, [location.pathname, retryCount])

    if (status === "loading") {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] px-5">
                <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-white/15 px-6 py-8 text-white backdrop-blur-md shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E]">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/35 border-t-white" />
                    <p className="text-base font-semibold">Memeriksa sesi admin...</p>
                    <p className="text-center text-sm text-white/85">Mohon tunggu sebentar, sistem sedang validasi akses kamu.</p>
                </div>
            </div>
        )
    }

    if (status === "unauthorized") {
        return <Navigate to="/admin" replace state={{ from: location.pathname }} />
    }

    if (status === "error") {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] px-5">
                <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-white/15 px-6 py-8 text-white backdrop-blur-md shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E]">
                    <p className="text-base font-semibold">Validasi sesi gagal</p>
                    <p className="text-center text-sm text-white/85">Koneksi atau server sedang bermasalah. Coba lagi dalam beberapa saat.</p>
                    <button
                        type="button"
                        onClick={() => setRetryCount((prev) => prev + 1)}
                        className="mt-1 rounded-md bg-[#942B3A] px-4 py-2 text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
