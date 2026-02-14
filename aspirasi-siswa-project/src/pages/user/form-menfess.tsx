import { ArrowFromBottom } from "@boxicons/react"
import { motion } from "framer-motion"
import React, { useState } from "react"

export default function Menfess() {
    const [showSuccess, setShowSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")
    const [message, setMessage] = useState("")
    const [song, setSong] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendToApi()
  }

  const sendToApi = async () => {
    try {
        setLoading(true)
        const res = await fetch("http://localhost:3000/api/menfess", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to,
                message,
                song,
            }),
        })

        if (res.ok) {
            setShowSuccess(true)
        }
    }
    finally {
        setLoading(false)
    }
  }

  return (
    <div className="mt-14 w-full md:w-3xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* nama pengirim */}
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

        {/* nama penerima */}
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

        {/* pesan */}
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

        {/* lagu */}
        <div className="flex flex-col gap-1">
          <label className="text-white font-medium text-lg capitalize">
            lagu
          </label>
          <input
            type="text"
            required
            value={song}
            onChange={(e) => setSong(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
            placeholder="tambahkan nama lagu anda"
          />
        </div>

        {/* tombol submit */}
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

      {/* MODAL KONFIRMASI */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
            <div className="h-[85dvh] bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] rounded-xl p-6 w-80 text-center flex  items-center">
                <div>
                    <div className="flex justify-center items-center">
                        <img src="/gambar-modal-konfirmasi.png" alt="" />
                    </div>
                    <p className="text-white text-shadow-sm font-bold text-xl mt-5">
                        Menfess Kamu Sudah Terkirim 💌
                    </p>
                    <p className="text-white text-lg text-shadow-sm mt-2" >
                        Tenang, identitas kamu aman. Sekarang tinggal tunggu dan biarkan ceritamu sampai ke tujuannya.
                    </p>

                    <button
                        onClick={() => setShowSuccess(false)}
                        className="bg-[#942B3A] p-4 w-52 rounded-lg text-center text-white shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] mt-5 transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1]"
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