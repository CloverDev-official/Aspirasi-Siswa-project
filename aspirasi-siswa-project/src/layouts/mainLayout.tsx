import { Outlet } from "react-router-dom"
import Navbar from "../components/navbar"

const mainLayout = () => {
    return (
        <div className="min-h-screen bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D]">
            <Navbar/>
            <main className="flex items-center justify-center px-5 pb-5 " >
                <Outlet/>
            </main>
        </div>
    )
}

export default mainLayout 