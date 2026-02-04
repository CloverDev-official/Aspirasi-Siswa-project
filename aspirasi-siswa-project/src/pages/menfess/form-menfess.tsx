import { ArrowFromBottom } from "@boxicons/react"
import { motion } from "framer-motion"
const Menfess = () => {
    return (
        <div className="mt-14 w-full md:w-3xl" >
            <form action="" className="flex flex-col gap-4" >
                {/* nanma pengirim */}
                <div className="flex flex-col gap-1" >
                    <label className="text-white font-medium text-lg capitalize ml-5" >nama pengirim</label>
                    <input type="text" className="px-4 py-2 rounded-lg bg-white shadow-md transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400" placeholder="Jawaban singkat" />
                </div>
                {/* nama penerima */}
                <div className="flex flex-col gap-1" >
                    <label className="text-white font-medium text-lg capitalize ml-5" >nama penerima</label>
                    <input type="text" className="px-4 py-2 rounded-lg bg-white shadow-md transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400" placeholder="Jawaban singkat" />
                </div>
                {/* pesan */}
                <div className="flex flex-col gap-1">
                    <label className="text-white font-medium text-lg capitalize ml-5" >pesan</label>
                    <textarea className="bg-white shadow-md h-48 p-4 rounded-lg transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400"></textarea>
                </div>
                {/* lagu */}
                <div className="flex flex-col gap-1 relative" >
                    <label className="text-white font-medium text-lg capitalize ml-5" >lagu</label>
                    <input type="text" className="px-4 pl-12 py-2 rounded-lg bg-white shadow-md transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400" 
                    placeholder="tambahkan link spotify" />
                    <div className="absolute left-5 top-10">
                        <ArrowFromBottom className="text-gray-400" />
                    </div>
                </div>
                {/* btn  kirim */}
                <motion.button whileHover={{scale: 1.05}} whileTap={{scale:1}} className="bg-[#942B3A] rounded-lg px-4 py-1 shadow-md text-white capitalize w-24 mt-5">
                    kirim
                </motion.button>
            </form>
        </div>
    )
}

export default Menfess