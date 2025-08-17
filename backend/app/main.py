# app/main.py
from fastapi import FastAPI
app = FastAPI(title="Ecom")
@app.get("/health")
def health():
    return {"status": "ok"}
