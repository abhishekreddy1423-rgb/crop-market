import os
import random
import logging
from datetime import datetime, timedelta
from celery import Celery
from celery.schedules import crontab
from config import Config

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    'tasks',
    broker=os.environ.get('CELERY_BROKER_URL', Config.CELERY_BROKER_URL),
    backend=os.environ.get('CELERY_RESULT_BACKEND', Config.CELERY_RESULT_BACKEND)
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',
    enable_utc=True,
    beat_schedule={
        'fetch-daily-prices-every-midnight': {
            'task': 'tasks.fetch_daily_prices',
            'schedule': crontab(hour=0, minute=0),  # Daily at midnight
        },
        'cleanup-stale-data-weekly': {
            'task': 'tasks.cleanup_stale_data',
            'schedule': crontab(hour=2, minute=0, day_of_week=0),  # Weekly Sunday 2 AM
        }
    }
)

# Reference data for realistic seed & scrape generation
SEED_CROPS = [
    {'name': 'Wheat', 'category': 'Cereals', 'unit': 'Quintal', 'base_price': 2275.0},
    {'name': 'Paddy (Rice)', 'category': 'Cereals', 'unit': 'Quintal', 'base_price': 2183.0},
    {'name': 'Cotton', 'category': 'Commercial', 'unit': 'Quintal', 'base_price': 6620.0},
    {'name': 'Tomato', 'category': 'Vegetables', 'unit': 'Quintal', 'base_price': 1850.0},
    {'name': 'Potato', 'category': 'Vegetables', 'unit': 'Quintal', 'base_price': 1420.0},
    {'name': 'Onion', 'category': 'Vegetables', 'unit': 'Quintal', 'base_price': 2400.0},
    {'name': 'Maize', 'category': 'Cereals', 'unit': 'Quintal', 'base_price': 2090.0},
    {'name': 'Mustard', 'category': 'Oilseeds', 'unit': 'Quintal', 'base_price': 5650.0},
    {'name': 'Soyabean', 'category': 'Oilseeds', 'unit': 'Quintal', 'base_price': 4600.0},
    {'name': 'Chana (Gram)', 'category': 'Pulses', 'unit': 'Quintal', 'base_price': 5440.0},
]

SEED_MARKETS = [
    {'name': 'Khanna Mandi', 'state': 'Punjab', 'district': 'Ludhiana'},
    {'name': 'Karnal Grain Market', 'state': 'Haryana', 'district': 'Karnal'},
    {'name': 'Azadpur Mandi', 'state': 'Delhi', 'district': 'North Delhi'},
    {'name': 'Lasalgaon Mandi', 'state': 'Maharashtra', 'district': 'Nashik'},
    {'name': 'Indore Mandi', 'state': 'Madhya Pradesh', 'district': 'Indore'},
    {'name': 'Rajkot Market Yard', 'state': 'Gujarat', 'district': 'Rajkot'},
    {'name': 'Kolar Vegetable Market', 'state': 'Karnataka', 'district': 'Kolar'},
    {'name': 'Agra Mandi', 'state': 'Uttar Pradesh', 'district': 'Agra'},
    # Andhra Pradesh Markets
    {'name': 'Guntur Mirchi & Agriculture Yard', 'state': 'Andhra Pradesh', 'district': 'Guntur'},
    {'name': 'Adoni Market Yard', 'state': 'Andhra Pradesh', 'district': 'Kurnool'},
    {'name': 'Vijayawada Wholesale Market', 'state': 'Andhra Pradesh', 'district': 'NTR Vijayawada'},
    {'name': 'Tadepalligudem Market', 'state': 'Andhra Pradesh', 'district': 'West Godavari'},
    # Telangana Markets
    {'name': 'Warangal Enumamula Grain Market', 'state': 'Telangana', 'district': 'Warangal'},
    {'name': 'Khammam Agriculture Market', 'state': 'Telangana', 'district': 'Khammam'},
    {'name': 'Nizamabad Market Yard', 'state': 'Telangana', 'district': 'Nizamabad'},
    {'name': 'Malakpet Commodity Market', 'state': 'Telangana', 'district': 'Hyderabad'},
]


