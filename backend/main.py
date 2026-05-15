from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import os

# ✅ Load environment variables from .env
load_dotenv()

app = FastAPI()

# ✅ Allow frontend (React) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for production later you can restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load API key safely
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ✅ Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)


@app.get("/")
def home():
    return {"message": "Jarvis backend is running ✅"}


@app.post("/ask")
def ask(data: dict):
    try:
        question = data.get("question")

        if not question:
            return {"response": "No question provided."}

        # ✅ Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # you can switch to gpt-3.5-turbo if needed
            messages=[
                {"role": "system", "content": "You are Jarvis, a helpful AI assistant."},
                {"role": "user", "content": question}
            ]
        )

        answer = response.choices[0].message.content

        return {"response": answer}

    except Exception as e:
        # ✅ This prevents crashes + shows real error
        print("ERROR:", e)
        return {"response": f"Error: {str(e)}"}