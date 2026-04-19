import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function NotFoundPage() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full px-5"
        >
            <div className="mx-auto w-full max-w-xl rounded-3xl border border-[#FBE49D]/70 bg-black/20 p-7 md:p-9 backdrop-blur-md shadow-[0_20px_60px_rgba(122,30,45,0.3)]">
                <p className="inline-block rounded-full border border-[#FBE49D]/60 px-3 py-1 text-xs font-bold tracking-wider text-[#FBE49D]">
                    ERROR 404
                </p>

                <h1 className="mt-4 text-3xl font-black uppercase tracking-wide text-[#FBE49D] md:text-4xl">
                    Halaman Tidak Ditemukan
                </h1>

                <p className="mt-3 text-white/95 leading-relaxed">
                    Maaf, halaman yang kamu tuju tidak tersedia atau sudah dipindahkan.
                    Coba kembali ke beranda untuk melanjutkan.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                        to="/"
                        className="rounded-xl bg-[#FBE49D] px-5 py-3 text-center font-bold text-[#7A1E2D] transition hover:brightness-95"
                    >
                        Kembali ke Beranda
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20"
                    >
                        Halaman Sebelumnya
                    </button>
                </div>
            </div>
        </motion.section>
    )
}
