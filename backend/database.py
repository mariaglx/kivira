# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from core.config import DATABASE_URL

# Configuração com suporte ao SSL exigido pelo Aiven
engine = create_engine(
    DATABASE_URL,
    connect_args={"ssl": {"check_hostname": False, "verify_mode": False}},
    pool_pre_ping=True,  # Evita que conexões inativas na nuvem caiam
)

Base = declarative_base()
