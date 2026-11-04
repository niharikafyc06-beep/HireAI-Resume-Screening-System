import re

SKILL_PATTERNS = {
    "Python": [r"\bpython\b"],
    "Java": [r"\bjava\b"],
    "C++": [r"(?<!\w)c\+\+(?!\w)", r"\bcpp\b"],
    "JavaScript": [r"\bjavascript\b", r"\bjs\b"],
    "TypeScript": [r"\btypescript\b"],
    "HTML": [r"\bhtml5?\b"],
    "CSS": [r"\bcss3?\b"],
    "React": [r"\breact(?:\.js|js)?\b"],
    "Node.js": [r"\bnode\.?js\b", r"\bnodejs\b"],
    "Express": [r"\bexpress(?:\.js)?\b"],
    "FastAPI": [r"\bfastapi\b"],
    "Django": [r"\bdjango\b"],
    "Flask": [r"\bflask\b"],
    "SQL": [r"\bsql\b"],
    "MySQL": [r"\bmysql\b"],
    "PostgreSQL": [r"\bpostgresql\b", r"\bpostgres\b"],
    "MongoDB": [r"\bmongodb\b"],
    "Machine Learning": [r"\bmachine learning\b", r"\bml\b"],
    "Deep Learning": [r"\bdeep learning\b"],
    "Artificial Intelligence": [r"\bartificial intelligence\b"],
    "Data Science": [r"\bdata science\b"],
    "Pandas": [r"\bpandas\b"],
    "NumPy": [r"\bnumpy\b"],
    "Scikit-learn": [r"\bscikit[- ]learn\b", r"\bsklearn\b"],
    "TensorFlow": [r"\btensorflow\b"],
    "PyTorch": [r"\bpytorch\b"],
    "AWS": [r"\baws\b", r"\bamazon web services\b"],
    "Azure": [r"\bazure\b"],
    "Docker": [r"\bdocker\b"],
    "Git": [r"\bgit\b"],
    "GitHub": [r"\bgithub\b"],
    "REST API": [r"\brest(?:ful)? apis?\b"],
    "Linux": [r"\blinux\b"],
    "Power BI": [r"\bpower bi\b"],
    "Excel": [r"\bexcel\b"]
}


def extract_skills(resume_text: str):

    found_skills = []
    text = resume_text.lower()

    for skill, patterns in SKILL_PATTERNS.items():

        for pattern in patterns:

            if re.search(pattern, text):
                found_skills.append(skill)
                break

    return found_skills