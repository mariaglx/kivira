from sqlalchemy import create_engine 
from sqlalchemy.orm import declarative_base
DATABASE_URL = "mysql+pymysql://root:kivira123@localhost:3306/kivira_db"

engine = create_engine(DATABASE_URL)
Base = declarative_base()