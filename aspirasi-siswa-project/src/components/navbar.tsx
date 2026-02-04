import { useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { ChevronLeft } from "@boxicons/react"
import { Link } from "react-router-dom"

const MotionLink = motion(Link)

const Navbar = () => {
    const location = useLocation()
    const pathName = location.pathname
    const firstRoute = pathName.split('/')[1]
    return (
        <div className="flex justify-center   items-center pt-8">
            <div className="bg-transparent bg-opacity-30 backdrop-blur-lg shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E] rounded-xl py-2 px-2 flex items-center justify-center">
                <div className="flex  justify-between items-center">
                    <MotionLink whileHover={{scale: 1.2}} whileTap={{scale:1}} to="/" >
                        <ChevronLeft className="text-white w-8 h-8" />
                    </MotionLink>
                    <div className="flex justify-center w-44">
                        <h1 className="capitalize font-bold text-xl text-white">
                            {firstRoute}
                        </h1>
                    </div>   
                </div>
            </div>
        </div>
    )
}

export default  Navbar