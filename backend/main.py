from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
import threading  # ✅ NEW
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

# ✅ LOAD ENV
load_dotenv()

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ OpenAI (safe)
openai_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_key) if openai_key else None

# ✅ Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ✅ ROOT
@app.get("/")
def root():
    return {"message": "Jarvis backend running ✅"}


# ✅ EMBEDDING
def get_embedding(text):
    try:
        if not client:
            return None

        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    except Exception as e:
        print("Embedding error:", e)
        return None


# ✅ ✅ RECURSIVE FILE READER (CORRECT)
def get_all_md_files(path=""):
    base_url = "https://api.github.com/repos/Marnus-M4/obsidian-vault/contents"

    url = f"{base_url}/{path}" if path else base_url

    print("Fetching:", url)

    response = requests.get(url)

    if response.status_code != 200:
        print("GitHub API error:", response.text)
        return ""

    items = response.json()

    all_text = ""

    for item in items:
        print(f"Found: {item['name']} ({item['type']})")

        if item["type"] == "file" and item["name"].endswith(".md"):
            print("Reading:", item["path"])
            file_res = requests.get(item["download_url"])
            all_text += file_res.text + "\n\n"

        elif item["type"] == "dir":
            all_text += get_all_md_files(item["path"])

    return all_text


# ✅ ✅ BACKGROUND WORKER (🔥 FIX)
def process_github_sync():
    try:
        print("🔥 Background sync started")

        all_text = get_all_md_files()

        print("Collected length:", len(all_text))

        if not all_text.strip():
            print("⚠️ No notes found")
            return

        embedding = get_embedding(all_text)

        data_to_insert = {"content": all_text}

        if embedding:
            data_to_insert["embedding"] = embedding

        supabase.table("notes").insert(data_to_insert).execute()

        print("✅ Data inserted into Supabase")

    except Exception as e:
        print("❌ Background error:", e)


# ✅ ✅ WEBHOOK (FAST RESPONSE ✅)
@app.post("/github_webhook")
async def github_webhook(payload: dict):
    try:
        print("✅ Webhook received")

        # ✅ Run in background thread
        thread = threading.Thread(target=process_github_sync)
        thread.start()

        # ✅ RETURN IMMEDIATELY (IMPORTANT)
        return {"status": "processing"}

    except Exception as e:
        return {"error": str(e)}


# ✅ MANUAL UPLOAD
@app.post("/upload_notes")
def upload_notes(data: dict):
    try:
        notes = data.get("notes", "")

        embedding = get_embedding(notes)

        data_to_insert = {"content": notes}

        if embedding:
            data_to_insert["embedding"] = embedding

        supabase.table("notes").insert(data_to_insert).execute()

        return {"status": "notes saved ✅"}

    except Exception as e:
        return {"error": str(e)}


# ✅ SEARCH
def search_notes(query):
    try:
        query_embedding = get_embedding(query)

        if not query_embedding:
            return ""

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


# ✅ ASK
@app.post("/ask")
def ask(data: dict):
    try:
        question = data.get("question")

        notes = search_notes(question)

        prompt = f"""
You are Jarvis.

Use knowledge if available:

{notes}

Question:
{question}
"""

        if not client:
            return {"response": "⚠️ AI not active (no API key yet)"}

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )

        return {"response": response.choices[0].message.content}

    except Exception as e:
        return {"response": str(e)}
