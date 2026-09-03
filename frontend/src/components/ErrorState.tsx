interface ErrorStateProps {
    message?: string
}

export default function ErrorState({
    message = 'Something went wrong.',
}: ErrorStateProps) {
    return (
        <div
            role="alert"
            className="flex items-center justify-center py-8 text-sm text-red-400"
        >
            {message}
        </div>
    )
}