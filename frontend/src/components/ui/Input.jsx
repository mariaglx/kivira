function Input({ type = "text", placeholder, className = "", ...props }) {
    return (
        <input 
            type={type} 
            placeholder={placeholder} 
            className={`border border-cinza-claro rounded-xl p-3 outline-none focus:border-azul ${className}`} 
            {...props} 
        />
    )
}

export default Input