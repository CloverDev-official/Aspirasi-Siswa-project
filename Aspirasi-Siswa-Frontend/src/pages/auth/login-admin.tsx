import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { storeAuthTokens, validateAdminSession } from "../../lib/auth"

type LoginApiPayload = {
    code?: string
    message?: string
    data?: {
        access_token?: string
        refresh_token?: string
    } | null
}

function extractToken(payload: LoginApiPayload | null): string | null {
    if (!payload) {
        return null
    }

    return payload.data?.access_token ?? null
}

function extractRefreshToken(payload: LoginApiPayload | null): string | null {
    if (!payload) {
        return null
    }

    return payload.data?.refresh_token ?? null
}

export default function LoginAdmin() {
    const location = useLocation()
    const navigate = useNavigate()
    const redirectTarget = typeof location.state === "object" && location.state && "from" in location.state && typeof location.state.from === "string"
        ? location.state.from
        : "/admin/beranda"

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    }

    const item = {
        hidden: { opacity: 0, y: 60 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                ease: "easeOut" as const,
            },
        },
    }

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        const controller = new AbortController()

        ;(async () => {
            try {
                const status = await validateAdminSession(controller.signal)

                if (controller.signal.aborted) {
                    return
                }

                if (status === "authorized") {
                    navigate(redirectTarget, { replace: true })
                    return
                }
            } catch (error) {
                if (controller.signal.aborted) {
                    return
                }

                if (error instanceof DOMException && error.name === "AbortError") {
                    return
                }
            }

            setIsCheckingSession(false)
        })()

        return () => {
            controller.abort()
        }
    }, [navigate, redirectTarget])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        await sendToApi()
    }

    const sendToApi = async () => {
        const cleanUsername = username.trim()
        const cleanPassword = password.trim()

        if (!cleanUsername || !cleanPassword) {
            setErrorMessage("Username dan password wajib diisi")
            return
        }

        setIsLoading(true)
        setErrorMessage("")

        try {
            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
            })

            const payload: LoginApiPayload | null = await res.json().catch(() => null)

            if (!res.ok) {
                const message = payload?.message ?? "Login gagal, periksa kembali username/password"
                throw new Error(message)
            }

            const token = extractToken(payload)

            if (!token) {
                throw new Error("Token tidak ditemukan pada response")
            }

            const refreshToken = extractRefreshToken(payload)

            storeAuthTokens(token, refreshToken ?? undefined)
            console.log("Login berhasil:", payload)
            navigate(redirectTarget, { replace: true })
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
                console.error("Error:", err.message)
                return
            }

            setErrorMessage("Terjadi kesalahan yang tidak diketahui")
            console.error("Error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    if (isCheckingSession) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] px-5">
                <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-white/15 px-6 py-8 text-white backdrop-blur-md shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E]">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/35 border-t-white" />
                    <p className="text-base font-semibold">Memeriksa sesi admin...</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div initial="hidden" animate="show" variants={container}>
            <main className="mt-10">
                <form onSubmit={handleSubmit}>
                    <motion.div variants={container}>
                        {/* judul */}
                        <motion.div variants={container} className="text-white font-bold figma-hand text-5xl md:text-7xl text-center space-y-2 text-shadow-md">
                            <motion.h1 variants={item}>Welcome</motion.h1>
                            <motion.h1 variants={item}>to</motion.h1>
                            <motion.h1 variants={item}>CloverFess</motion.h1>
                        </motion.div>

                        {/* form login */}
                        <motion.div variants={container} className="mt-14 flex flex-col gap-4">
                            {/* nama */}
                            <motion.div variants={item} className="flex flex-col gap-1">
                                <label className="text-white font-medium text-lg capitalize">
                                    username
                                </label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Masukkan Username" autoComplete="username" />
                            </motion.div>

                            {/* password */}
                            <motion.div variants={item} className="flex flex-col gap-1">
                                <label className="text-white font-medium text-lg capitalize">
                                    password
                                </label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Masukkan Password" autoComplete="current-password" />
                            </motion.div>

                            {errorMessage && (
                                <motion.p variants={item} className="text-red-100 text-sm text-center bg-red-500/35 rounded-md px-3 py-2">
                                    {errorMessage}
                                </motion.p>
                            )}

                            {/* tombol */}
                            <motion.div variants={item} className="flex justify-center items-center">
                                <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#942B3A] rounded-lg py-2 px-4 shadow-md text-white capitalize w-52 mt-5 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isLoading ? "loading..." : "masuk"}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </form>
            </main>
        </motion.div>
    )
}