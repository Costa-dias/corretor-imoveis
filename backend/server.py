from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import requests
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from starlette.middleware.cors import CORSMiddleware


# ------------------------------------------------------------
# DB & App bootstrap
# ------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Imóveis Premium API")
api_router = APIRouter(prefix="/api")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)

# ------------------------------------------------------------
# Object Storage (Emergent)
# ------------------------------------------------------------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "joel-imoveis")
storage_key: Optional[str] = None

MIME_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
}


def init_storage() -> Optional[str]:
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        return None
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30,
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logging.getLogger(__name__).error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Armazenamento indisponível")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 403:
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Armazenamento indisponível")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 403:
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ------------------------------------------------------------
# Auth helpers
# ------------------------------------------------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    token = None
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


# ------------------------------------------------------------
# Models
# ------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class PropertyCreate(BaseModel):
    title: str = Field(min_length=2, max_length=140)
    location: str = Field(min_length=2, max_length=140)
    price: float = Field(gt=0)
    images: List[str] = Field(default_factory=list)
    image_url: Optional[str] = None  # backward compat
    description: Optional[str] = Field(default="", max_length=2000)
    listing_type: str = Field(default="venda")  # venda | aluguel


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    listing_type: Optional[str] = None


class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    location: str
    price: float
    image_url: str  # first image (kept for backward compat)
    images: List[str] = Field(default_factory=list)
    description: str = ""
    listing_type: str = "venda"
    created_at: str


class BrokerInfo(BaseModel):
    name: str
    phone: str
    creci: str
    tagline: str
    city: str = ""
    hours: str = ""
    price_from: str = ""


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def property_from_doc(doc: dict) -> dict:
    images = doc.get("images") or ([doc["image_url"]] if doc.get("image_url") else [])
    return {
        "id": doc["id"],
        "title": doc["title"],
        "location": doc["location"],
        "price": float(doc["price"]),
        "image_url": images[0] if images else "",
        "images": images,
        "description": doc.get("description", ""),
        "listing_type": doc.get("listing_type", "venda"),
        "created_at": doc["created_at"],
    }


# ------------------------------------------------------------
# Public routes
# ------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Imóveis Premium API"}


@api_router.get("/broker", response_model=BrokerInfo)
async def get_broker():
    return BrokerInfo(
        name=os.environ.get("BROKER_NAME", "Corretor"),
        phone=os.environ.get("BROKER_PHONE", ""),
        creci=os.environ.get("BROKER_CRECI", ""),
        tagline=os.environ.get("BROKER_TAGLINE", ""),
        city=os.environ.get("BROKER_CITY", ""),
        hours=os.environ.get("BROKER_HOURS", ""),
        price_from=os.environ.get("BROKER_PRICE_FROM", ""),
    )


@api_router.get("/properties", response_model=List[Property])
async def list_properties():
    cursor = db.properties.find({}, {"_id": 0}).sort("created_at", -1)
    docs = await cursor.to_list(500)
    return [property_from_doc(d) for d in docs]


@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return property_from_doc(doc)


# ------------------------------------------------------------
# Auth routes
# ------------------------------------------------------------
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    return LoginResponse(
        access_token=token,
        user={"id": user_id, "email": email, "name": user.get("name", "Admin")},
    )


@api_router.get("/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "name": current_user.get("name", "Admin"),
    }


