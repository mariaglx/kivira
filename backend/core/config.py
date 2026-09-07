import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_chave_segura_desenvolvimento")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Servidor Ollama local usado para gerar questões via LLM (llama3)
OLLAMA_URL = os.getenv("OLLAMA_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
OLLAMA_TIMEOUT_SEG = int(os.getenv("OLLAMA_TIMEOUT_SEG", 60))

# API do Pixabay, usada para buscar imagens na criação de atividade
API_PIXABAY_URL = os.getenv("API_PIXABAY_URL", "https://pixabay.com/api/")
API_PIXABAY_KEY = os.getenv("API_PIXABAY_KEY")

# Cloudinary, usado para armazenar as imagens que o professor envia do próprio
# computador na criação de atividade (upload local, alternativa ao Pixabay)
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")