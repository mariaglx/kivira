function Input({ type = "text", placeholder }) {
    return (
        <input 
        placeholder={placeholder} 
        type={type} 
        className="border border-cinza-claro rounded-xl p-3 outline-none focus:border-azul" 
        />
    )
}

export default Input