import bcrypt 



def hash_senha(senha: str) -> str:
    # Transforma texto puro da senha em um hash para proteção
    hash_bytes = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt())
    return hash_bytes.decode("utf-8")
