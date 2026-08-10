import logging
import os
from flask import Flask
from flask_cors import CORS
import redis
from config import Config
from app.models import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_postgres_available(uri):
    """Check if PostgreSQL server is reachable before initializing SQLAlchemy."""
    if not uri or not uri.startswith('postgresql'):
        return False
    try:
        import psycopg2
        # Parse URI or attempt quick connect
        from urllib.parse import urlparse
        result = urlparse(uri)
        conn = psycopg2.connect(
            dbname=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname or 'localhost',
            port=result.port or 5432,
            connect_timeout=2
        )
        conn.close()
        return True
    except Exception as e:
        logger.info(f"PostgreSQL not reachable at {uri} ({e}). Will use local SQLite database.")
        return False

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Determine DB URI before calling db.init_app(app) once
    pg_uri = config_class.SQLALCHEMY_DATABASE_URI
    if is_postgres_available(pg_uri):
        app.config['SQLALCHEMY_DATABASE_URI'] = pg_uri
        logger.info(f"Using PostgreSQL database: {pg_uri}")
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = config_class.LOCAL_SQLITE_URI
        logger.info(f"Using fallback SQLite database: {config_class.LOCAL_SQLITE_URI}")

    # Bind SQLAlchemy to Flask app
    db.init_app(app)
    with app.app_context():
        db.create_all()

    # Initialize Redis connection for caching
    try:
        r = redis.from_url(config_class.REDIS_URL, socket_connect_timeout=2)
        r.ping()
        from app import routes
        routes.redis_client = r
        logger.info("Successfully connected to Redis cache.")
    except Exception as e:
        logger.info(f"Redis unavailable ({e}). Operating with in-memory fallback cache.")

    # Register blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'db': app.config['SQLALCHEMY_DATABASE_URI']}

    return app
