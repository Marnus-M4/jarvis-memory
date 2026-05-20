from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import base64
from openai import OpenAI

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

# ✅ ROOT TEST
@app.get("/")
def root():
    return {"message": "Jarvis backend running ✅"}

# ✅ ✅ LOAD OBSIDIAN NOTES
def load_obsidian_notes():
    # 🔥 CHANGE THIS PATH TO YOUR VAULT LOCATION
    vault_path = r"C:\Users\MarnusvandenHeever\Documents\ObsidianVault"

    all_text = ""

    if not os.path.exists(vault_path):
        return ""

    for root, dirs, files in os.walk(vault_path):
        for file in files:
            if file.endswith(".md"):
                try:
                    with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                        all_text += f.read() + "\n\n"
                except:
                    pass

    # ✅ limit size (important for API)
    return all_text[:12000]


# ✅ ✅ MAIN ASK ROUTE
@app.post("/ask")
def ask(data: dict):
    try:
        question = data.get("question")
        image_base64 = data.get("image")

        # ✅ load knowledge base
        notes = load_obsidian_notes()

        content = []

        # ✅ add question + knowledge
        prompt = f"""
You are Jarvis, a personal AI assistant.

Use the user's knowledge base from Obsidian notes:

{notes}

Answer the question clearly and helpfully.

User question:
{question}
"""

        content.append({
            "type": "input_text",
            "text": prompt
        })

        # ✅ include screen if provided
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