
from functools import lru_cache


@lru_cache(maxsize=1)
def get_model():
    """
    Load the AI model only when required.
    Reuse it for subsequent screening requests.
    """
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("all-MiniLM-L6-v2")


def calculate_similarity(
    resume_text: str,
    job_description: str
) -> float:
    """
    Calculate semantic similarity between resume and job description.
    Returns a score from 0 to 100.
    """

    from sklearn.metrics.pairwise import cosine_similarity

    model = get_model()

    resume_embedding = model.encode([resume_text])
    job_embedding = model.encode([job_description])

    similarity = cosine_similarity(
        resume_embedding,
        job_embedding
    )[0][0]

    return round(float(similarity) * 100, 2)
