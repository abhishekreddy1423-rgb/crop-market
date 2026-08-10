# 🌾 Crop/Market Price Tracker

A full-stack agricultural commodity price tracking web application built with Python Flask, PostgreSQL, Redis, Celery, and React Redux.

---

## 🌟 Key Features

- **Daily Price Tracking**: Monitors daily mandi prices for Wheat, Paddy Rice, Cotton, Tomato, Potato, Onion, Maize, Mustard, Soyabean, and Chana across mandis in Punjab, Haryana, Maharashtra, Delhi, MP, Gujarat, Karnataka, and UP.
- **Automated Celery Beat Jobs**: Daily scheduled task (`fetch_daily_prices`) at midnight to ingest/scrape daily prices into PostgreSQL and flush/refresh Redis cache.
- **Redis High-Speed Caching**: Caches `/api/prices/latest` query results in Redis for 5 minutes to prevent repeated database lookups.
- **Interactive Dashboard**:
  - **Dynamic Filters**: Dropdowns for selecting Crops, Mandis, and Time Ranges (7D, 30D, 90D, 1Y).
  - **Metric Stat Cards**: Real-time cards displaying Latest Price, 1-Day % Change vs Yesterday, Period High, and Period Low.
  - **Recharts Price Trend Line**: Rich visual area chart showing historical price movement.
  - **Side-by-Side Market Comparison**: Multi-line graph and chip selector overlaying price trends across 2-4 selected mandis simultaneously.
  - **Records Breakdown Table**: Filterable and searchable tabular history of all daily mandi transactions.
  - **Theme Toggle**: Dark Mode & Light Mode support.

---

## 🏗️ Project Architecture

```
crop-market/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # Flask App Factory & DB/Redis setup
│   │   ├── models.py         # SQLAlchemy Models (Crop, Market, PriceRecord)
│   │   └── routes.py         # REST API endpoints
│   ├── config.py             # Environment configurations & fallbacks
│   ├── tasks.py              # Celery tasks & Celery Beat schedule
│   ├── run.py                # Entry point & seed initializer
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, FilterBar, StatCards, PriceChart, MarketComparison, PriceTable
│   │   ├── store/            # Redux store, cropsSlice, marketsSlice, pricesSlice
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css         # Modern design system & glassmorphism styles
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml        # Orchestrates Postgres, Redis, Flask API, Celery Worker/Beat & React
└── README.md
```

---

## 🚀 Quick Start with Docker Compose

To launch the full stack (PostgreSQL, Redis, Flask Backend, Celery Worker, Celery Beat, and React Frontend) with a single command:

```bash
docker-compose up --build
```

Access the services:
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Flask REST API**: [http://localhost:5000/api/crops](http://localhost:5000/api/crops)

---

## 💻 Standalone Local Development

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
*(Runs on `http://localhost:5000` with automatic SQLite fallback if PostgreSQL is not active locally)*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*(Runs on `http://localhost:3000` with Vite proxy forwarding `/api` requests to Flask)*

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/crops` | List all tracked agricultural crops |
| `GET` | `/api/markets` | List all registered mandis/markets |
| `GET` | `/api/prices?crop_id=1&market_id=1&range=30d` | Fetch timeseries price history |
| `GET` | `/api/prices/latest?crop_id=1` | Fetch latest prices per crop (**Redis Cached**) |
| `GET` | `/api/prices/compare?crop_id=1&market_ids=1,2,3&range=30d` | Side-by-side market comparison timeseries |
| `POST` | `/api/seed` | Manually trigger initial seed data generation |

---

## 🗄️ Database Schema & Composite Index

- **`crops`**: `id` (PK), `name` (VARCHAR), `category` (VARCHAR), `unit` (VARCHAR), `created_at` (TIMESTAMP)
- **`markets`**: `id` (PK), `name` (VARCHAR), `state` (VARCHAR), `district` (VARCHAR), `created_at` (TIMESTAMP)
- **`price_records`**: `id` (PK), `crop_id` (FK), `market_id` (FK), `price` (NUMERIC 10,2), `recorded_date` (DATE), `source` (VARCHAR), `created_at` (TIMESTAMP)
- **Composite Index**: `idx_crop_market_date` on `(crop_id, market_id, recorded_date)` for fast timeseries queries.
