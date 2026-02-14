import React, { useState } from "react"
import { motion } from "framer-motion"

export default function Template() {
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [gambar, setGambar] = useState<File | null>(null)
    const [preview, setPreview] = useState<String | null>(null)
    const [text1, setText1] = useState("")
    const [text2, setText2] = useState("")
    const [text3, setText3] = useState("")
    const [text4, setText4] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendToApi()
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setGambar(file)
            setPreview(URL.createObjectURL(file))
        }
        }

    const sendToApi = async () => {
        try {
            setLoading(true)

            const formData = new FormData()
            if (gambar) formData.append("gambar", gambar)
            formData.append("text1", text1)
            formData.append("text2", text2)
            formData.append("text3", text3)
            formData.append("text4", text4)

            const res = await fetch("http://localhost:3000/api/menfess", {
            method: "POST",
            body: formData,
            })

            if (res.ok) {
            setShowSuccess(true)
            }
        } finally {
            setLoading(false)
        }
    }
    

    return (
        <div className="mt-10 w-full md:w-3xl">
            {/* preview */}
            <div className="flex items-center-justify-center w-full">
                <img src={preview ?? "https://placehold.co/600x400?text=image"} alt="" className="md:w-full min-h-[70dvh] bg-gray-200 rounded-lg" />
            </div>

            {/* form template */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
                {/* gambar */}
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        masukkan gambar
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                {/* teks 1 */}
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        teks 1
                    </label>
                    <input
                        type="text"
                        value={text1}
                        onChange={(e) => setText1(e.target.value)}
                        placeholder="Masukkan Teks"
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                {/* teks 2 */}
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        teks 2
                    </label>
                    <input
                        type="text"
                        value={text2}
                        onChange={(e) => setText2(e.target.value)}
                        placeholder="Masukkan Teks"
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                {/* teks 3 */}
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize">
                        teks 3
                    </label>
                    <input
                        type="text"
                        value={text3}
                        onChange={(e) => setText3(e.target.value)}
                        placeholder="Masukkan Teks"
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
                    />
                </div>

                {/* teks 4 */}
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize ml-5">
                        teks 4
                    </label>
                    <input
                        type="text"
                        value={text4}
                        onChange={(e) => setText4(e.target.value)}
                        placeholder="Masukkan Teks"
                        className="px-4 py-2 rounded-lg bg-white shadow-md focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"
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
                    {loading ? "Menyimpan" : "Simpan"}
                    </motion.button>
            </form>

            {/* MODAL KONFIRMASI */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden">
                    <div className="h-[60dvh] bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] rounded-xl p-6 w-80 text-center flex  items-center">
                        <div>
                            <div className="flex justify-center items-center">
                                <img src="/gambar-modal-konfirmasi.png" alt="" />
                            </div>
                            <p className="text-white text-shadow-sm font-bold text-xl mt-5">
                                Template Kamu Sudah Tersimpan
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