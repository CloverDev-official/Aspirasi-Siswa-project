import { Outlet } from 'react-router-dom'
const BlankLayout = () => {
    return (
        <div className='bg-linear-to-b from-[#7A1E2D] via-[#B23A48] to-[#FBE49D] overflow-hidden min-h-[100dvh] flex items-center justify-center' >
            <Outlet />
        </div>
    )

}

export default BlankLayout