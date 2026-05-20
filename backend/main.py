from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from openai import OpenAI
from supabase import create_client

app = FastAPI()

# ✅ allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ✅ Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ✅ ROOT TEST
@app.get("/")
def root():
    return {"message": "Jarvis backend running ✅"}


# ✅ ✅ CREATE EMBEDDING
def get_embedding(text):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


# ✅ ✅ SAVE NOTES WITH EMBEDDING (MANUAL UPLOAD)
@app.post("/upload_notes")
def upload_notes(data: dict):
    try:
        notes = data.get("notes", "")

        embedding = get_embedding(notes)

        supabase.table("notes").insert({
            "content": notes,
            "embedding": embedding
        }).execute()

        return {"status": "notes saved with embeddings ✅"}

    except Exception as e:
        return {"error": str(e)}


# ✅ ✅ SEARCH ONLY RELEVANT NOTES (RAG)
def search_notes(query):
    try:
        query_embedding = get_embedding(query)

        result = supabase.rpc("match_notes", {
            "query_embedding": query_embedding,
            "match_count": 3
        }).execute()

        text = ""

        for row in result.data:
            text += row["content"] + "\n\n"

        return text

    except Exception as e:
        print("Search error:", e)
        return ""


# ✅ ✅ GITHUB WEBHOOK SYNC (AUTOMATIC)
GITHUB_REPO_API = "https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/contents"


@app.post("/github_webhook")
async def github_webhook(payload: dict):
    try:
        headers = {
            "Accept": "application/vnd.github.v3+json"
        }

        response = requests.get(GITHUB_REPO_API, headers=headers)
        files = response.json()

        all_text = ""

        for file in files:
            if file["name"].endswith(".md"):
                file_res = requests.get(file["download_url"])
                all_text += file_res.text + "\n\n"

        if all_text.strip() == "":
            return {"status": "no notes found"}

        embedding = get_embedding(all_text)

        supabase.table("notes").insert({
            "content": all_text,
            "embedding": embedding
        }).execute()

        return {"status": "github sync complete ✅"}

    except Exception as e:
        return {"error": str(e)}


# ✅ ✅ MAIN ASK ROUTE (RAG + AI)
@app.post("/ask")
def ask(data: dict):
    try:
        question = data.get("question")
        image_base64 = data.get("image")

        # ✅ use smart search
        notes = search_notes(question)

        content = []

        prompt = f"""
You are Jarvis, a personal AI assistant.

Use ONLY the relevant knowledge below:

{notes}

Answer clearly and helpfully.

User question:
{question}
"""

        content.append({
            "type": "input_text",
            "text": prompt
        })

        if image_base64:
            image_base64 = image_base64.split(",")[1]

            content.append({
                "type": "input_image",
                "image_base64": image_base64
            })

        response = client.responses.create(
            model="gpt-4o-mini",
            input=[{
                "role": "user",
                "content": content
            }]
        )

        return {
            "response": response.output_text
        }

    except Exception as e:
        return {"response": f"Error: {str(e)}"}