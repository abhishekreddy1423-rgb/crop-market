import os
import logging
from app import create_app
from tasks import seed_initial_data

logger = logging.getLogger(__name__)
app = create_app()

# Automatically seed initial crop & market price data on app launch/import
try:
    seed_result = seed_initial_data()
    logger.info(f"Initial seed status: {seed_result}")
except Exception as e:
    logger.warning(f"Initial seed check error: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

