import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'crop-market-secret-key-2026')
    
    # PostgreSQL with fallback to SQLite for easy local dev
    DB_USER = os.environ.get('POSTGRES_USER', 'crop_user')
    DB_PASS = os.environ.get('POSTGRES_PASSWORD', 'crop_pass')
    DB_HOST = os.environ.get('POSTGRES_HOST', 'db')
    DB_PORT = os.environ.get('POSTGRES_PORT', '5432')
    DB_NAME = os.environ.get('POSTGRES_DB', 'crop_db')
    
    DEFAULT_PG_URI = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', DEFAULT_PG_URI)
    
    # Fallback SQLite path if Postgres fails to connect in standalone local run
    LOCAL_SQLITE_URI = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'crop_market.db')}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis Configuration
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Celery Configuration
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', REDIS_URL)
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', REDIS_URL)
