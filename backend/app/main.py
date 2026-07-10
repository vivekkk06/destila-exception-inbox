from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.exceptions import router as exceptions_router

app = FastAPI(title="Mini Exception Inbox")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exceptions_router)

@app.get("/")
def root():
    return {"status": "ok"}
