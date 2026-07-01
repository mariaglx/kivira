function Button({ children}) {
    return (
        <button
            className={`bg-coral text-white rounded-xl p-3 font-semibold hover:opacity-90`}
        >
            {children}
        </button>
    )
}
export default Button