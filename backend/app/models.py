from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Index, UniqueConstraint
from datetime import datetime

db = SQLAlchemy()

class Crop(db.Model):
    __tablename__ = 'crops'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    category = db.Column(db.String(50), nullable=False)  # Cereals, Pulses, Vegetables, Fruits, Oilseeds, Spices
    unit = db.Column(db.String(20), nullable=False, default='Quintal')  # Quintal, Kg, Ton
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    price_records = db.relationship('PriceRecord', backref='crop', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'unit': self.unit,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Market(db.Model):
    __tablename__ = 'markets'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    district = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    price_records = db.relationship('PriceRecord', backref='market', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        UniqueConstraint('name', 'state', 'district', name='uq_market_location'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state,
            'district': self.district,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='admin')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PriceRecord(db.Model):
    __tablename__ = 'price_records'

    id = db.Column(db.Integer, primary_key=True)
    crop_id = db.Column(db.Integer, db.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id', ondelete='CASCADE'), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    recorded_date = db.Column(db.Date, nullable=False)
    source = db.Column(db.String(100), nullable=False, default='Agmarknet API')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        # Mandatory composite index on (crop_id, market_id, recorded_date)
        Index('idx_crop_market_date', 'crop_id', 'market_id', 'recorded_date'),
        UniqueConstraint('crop_id', 'market_id', 'recorded_date', name='uq_crop_market_date'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'crop_id': self.crop_id,
            'crop_name': self.crop.name if self.crop else None,
            'crop_unit': self.crop.unit if self.crop else 'Quintal',
            'market_id': self.market_id,
            'market_name': self.market.name if self.market else None,
            'market_state': self.market.state if self.market else None,
            'price': float(self.price),
            'recorded_date': self.recorded_date.isoformat(),
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

