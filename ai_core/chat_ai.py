import json
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
import os

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("API key not found")

client = Groq(api_key=api_key)
model = "openai/gpt-oss-120b"

BASE_DIR = Path(__file__).parent

RESUME_FACTS_PATH = BASE_DIR / "data" / "resume_facts.json"
NARRATIVE_ANSWERS_PATH = BASE_DIR / "data" / "narrative_answers.json"
SYSTEM_PROMPT_PATH = BASE_DIR / "prompts" / "system_prompt.txt"


def load_json_file(file_path: Path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def load_system_prompt(file_path: Path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()


resume_facts = load_json_file(RESUME_FACTS_PATH)
narrative_answers = load_json_file(NARRATIVE_ANSWERS_PATH)
system_prompt = load_system_prompt(SYSTEM_PROMPT_PATH)

class ChatResponse(BaseModel):
    answer: str
    mentioned_project: str | None = None


chat_response_schema = ChatResponse.model_json_schema()

context = f"""
RESUME FACTS:
{json.dumps(resume_facts, indent=2, ensure_ascii=False)}

NARRATIVE ANSWERS:
{json.dumps(narrative_answers, indent=2, ensure_ascii=False)}
"""

full_system_prompt = f"""
{system_prompt}

====================
CURRENT RESUME DATA
====================
{context}
"""

def ask(question, history):
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": full_system_prompt
            },
            *history,
            {
                "role": "user",
                "content": question
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "candidate_terminal_response",
                "schema": chat_response_schema
            }
        }
    )

    raw_output = response.choices[0].message.content
    data = json.loads(raw_output)

    return ChatResponse(**data)
