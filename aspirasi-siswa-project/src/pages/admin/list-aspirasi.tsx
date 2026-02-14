import { Trash, Filter } from "@boxicons/react"
import { useState } from "react"

export default function ListAspirasi() {
    const [showMore, setShowMore] = useState(false)
    const text: string = "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dolores perferendis veritatis sed debitis libero eum, et itaque blanditiis incidunt voluptate eos molestias cum assumenda doloribus tenetur molestiae quo aut non." 
    const limit = 120
    const long = text.length > 120
    return (
        <div className="mt-10 w-full md:w-3xl">
            <div className="flex items-center justify-end">
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
            <div className="flex flex-col gap-4 mt-10">
                {/* card */}
                <div className="bg-[#FBE49D] border-2 border-[#8C1007] rounded-2xl p-4 shadow-md">
                    <p>
                        {showMore || !long ? text : text.slice(0, limit) + "..."}
                    </p>

                    { long && (
                        <button onClick={() => setShowMore(!showMore)} className="text-blue-500">
                            {showMore ? "hide" : "show more"}
                        </button>
                    )}

                    <div className="mt-5">
                        <p className="text-sm text-gray-700" >{new Date().toDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}