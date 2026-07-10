from fastapi import FastAPI

app = FastAPI(
    title="Destila Exception Inbox",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Destila Exception Inbox API is running 🚀"
    }