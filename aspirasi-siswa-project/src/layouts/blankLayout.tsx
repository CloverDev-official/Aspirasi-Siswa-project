import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
const BlankLayout = () => {
    const location = useLocation()
    const pathName = location.pathname
    const currentLocation = pathName

    if (currentLocation == '/') {
        return (
            <div className='bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] min-h-screen p-5' >
                <Outlet />
            </div>
        )
    }
    else {
        return (
            <div className='bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] min-h-screen p-5' >
                <Outlet />
            </div>
        )
    }
}

export default BlankLayout