# ------------------------------------------------------------
# Admin (protected) routes
# ------------------------------------------------------------
@api_router.post("/properties", response_model=Property)
async def create_property(
    body: PropertyCreate, current_user: dict = Depends(get_current_user)
):
    images = [u.strip() for u in (body.images or []) if u and u.strip()]
    if not images and body.image_url:
        images = [body.image_url.strip()]
    if not images:
        raise HTTPException(status_code=400, detail="Envie pelo menos 1 foto do imóvel")
    doc = {
        "id": str(uuid.uuid4()),
        "title": body.title.strip(),
        "location": body.location.strip(),
        "price": float(body.price),
        "images": images,
        "image_url": images[0],
        "description": (body.description or "").strip(),
        "listing_type": body.listing_type.strip().lower(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.properties.insert_one(doc)
    doc.pop("_id", None)
    return property_from_doc(doc)


@api_router.put("/properties/{property_id}", response_model=Property)
async def update_property(
    property_id: str,
    body: PropertyUpdate,
    current_user: dict = Depends(get_current_user),
):
    existing = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "price" in updates:
        updates["price"] = float(updates["price"])
    for key in ("title", "location", "image_url", "description", "listing_type"):
        if key in updates and isinstance(updates[key], str):
            updates[key] = updates[key].strip()
    if "images" in updates:
        images = [u.strip() for u in updates["images"] if u and u.strip()]
        if not images:
            raise HTTPException(status_code=400, detail="Envie pelo menos 1 foto do imóvel")
        updates["images"] = images
        updates["image_url"] = images[0]
    if updates:
        await db.properties.update_one({"id": property_id}, {"$set": updates})
    doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return property_from_doc(doc)


@api_router.delete("/properties/{property_id}")
async def delete_property(
    property_id: str, current_user: dict = Depends(get_current_user)
):
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return {"success": True}


# ------------------------------------------------------------
# Upload / file serving
# ------------------------------------------------------------
@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin").lower()
    if ext not in MIME_TYPES:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use JPG, PNG ou WEBP.")
    content_type = MIME_TYPES[ext]
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo maior que 15 MB")

    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{file_id}.{ext}"
    result = put_object(path, data, content_type)
    await db.files.insert_one(
        {
            "id": file_id,
            "storage_path": result.get("path", path),
            "original_filename": file.filename,
            "content_type": content_type,
            "size": result.get("size", len(data)),
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "uploaded_by": current_user.get("email"),
        }
    )
    return {
        "id": file_id,
        "url": f"/api/files/{file_id}",
        "content_type": content_type,
        "size": result.get("size", len(data)),
    }


@api_router.get("/files/{file_id}")
async def download_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    data, content_type = get_object(record["storage_path"])
    return Response(
        content=data,
        media_type=record.get("content_type", content_type),
        headers={"Cache-Control": "public, max-age=86400"},
    )


# ------------------------------------------------------------
# Startup: seed admin & indexes
# ------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.properties.create_index("created_at")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one(
            {
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "name": os.environ.get("BROKER_NAME", "Admin"),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info(f"Admin password refreshed for: {admin_email}")

    # Seed sample properties if collection is empty
    count = await db.properties.count_documents({})
    if count == 0:
        samples = [
            {
                "id": str(uuid.uuid4()),
                "title": "Apto Boqueirão · 1 dormitório",
                "location": "Boqueirão, Praia Grande - SP",
                "price": 250000.0,
                "image_url": "https://customer-assets.emergentagent.com/job_imobiliario-5/artifacts/xhjjoehl_image.png",
                "description": "Apartamento com 1 dormitório no Boqueirão, sala integrada, iluminação planejada e mobiliado. Ótima localização e a poucos passos da praia.",
                "listing_type": "venda",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Apto Tupi · 1 dormitório",
                "location": "Tupi, Praia Grande - SP",
                "price": 280000.0,
                "image_url": "https://customer-assets.emergentagent.com/job_imobiliario-5/artifacts/jlaf0v3f_image.png",
                "description": "Apartamento com 1 dormitório no bairro Tupi, prédio novo com portaria e boa localização. Excelente opção para moradia ou investimento.",
                "listing_type": "venda",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Casa em Condomínio · Samambaia",
                "location": "Samambaia, Praia Grande - SP",
                "price": 450000.0,
                "image_url": "https://customer-assets.emergentagent.com/job_imobiliario-5/artifacts/xutduq8l_image.png",
                "description": "Casa em condomínio fechado no bairro Samambaia. Fachada moderna, garagem, segurança 24h e acabamento de qualidade.",
                "listing_type": "venda",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        ]
        await db.properties.insert_many(samples)
        logger.info("Sample properties seeded.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ------------------------------------------------------------
# CORS & mount
# ------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="")
app.include_router(api_router, prefix="/api")