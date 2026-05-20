from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
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


# ✅ ✅ SAVE NOTES TO SUPABASE
@app.post("/upload_notes")
def upload_notes(data: dict):
    try:
        notes = data.get("notes", "")

        supabase.table("notes").insert({
            "content": notes
        }).execute()

        return {"status": "notes saved ✅"}

    except Exception as e:
        return {"error": str(e)}


# ✅ ✅ GET NOTES FROM SUPABASE
def get_notes():
    try:
        result = supabase.table("notes").select("content").execute()

        all_text = ""

        for row in result.data:
            all_text += row["content"] + "\n\n"

        # ✅ limit (important for OpenAI)
        return all_text[:12000]

    except Exception:
        return ""


# ✅ ✅ MAIN ASK ROUTE
@app.post("/ask")
def ask(data: dict):
    try:
        question = data.get("question")
        image_base64 = data.get("image")

        # ✅ GET SAVED NOTES FROM DB
        notes = get_notes()

        content = []

        # ✅ BUILD PROMPT
        prompt = f"""
You are Jarvis, a personal AI assistant.

Use the user's knowledge base below when relevant:

{notes}

Answer clearly and helpfully.

User question:
{question}
"""

        content.append({
            "type": "input_text",
            "text": prompt
        })

        # ✅ INCLUDE IMAGE (screen awareness)
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
