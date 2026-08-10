import json
import logging
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from sqlalchemy import func, desc
from app.models import db, Crop, Market, PriceRecord

api_bp = Blueprint('api', __name__)
logger = logging.getLogger(__name__)

# Redis client placeholder initialized in app factory
redis_client = None

def get_redis():
    return redis_client

# In-memory fallback cache if Redis is not active/available
in_memory_cache = {}

def cache_get(key):
    r = get_redis()
    if r:
        try:
            val = r.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning(f"Redis get error: {e}")
    return in_memory_cache.get(key)

def cache_set(key, value, ex=300):
    r = get_redis()
    if r:
        try:
            r.setex(key, ex, json.dumps(value))
            return
        except Exception as e:
            logger.warning(f"Redis set error: {e}")
    in_memory_cache[key] = value

@api_bp.route('/crops', methods=['GET'])
def get_crops():
    category = request.args.get('category')
    query = Crop.query
    if category:
        query = query.filter_by(category=category)
    crops = query.order_by(Crop.name).all()
    return jsonify([c.to_dict() for c in crops])

@api_bp.route('/markets', methods=['GET'])
def get_markets():
    state = request.args.get('state')
    query = Market.query
    if state:
        query = query.filter_by(state=state)
    markets = query.order_by(Market.state, Market.name).all()
    return jsonify([m.to_dict() for m in markets])

@api_bp.route('/prices', methods=['GET'])
def get_prices():
    crop_id = request.args.get('crop_id', type=int)
    market_id = request.args.get('market_id', type=int)
    time_range = request.args.get('range', '30d')  # 7d, 30d, 90d, 1y

    days_map = {'7d': 7, '30d': 30, '90d': 90, '1y': 365}
    num_days = days_map.get(time_range, 30)

    cutoff_date = datetime.utcnow().date() - timedelta(days=num_days)

    query = PriceRecord.query.filter(PriceRecord.recorded_date >= cutoff_date)

    if crop_id:
        query = query.filter(PriceRecord.crop_id == crop_id)
    if market_id:
        query = query.filter(PriceRecord.market_id == market_id)

    records = query.order_by(PriceRecord.recorded_date.asc()).all()
    return jsonify([r.to_dict() for r in records])

@api_bp.route('/prices/latest', methods=['GET'])
def get_latest_prices():
    crop_id = request.args.get('crop_id', type=int)
    cache_key = f"latest_prices:crop_{crop_id if crop_id else 'all'}"

    # Try cache first
    cached_data = cache_get(cache_key)
    if cached_data:
        return jsonify({'source': 'cache', 'data': cached_data})

    # Subquery to get max recorded_date per crop/market
    subquery = db.session.query(
        PriceRecord.crop_id,
        PriceRecord.market_id,
        func.max(PriceRecord.recorded_date).label('max_date')
    )
    if crop_id:
        subquery = subquery.filter(PriceRecord.crop_id == crop_id)
    subquery = subquery.group_by(PriceRecord.crop_id, PriceRecord.market_id).subquery()

    latest_records = db.session.query(PriceRecord).join(
        subquery,
        (PriceRecord.crop_id == subquery.c.crop_id) &
        (PriceRecord.market_id == subquery.c.market_id) &
        (PriceRecord.recorded_date == subquery.c.max_date)
    ).all()

    # Calculate 1-day percentage change for each crop/market
    result = []
    for r in latest_records:
        prev_record = PriceRecord.query.filter(
            PriceRecord.crop_id == r.crop_id,
            PriceRecord.market_id == r.market_id,
            PriceRecord.recorded_date < r.recorded_date
        ).order_by(desc(PriceRecord.recorded_date)).first()

        prev_price = float(prev_record.price) if prev_record else None
        curr_price = float(r.price)
        change_pct = None
        if prev_price and prev_price > 0:
            change_pct = round(((curr_price - prev_price) / prev_price) * 100, 2)

        data_item = r.to_dict()
        data_item['previous_price'] = prev_price
        data_item['change_pct'] = change_pct
        result.append(data_item)

    # Set cache for 5 minutes (300s)
    cache_set(cache_key, result, ex=300)

    return jsonify({'source': 'database', 'data': result})

@api_bp.route('/prices/compare', methods=['GET'])
def compare_prices():
    crop_id = request.args.get('crop_id', type=int)
    market_ids_str = request.args.get('market_ids', '')
    time_range = request.args.get('range', '30d')

    if not crop_id:
        return jsonify({'error': 'crop_id parameter is required'}), 400

    market_ids = [int(m) for m in market_ids_str.split(',') if m.isdigit()]
    if not market_ids:
        # Default to top 3 markets if none specified
        market_ids = [m.id for m in Market.query.limit(3).all()]

    days_map = {'7d': 7, '30d': 30, '90d': 90, '1y': 365}
    num_days = days_map.get(time_range, 30)
    cutoff_date = datetime.utcnow().date() - timedelta(days=num_days)

    records = PriceRecord.query.filter(
        PriceRecord.crop_id == crop_id,
        PriceRecord.market_id.in_(market_ids),
        PriceRecord.recorded_date >= cutoff_date
    ).order_by(PriceRecord.recorded_date.asc()).all()

    # Pivot by recorded_date for clean multi-line chart rendering
    pivoted = {}
    for r in records:
        d_str = r.recorded_date.isoformat()
        if d_str not in pivoted:
            pivoted[d_str] = {'date': d_str}
        market_name = r.market.name if r.market else f"Market {r.market_id}"
        pivoted[d_str][f"market_{r.market_id}"] = float(r.price)
        pivoted[d_str][f"name_{r.market_id}"] = market_name

    sorted_result = [pivoted[d] for d in sorted(pivoted.keys())]
    return jsonify(sorted_result)

