export default function Brand() {
    return (
        <div className="flex items-center gap-2.5">
            <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-mono text-sm font-bold text-white"
            >
                L
            </span>

            <span className="font-mono text-lg font-semibold tracking-tight text-slate-50">
                LogForge
            </span>
        </div>
    )
}