import re


# 1. Extract candidate email
def extract_email(text):

    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'

    match = re.search(pattern, text)

    if match:
        return match.group(0)

    return "Not Found"


# 2. Extract candidate phone number
def extract_phone(text):

    pattern = r'(?<!\d)(?:\+91[-\s]?)?[6-9]\d{9}(?!\d)'

    match = re.search(pattern, text)

    if match:
        return match.group(0)

    return "Not Found"


# 3. Extract candidate name
def extract_name(text):

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    excluded_words = [
        "resume",
        "curriculum vitae",
        "professional summary",
        "education",
        "experience",
        "skills",
        "projects",
        "contact"
    ]

    for line in lines[:10]:

        cleaned_line = re.sub(
            r'[^A-Za-z .]',
            '',
            line
        ).strip()

        words = cleaned_line.split()

        if (
            2 <= len(words) <= 4
            and len(cleaned_line) <= 40
            and all(word.replace(".", "").isalpha() for word in words)
            and cleaned_line.lower() not in excluded_words
        ):
            return cleaned_line

    return "Not Found"


# 4. Extract candidate experience
def extract_experience(text):

    patterns = [
        r'(\d+(?:\.\d+)?)\s*\+?\s*years?\s+of\s+(?:professional\s+)?experience',

        r'(\d+(?:\.\d+)?)\s*\+?\s*years?\s+experience',

        r'experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?'
    ]

    matches = []

    for pattern in patterns:

        found = re.findall(
            pattern,
            text,
            re.IGNORECASE
        )

        matches.extend(found)

    if matches:

        return max(
            float(year)
            for year in matches
        )

    return 0


# 5. Extract all candidate details
def extract_candidate_details(text):

    candidate_details = {

        "name": extract_name(text),

        "email": extract_email(text),

        "phone": extract_phone(text),

        "experience_years": extract_experience(text)

    }

    return candidate_details