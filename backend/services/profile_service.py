import json
from pathlib import Path


# ============================================================
# Project paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

RESUME_FACTS_PATH = (
    PROJECT_ROOT
    / "ai_core"
    / "data"
    / "resume_facts.json"
)

PROJECT_LINKS_PATH = (
    PROJECT_ROOT
    / "backend"
    / "data"
    / "project_links.json"
)


# ============================================================
# JSON helper
# ============================================================

def load_json(file_path: Path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


# ============================================================
# Profile service
# ============================================================

def get_profile():
    """
    Read the latest resume facts and merge the manually
    maintained GitHub / Live Demo links.

    resume_facts.json:
        - name
        - description
        - tech
        - skills
        - experience
        - education
        - etc.

    project_links.json:
        - github
        - demo
    """

    resume_facts = load_json(RESUME_FACTS_PATH)
    project_links = load_json(PROJECT_LINKS_PATH)

    projects = []

    for project in resume_facts.get("projects", []):
        project_id = project.get("id", "")

        links = project_links.get(project_id, {})

        projects.append({
            "id": project_id,
            "name": project.get("name", ""),
            "description": project.get("description", ""),
            "tech": project.get("tech", []),
            "github": links.get("github", ""),
            "demo": links.get("demo", "")
        })

    return {
        "name": resume_facts.get("name", ""),
        "tagline": resume_facts.get("tagline", ""),
        "location": resume_facts.get("location", ""),
        "email": resume_facts.get("email", ""),
        "phone": resume_facts.get("phone", ""),
        "college": resume_facts.get("college", ""),
        "cgpa": resume_facts.get("cgpa", ""),
        "about": resume_facts.get("about", ""),
        "skills": resume_facts.get("skills", []),
        "experience": resume_facts.get("experience", []),
        "education": resume_facts.get("education", []),
        "projects": projects,

        # Resume file served by the FastAPI backend.
        "resume_url": "/resume.pdf"
    }