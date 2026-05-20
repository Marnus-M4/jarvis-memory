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

# ✅ OpenAI client (optional for now)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ✅ Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ✅ ROOT TEST
@app.get("/")
def root():
    return {"message": "Jarvis backend running ✅"}


# ✅ ✅ CREATE EMBEDDING (SAFE VERSION)
def get_embedding(text):
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except:
        return None  # ✅ no API key yet


# ✅ ✅ RECURSIVE GITHUB FILE READER (🔥 VERY IMPORTANT)
def get_all_md_files(url):
    headers = {
        "Accept": "application/vnd.github.v3+json"
    }

    response = requests.get(url, headers=headers)
    items = response.json()

    all_text = ""

    for item in items:
        if item["type"] == "file" and item["name"].endswith(".md"):
            file_res = requests.get(item["download_url"])
            all_text += file_res.text + "\n\n"

        elif item["type"] == "dir":
            # ✅ go deeper into folders
            all_text += get_all_md_files(item["url"])

    return all_text


# ✅ ✅ MANUAL UPLOAD (still useful)
@app.post("/upload_notes")
def upload_notes(data: dict):
    try:
        notes = data.get("notes", "")

        embedding = get_embedding(notes)

        data_to_insert = {
            "content": notes
        }

        # ✅ only add embedding if it exists
        if embedding:
            data_to_insert["embedding"] = embedding

        supabase.table("notes").insert(data_to_insert).execute()

        return {"status": "notes saved ✅"}

    except Exception as e:
        return {"error": str(e)}


# ✅ ✅ GITHUB WEBHOOK (FIXED VERSION)
GITHUB_REPO_API = "https://api.github.com/repos/Marnus-M4/obsidian-vault/contents"


@app.post("/github_webhook")
async def github_webhook(payload: dict):
    try:
        # ✅ get ALL markdown files (recursive)
        all_text = get_all_md_files(GITHUB_REPO_API)

        if all_text.strip() == "":
            return {"status": "no notes found"}

        embedding = get_embedding(all_text)

        data_to_insert = {
            "content": all_text
        }

        # ✅ only store embedding if available
        if embedding:
            data_to_insert["embedding"] = embedding

        supabase.table("notes").insert(data_to_insert).execute()

        return {"status": "github sync complete ✅"}

    except Exception as e:
        return {"error": str(e)}


# ✅ ✅ SEARCH (disabled until embeddings exist)
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


# ✅ ✅ ASK ROUTE
@app.post("/ask")
def ask(data: dict):
    try:
        question = data.get("question")

        notes = search_notes(question)

        prompt = f"""
You are Jarvis, a personal AI assistant.

Use the knowledge below if available:

{notes}

User question:
{question}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return {"response": response.choices[0].message.content}

    except Exception as e:
        return {"response": f"Error: {str(e)}"}
