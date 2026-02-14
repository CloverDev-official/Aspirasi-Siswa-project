import { Trash, Filter, Plus } from "@boxicons/react"
import { Navigate, useNavigate } from "react-router-dom"

export default function ListMenfess() {
    const navigate = useNavigate()
    return (
        <div className="mt-10 w-full md:w-3xl">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/admin/template')} className="flex gap-1 items-center justify-center bg-transparent bg-opacity-30 backdrop-blur-lg py-2 px-4 rounded-xl shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1] " >
                        <Plus className="w-6 h-6" ></Plus>
                        <p>tambah template</p>
                </button>
                <div className="flex items-center gap-2">
                    {/* delete */}
                    <button className="flex items-center justify-center bg-transparent bg-opacity-30 backdrop-blur-lg py-2 px-4 rounded-xl shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1] " >
                        <Trash className="w-6 h-6" ></Trash>
                    </button>
                    {/* filter */}
                    <button className="flex items-center justify-center bg-transparent bg-opacity-30 backdrop-blur-lg py-2 px-4 rounded-xl shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.05] active:scale-[1] " >
                        <Filter className="w-6 h-6" ></Filter>
                    </button>
                </div>
            </div>
            {/* container card */}
            <div className="flex flex-col gap-4 mt-10">
                {/* card */}
                <div className="bg-[#FBE49D] border-2 border-[#8C1007] rounded-2xl p-4 shadow-md">
                    {/* isi menfess */}
                    <table className="table-auto border-collapse">
                        <tbody>
                            <tr>
                                <th className="text-left pr-4 align-top">From:</th>
                                {/* nama pengirim */}
                                <td className="text-left">Muhammad Ghaizan Pratama Maulana</td>
                            </tr>
                            <tr>
                                <th className="text-left pr-4 align-top">To:</th>
                                {/* nama penerima */}
                                <td className="text-left">Muhammad Ridho Hersa</td>
                            </tr>
                            <tr>
                                <th className="text-left pr-4 align-top">Message:</th>
                                {/* isi pesan */}
                                <td className="text-left">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Porro, sapiente!</td>
                            </tr>
                            <tr>
                                <th className="text-left pr-4 align-top">Song:</th>
                                {/* isi pesan */}
                                <td className="text-left">Lorem ipsum dolor sit amet consectetur</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="flex flex-wrap gap-1 mt-5">
                        {/* pilih template */}
                        <button className="basis-full bg-[#942B3A] rounded-full py-2 px-4 shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.01] active:scale-95 ">
                            pilih template
                        </button>
                        <div className="flex flex-row w-full gap-3 mt-2">
                            {/* btn download */}
                            <button className="basis-full bg-[#942B3A] rounded-full py-2 px-4 shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.01] active:scale-95 " >
                                download
                            </button>
                            {/* btn posting */}
                            <button className="basis-full bg-[#942B3A] rounded-full py-2 px-4 shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#C99A5E] text-white capitalize transition-transform ease-in-out duration-200 hover:scale-[1.01] active:scale-95 " >
                                posting
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
