from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="downtime.raiders API")
api_router = APIRouter(prefix="/api")


# ===== Models =====
class Score(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pilot: str
    score: int
    wave: int = 1
    kills: int = 0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScoreCreate(BaseModel):
    pilot: str = Field(..., min_length=1, max_length=24)
    score: int = Field(..., ge=0)
    wave: int = Field(default=1, ge=1)
    kills: int = Field(default=0, ge=0)


# ===== Routes =====
@api_router.get("/")
async def root():
    return {"message": "downtime.raiders online", "status": "ok"}


@api_router.post("/scores", response_model=Score)
async def submit_score(payload: ScoreCreate):
    pilot = payload.pilot.strip().upper()[:24]
    if not pilot:
        raise HTTPException(status_code=400, detail="Pilot name required")

    score_obj = Score(
        pilot=pilot,
        score=payload.score,
        wave=payload.wave,
        kills=payload.kills,
    )
    doc = score_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.scores.insert_one(doc)
    return score_obj


@api_router.get("/scores", response_model=List[Score])
async def get_scores(limit: int = 10):
    limit = max(1, min(limit, 50))
    cursor = db.scores.find({}, {"_id": 0}).sort("score", -1).limit(limit)
    rows = await cursor.to_list(length=limit)
    for r in rows:
        if isinstance(r.get('timestamp'), str):
            r['timestamp'] = datetime.fromisoformat(r['timestamp'])
    return rows


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
