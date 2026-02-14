import { Outlet, useLocation } from "react-router-dom"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ChevronLeft } from "@boxicons/react"

function Navbar() {
    const MotionLink = motion(Link)
    const location = useLocation()
    const pathName: string = location.pathname
    const firstRoute: string = pathName.split('/')[1]
    const lastRoute = pathName.split('/').filter(Boolean).pop() ?? ""

    const titleMap: Record<string, string> = {
        "list-menfess" : "List Menfess",
        "list-aspirasi" : "List Aspirasi",
        "template" : "Template",
    }

    const title: string = titleMap[lastRoute] ?? firstRoute

    return (
        <div className="flex justify-center   items-center pt-8">
            <div className="bg-transparent bg-opacity-30 backdrop-blur-lg shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E] rounded-xl py-2 px-2 flex items-center justify-center">
                <div className="flex  justify-between items-center">
                    <MotionLink whileHover={{scale: 1.2}} whileTap={{scale:1}} to={-1} >
                        <ChevronLeft className="text-white w-8 h-8" />
                    </MotionLink>
                    <div className="flex justify-center w-44">
                        <h1 className="capitalize font-bold text-xl text-white">
                            {title}
                        </h1>
                    </div>   
                </div>
            </div>
        </div>
    );
}

export default function mainLayout() {
    return (
        <div className="min-h-[100dvh] bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D]">
            <Navbar/>
            <main className="flex items-center justify-center px-5 pb-5 " >
                <Outlet/>
            </main>
        </div>
    )
}