def seed_initial_data():
    """Seeds default crops, markets, admin user, and 90 days of price records if database is empty."""
    from app import create_app
    from app.models import db, Crop, Market, PriceRecord, User
    
    app = create_app()
    with app.app_context():
        # 0. Ensure default admin user exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(username='admin', role='admin')
            admin_user.set_password('admin123')
            db.session.add(admin_user)

        # 1. Ensure crops exist
        crop_objs = {}
        for c in SEED_CROPS:
            existing = Crop.query.filter_by(name=c['name']).first()
            if not existing:
                existing = Crop(name=c['name'], category=c['category'], unit=c['unit'])
                db.session.add(existing)
                db.session.flush()
            crop_objs[c['name']] = (existing, c['base_price'])


        # 2. Ensure markets exist
        market_objs = []
        for m in SEED_MARKETS:
            existing = Market.query.filter_by(name=m['name'], state=m['state'], district=m['district']).first()
            if not existing:
                existing = Market(name=m['name'], state=m['state'], district=m['district'])
                db.session.add(existing)
                db.session.flush()
            market_objs.append(existing)

        db.session.commit()

        # 3. Ensure price records exist for all crops and markets (90 days of history)
        today = datetime.utcnow().date()
        added_records = 0

        for crop_name, (crop_model, base_p) in crop_objs.items():
            for market in market_objs:
                # Check if this crop/market combination has any price history
                has_history = PriceRecord.query.filter_by(
                    crop_id=crop_model.id,
                    market_id=market.id
                ).first()

                if not has_history:
                    curr_p = base_p * random.uniform(0.85, 1.15)
                    # Regional variance factor
                    mandi_factor = random.uniform(0.92, 1.08)
                    curr_p *= mandi_factor

                    for days_ago in range(90, -1, -1):
                        rec_date = today - timedelta(days=days_ago)
                        volatility = random.uniform(-0.025, 0.027)
                        curr_p = max(500.0, curr_p * (1.0 + volatility))

                        price_val = round(curr_p, 2)
                        rec = PriceRecord(
                            crop_id=crop_model.id,
                            market_id=market.id,
                            price=price_val,
                            recorded_date=rec_date,
                            source='Agmarknet Portal'
                        )
                        db.session.add(rec)
                        added_records += 1

        db.session.commit()
        logger.info(f"Seeded {added_records} new historical price records across {len(crop_objs)} crops and {len(market_objs)} markets.")
        return {'crops': len(crop_objs), 'markets': len(market_objs), 'new_records': added_records}


@celery_app.task(name='tasks.fetch_daily_prices')
def fetch_daily_prices():
    """
    Scheduled task that simulates fetching/scraping daily price data from public sources (Agmarknet/data.gov.in)
    and upserting into PostgreSQL, then clearing/updating Redis cache.
    """
    logger.info("Executing fetch_daily_prices task...")
    from app import create_app
    from app.models import db, Crop, Market, PriceRecord
    from app.routes import get_redis, cache_set

    app = create_app()
    with app.app_context():
        today = datetime.utcnow().date()
        crops = Crop.query.all()
        markets = Market.query.all()

        updated = 0
        for crop in crops:
            base = float(getattr(crop, 'base_price', 2500.0)) if hasattr(crop, 'base_price') else 2500.0
            
            for market in markets:
                # Find yesterday's price or start with base
                prev = PriceRecord.query.filter_by(
                    crop_id=crop.id,
                    market_id=market.id
                ).order_by(PriceRecord.recorded_date.desc()).first()

                prev_price = float(prev.price) if prev else base
                # Daily fluctuate -2% to +2.5%
                new_price = round(prev_price * (1 + random.uniform(-0.02, 0.025)), 2)

                existing = PriceRecord.query.filter_by(
                    crop_id=crop.id,
                    market_id=market.id,
                    recorded_date=today
                ).first()

                if existing:
                    existing.price = new_price
                else:
                    rec = PriceRecord(
                        crop_id=crop.id,
                        market_id=market.id,
                        price=new_price,
                        recorded_date=today,
                        source='Agmarknet Scheduled Ingestion'
                    )
                    db.session.add(rec)
                updated += 1

        db.session.commit()
        logger.info(f"Daily price sync completed. Updated {updated} market prices for {today}.")

        # Invalidate/Refresh Redis Cache
        r = get_redis()
        if r:
            try:
                # Flush price cache keys so next REST request re-fetches latest
                for key in r.scan_iter("latest_prices:*"):
                    r.delete(key)
                logger.info("Redis cache invalidated after price sync.")
            except Exception as e:
                logger.warning(f"Error invalidating Redis cache: {e}")

        return f"Synced {updated} prices for {today}"

@celery_app.task(name='tasks.cleanup_stale_data')
def cleanup_stale_data():
    """Periodic archival job to prune price data older than 3 years."""
    logger.info("Running cleanup_stale_data task...")
    from app import create_app
    from app.models import db, PriceRecord

    app = create_app()
    with app.app_context():
        cutoff = datetime.utcnow().date() - timedelta(days=365 * 3)
        deleted = PriceRecord.query.filter(PriceRecord.recorded_date < cutoff).delete()
        db.session.commit()
        logger.info(f"Archived/deleted {deleted} stale records older than {cutoff}.")
        return f"Cleaned up {deleted} records"