@api_bp.route('/prices/bar-summary', methods=['GET'])
def get_bar_summary():
    """Returns mandi-wise latest prices and average price for a selected crop for Bar Chart rendering."""
    crop_id = request.args.get('crop_id', type=int)
    if not crop_id:
        crop = Crop.query.first()
        crop_id = crop.id if crop else 1

    crop = Crop.query.get(crop_id)
    if not crop:
        return jsonify({'error': 'Crop not found'}), 404

    # Subquery to get max date per market for this crop
    subquery = db.session.query(
        PriceRecord.market_id,
        func.max(PriceRecord.recorded_date).label('max_date')
    ).filter(PriceRecord.crop_id == crop_id).group_by(PriceRecord.market_id).subquery()

    latest_records = db.session.query(PriceRecord).join(
        subquery,
        (PriceRecord.market_id == subquery.c.market_id) &
        (PriceRecord.recorded_date == subquery.c.max_date)
    ).filter(PriceRecord.crop_id == crop_id).all()

    mandi_data = []
    total_price = 0.0
    for r in latest_records:
        price_val = float(r.price)
        total_price += price_val
        mandi_data.append({
            'market_id': r.market_id,
            'market_name': r.market.name if r.market else f"Market {r.market_id}",
            'state': r.market.state if r.market else 'N/A',
            'price': price_val,
            'unit': crop.unit,
            'recorded_date': r.recorded_date.isoformat()
        })

    # Calculate overall average price across all mandis for this crop
    avg_price = round(total_price / len(mandi_data), 2) if mandi_data else 0.0

    return jsonify({
        'crop_id': crop.id,
        'crop_name': crop.name,
        'unit': crop.unit,
        'average_price': avg_price,
        'total_mandis': len(mandi_data),
        'mandis': mandi_data
    })

# --- ADMIN API ENDPOINTS ---

@api_bp.route('/admin/login', methods=['POST'])
def admin_login():
    from app.models import User
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    user = User.query.filter_by(username=username).first()
    # Support default fallback login if DB has not seeded user yet
    if (user and user.check_password(password)) or (username == 'admin' and password == 'admin123'):
        token = f"admin-token-{datetime.utcnow().timestamp()}"
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'username': username,
                'role': 'admin'
            }
        })
    
    return jsonify({'error': 'Invalid admin credentials. Use admin / admin123'}), 401

@api_bp.route('/admin/prices', methods=['POST'])
def update_admin_price():
    """
    Updates or inserts today's price for a given crop and mandi.
    Automatically recalculates the average price across all mandis for this crop,
    flushes the Redis cache, and returns the updated record and new calculated average.
    """
    data = request.get_json() or {}
    crop_id = data.get('crop_id')
    market_id = data.get('market_id')
    price = data.get('price')
    recorded_date_str = data.get('recorded_date')

    if not crop_id or not market_id or price is None:
        return jsonify({'error': 'crop_id, market_id, and price are required'}), 400

    try:
        price_val = float(price)
        if price_val <= 0:
            return jsonify({'error': 'Price must be greater than 0'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid numeric price'}), 400

    if recorded_date_str:
        try:
            target_date = datetime.strptime(recorded_date_str, '%Y-%m-%d').date()
        except ValueError:
            target_date = datetime.utcnow().date()
    else:
        target_date = datetime.utcnow().date()

    crop = Crop.query.get(crop_id)
    market = Market.query.get(market_id)
    if not crop or not market:
        return jsonify({'error': 'Crop or Market not found'}), 404

    # Check if record exists for this date
    rec = PriceRecord.query.filter_by(
        crop_id=crop_id,
        market_id=market_id,
        recorded_date=target_date
    ).first()

    if rec:
        rec.price = price_val
        rec.source = 'Admin Portal Manual Update'
    else:
        rec = PriceRecord(
            crop_id=crop_id,
            market_id=market_id,
            price=price_val,
            recorded_date=target_date,
            source='Admin Portal Manual Update'
        )
        db.session.add(rec)

    db.session.commit()

    # AUTOMATIC RECALCULATION OF AVERAGE PRICE FOR THIS CROP
    subquery = db.session.query(
        PriceRecord.market_id,
        func.max(PriceRecord.recorded_date).label('max_date')
    ).filter(PriceRecord.crop_id == crop_id).group_by(PriceRecord.market_id).subquery()

    latest_crop_prices = db.session.query(PriceRecord.price).join(
        subquery,
        (PriceRecord.market_id == subquery.c.market_id) &
        (PriceRecord.recorded_date == subquery.c.max_date)
    ).filter(PriceRecord.crop_id == crop_id).all()

    prices_list = [float(p[0]) for p in latest_crop_prices]
    new_avg = round(sum(prices_list) / len(prices_list), 2) if prices_list else price_val

    # Clear/invalidate Redis cache
    r = get_redis()
    if r:
        try:
            for key in r.scan_iter("latest_prices:*"):
                r.delete(key)
            logger.info(f"Invalidated Redis cache after admin price update for crop {crop_id}")
        except Exception as e:
            logger.warning(f"Error clearing Redis cache: {e}")

    # Also clear in-memory cache
    in_memory_cache.clear()

    return jsonify({
        'success': True,
        'message': f"Updated price for {crop.name} at {market.name} to ₹{price_val}",
        'updated_record': rec.to_dict(),
        'crop_id': crop_id,
        'crop_name': crop.name,
        'new_mandi_price': price_val,
        'recalculated_average_price': new_avg,
        'mandis_count': len(prices_list)
    })

@api_bp.route('/seed', methods=['POST'])
def seed_data():
    from tasks import seed_initial_data
    created = seed_initial_data()
    return jsonify({'message': 'Data seeded successfully', 'stats': created})

