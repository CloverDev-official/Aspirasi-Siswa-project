import { motion } from "framer-motion"
import { Link } from "react-router-dom"

export default function BerandaAdmin() {
  const MotionLink = motion(Link)

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

  return (
    
    <motion.div initial="hidden" animate="show" variants={container}>
      <main className="flex items-center justify-center min-h-[87vh]">
        <motion.div
          className="mt-20"
          variants={container}
        >
          {/* TEKS */}
          <motion.div
            className="relative text-white font-bold figma-hand text-5xl md:text-7xl text-center space-y-2 text-shadow-md"
            variants={container}
          >
            <motion.h1 variants={item} className="text-shadow-lg" >Tell</motion.h1>
            <motion.h1 variants={item} className="text-shadow-lg" >us your</motion.h1>
            <motion.h1 variants={item} className="text-shadow-lg" >voice</motion.h1>

            {/* gambar like */}
            <motion.div
              variants={item}
              className="absolute -top-30 -right-10"
            >
              <img src="/like.png" alt="like" />
            </motion.div>

            {/* gambar kursor */}
            <motion.div
              variants={item}
              className="absolute -bottom-10 -left-10"
            >
              <img src="/kursor.png" alt="cursor" />
            </motion.div>
          </motion.div>

          {/* BUTTON */}
          <motion.div
            className="flex flex-col space-y-4 justify-center items-center mt-10"
            variants={container}
          >
            <MotionLink to="/admin/list-menfess" variants={item}>
              <motion.button whileHover={{scale: 1.05}} whileTap={{scale: 1}} className="w-60 px-4 py-2 rounded-xl bg-white shadow">
                <p className="text-[#BE5656] text-2xl font-bold capitalize">
                  list menfess
                </p>
              </motion.button>
            </MotionLink>

            <MotionLink to="/admin/list-songfess" variants={item}>
              <motion.button whileHover={{scale: 1.05}} whileTap={{scale: 1}} className="w-60 px-4 py-2 rounded-xl bg-white shadow">
                <p className="text-[#BE5656] text-2xl font-bold capitalize">
                  list songfess
                </p>
              </motion.button>
            </MotionLink>

            <MotionLink to="/admin/list-aspirasi" variants={item}>
              <motion.button whileHover={{scale: 1.05}} whileTap={{scale: 1}} className="w-60 px-4 py-2 rounded-xl bg-white shadow">
                <p className="text-[#BE5656] text-2xl font-bold capitalize">
                  list aspirasi
                </p>
              </motion.button>
            </MotionLink>

            <MotionLink to="/admin/jadwal" variants={item}>
              <motion.button whileHover={{scale: 1.05}} whileTap={{scale: 1}} className="w-60 px-4 py-2 rounded-xl bg-white shadow">
                <p className="text-[#BE5656] text-2xl font-bold capitalize">
                  jadwal
                </p>
              </motion.button>
            </MotionLink>
          </motion.div>
        </motion.div>

      </main>
    </motion.div>
  )
}

