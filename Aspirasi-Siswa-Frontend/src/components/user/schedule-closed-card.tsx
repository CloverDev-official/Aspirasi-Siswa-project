type Props = {
    title: string
    scheduleText: string
    nextOpenAt?: string
}

function formatJakartaDate(value?: string): string {
    if (!value) {
        return "-"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "-"
    }

    return date.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function ScheduleClosedCard({ title, scheduleText, nextOpenAt }: Props) {
    return (
        <div className="w-full rounded-2xl border border-[#E8BB86]/60 bg-black/20 p-6 shadow-[inset_2px_2px_4px_#B23A48,inset_-2px_-2px_4px_#C99A5E] backdrop-blur-md">
            <p className="text-[#FBE49D] font-black tracking-[0.25em] text-xs uppercase">Status layanan</p>
            <h2 className="text-white text-3xl md:text-4xl font-black mt-2 uppercase">TUTUP</h2>
            <p className="text-white/95 text-base md:text-lg mt-3">
                Pengiriman {title} sementara ditutup. Layanan ini hanya dibuka pada {scheduleText}.
            </p>
            <div className="mt-5 rounded-xl bg-[#942B3A]/70 px-4 py-3 text-[#FBE49D] shadow-[inset_2px_2px_4px_#E8BB86,inset_-2px_-2px_4px_#7A1E2D]">
                <p className="text-sm uppercase tracking-wide">Perkiraan buka berikutnya</p>
                <p className="text-base font-semibold mt-1">{formatJakartaDate(nextOpenAt)} WIB</p>
            </div>
        </div>
    )
}
