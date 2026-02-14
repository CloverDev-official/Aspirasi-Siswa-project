import { motion } from "framer-motion"

export default function LoginAdmin() {
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
            ease: "easeOut",
            },
        },
    }
    return (
        <motion.div initial="hidden" animate="show" variants={container} >
            <main className="mt-10">
                <div>
                    <motion.div variants={container}>
                        {/* judul */}
                        <motion.div variants={container}  className="text-white font-bold figma-hand text-5xl md:text-7xl text-center space-y-2 text-shadow-md" >
                            <motion.h1 variants={item} className="text-shadow-lg" >Welcome</motion.h1>
                            <motion.h1 variants={item} className="text-shadow-lg" >to</motion.h1>
                            <motion.h1 variants={item} className="text-shadow-lg" >SkendaForm</motion.h1>
                        </motion.div>
                        {/* form login */}
                        <motion.form variants={container} className="mt-14 flex flex-col gap-4" >
                            {/* nama */}
                            <motion.div variants={item} className="flex flex-col gap-1" >
                                <label className="text-white font-medium text-lg capitalize" >nama</label>
                                <input type="text" className="px-4 py-2 rounded-lg bg-white shadow-md transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400" placeholder="Masukkan Nama" />
                            </motion.div>
                            {/* password */}
                            <motion.div variants={item} className="flex flex-col gap-1" >
                                <label className="text-white font-medium text-lg capitalize" >password</label>
                                <input type="password" className="px-4 py-2 rounded-lg bg-white shadow-md transition-colors duration-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 border-yellow-400 " placeholder="Masukkan Password" />
                            </motion.div>
                            {/* btn submit */}
                            <motion.div variants={item} className="flex justify-center items-center" >
                                <motion.button whileHover={{scale: 1.05}} whileTap={{scale:1}} className="bg-[#942B3A] rounded-lg py-2 px-4 shadow-md text-white capitalize w-52 mt-5">
                                    masuk
                                </motion.button>
                            </motion.div>
                        </motion.form>
                    </motion.div>
                </div> 
            </main>
        </motion.div>
    )
}
