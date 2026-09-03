interface LoadingStateProps {
    message?: string
}

export default function LoadingState({
    message = 'Loading...',
}: LoadingStateProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center py-8 text-sm text-slate-400"
        >
            {message}
        </div>
    )
}