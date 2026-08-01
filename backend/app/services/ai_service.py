"""
Service responsible for talking to the Groq (Groq) API and turning raw
customer feedback into structured `ReviewAnalysis` objects.

The Groq chat-completions endpoint is OpenAI-compatible, so we use a plain
httpx.AsyncClient rather than a heavyweight SDK.
"""
import json
from typing import List

import httpx

from app.core.config import get_settings
from app.core.exceptions import AIProviderError, AIResponseParsingError, ConfigurationError
from app.core.logging import get_logger
from app.models.schemas import ReviewAnalysis, ReviewInput
from app.utils.retry import async_retry

logger = get_logger(__name__)

BATCH_SIZE = 20

SYSTEM_PROMPT = """You are an expert Product Manager and Software Engineer who
triages customer feedback for a software product. For every review you are
given, analyze it and return a structured JSON object.

You MUST respond with ONLY a JSON array (no markdown fences, no prose before
or after). Each element of the array must have exactly these keys:

- "id": integer, the review id you were given
- "category": one of "Bug", "Feature Request", "Performance", "UI/UX",
  "Security", "Authentication", "Payments", "Notifications", "Other"
- "severity": one of "Critical", "High", "Medium", "Low"
- "sentiment": one of "Positive", "Neutral", "Negative"
- "confidence_score": float between 0 and 1, how confident you are in this
  classification
- "business_impact": integer 1-10, how much this affects the business if
  unresolved (10 = severe revenue/retention risk)
- "engineering_effort": one of "Small", "Medium", "Large", "Extra Large"
- "root_cause": short string with your best inference of the root cause, or
  null if it cannot be inferred from the review text
- "suggested_engineering_task": one short actionable sentence describing the
  engineering task that would resolve this feedback

Severity/category guidance:
- Crashes, data loss, payment failures, and security issues are Critical or
  High severity.
- Cosmetic UI issues or minor requests are usually Low or Medium.
- Feature requests are rarely Critical unless they block core workflows.
"""


def _build_user_prompt(reviews: List[ReviewInput]) -> str:
    payload = [{"id": r.id, "review": r.review} for r in reviews]
    return (
        "Analyze the following customer feedback reviews and return the JSON "
        "array described in the system prompt. Reviews:\n\n"
        + json.dumps(payload, ensure_ascii=False)
    )


def _chunk(items: List[ReviewInput], size: int) -> List[List[ReviewInput]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


@async_retry(max_attempts=3, base_delay_seconds=1.5, retry_exceptions=(httpx.HTTPError, AIProviderError))
async def _call_groq(client: httpx.AsyncClient, messages: list[dict]) -> str:
    settings = get_settings()
    if not settings.groq_api_key:
        raise ConfigurationError(
            "GROQ_API_KEY is not configured. Set it in backend/.env before calling /analyze."
        )

    response = await client.post(
        f"{settings.groq_api_base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.groq_model,
            "messages": messages,
            "temperature": 0.2,
        },
        timeout=60.0,
    )

    if response.status_code >= 400:
        logger.error("Groq API error %s: %s", response.status_code, response.text)
        raise AIProviderError(f"Groq API returned {response.status_code}: {response.text[:300]}")

    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise AIProviderError(f"Unexpected Groq API response shape: {data}") from exc


def _parse_batch_response(content: str) -> list[dict]:
    """Groq is instructed to return a raw JSON array, but models sometimes
    wrap it in markdown fences or a `{"reviews": [...]}` object. Handle both."""
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIResponseParsingError(f"Could not parse AI response as JSON: {exc}") from exc

    if isinstance(parsed, dict):
        for key in ("reviews", "results", "data", "analysis"):
            if key in parsed and isinstance(parsed[key], list):
                return parsed[key]
        raise AIResponseParsingError(f"AI response JSON object had no recognizable list field: {parsed.keys()}")

    if isinstance(parsed, list):
        return parsed

    raise AIResponseParsingError(f"AI response JSON was neither a list nor an object: {type(parsed)}")


async def analyze_reviews(reviews: List[ReviewInput]) -> List[ReviewAnalysis]:
    """Analyze all reviews via the Groq API, batching to keep prompts small."""
    results: List[ReviewAnalysis] = []
    batches = _chunk(reviews, BATCH_SIZE)

    async with httpx.AsyncClient() as client:
        for batch in batches:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(batch)},
            ]
            content = await _call_groq(client, messages)
            raw_items = _parse_batch_response(content)

            review_by_id = {r.id: r.review for r in batch}
            for item in raw_items:
                try:
                    review_id = int(item["id"])
                    results.append(
                        ReviewAnalysis(
                            id=review_id,
                            review=review_by_id.get(review_id, ""),
                            category=item["category"],
                            severity=item["severity"],
                            sentiment=item["sentiment"],
                            confidence_score=float(item.get("confidence_score", 0.5)),
                            business_impact=int(item.get("business_impact", 5)),
                            engineering_effort=item.get("engineering_effort", "Medium"),
                            root_cause=item.get("root_cause"),
                            suggested_engineering_task=item.get(
                                "suggested_engineering_task", "Investigate and resolve the reported issue."
                            ),
                        )
                    )
                except (KeyError, ValueError, TypeError) as exc:
                    logger.warning("Skipping malformed AI item %s: %s", item, exc)

    return results


async def generate_pm_summary(cluster_summaries: list[dict]) -> str:
    """Ask Groq for a short prose PM summary given the aggregated clusters."""
    settings = get_settings()
    if not settings.groq_api_key:
        raise ConfigurationError("GROQ_API_KEY is not configured.")

    system = (
        "You are a senior Product Manager writing a crisp executive summary "
        "of customer feedback analysis for engineering leadership. Write 3-6 "
        "sentences in plain prose (no markdown headers, no bullet lists). "
        "Mention the most urgent issues by name, the most requested feature, "
        "and any notable sentiment trend."
    )
    user = (
        "Here is the aggregated cluster data (issue name, category, severity, "
        "frequency, sentiment):\n\n" + json.dumps(cluster_summaries, ensure_ascii=False)
    )

    async with httpx.AsyncClient() as client:
        content = await _call_groq(
            client,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )
    return content.strip()


async def generate_engineering_tasks(cluster_summaries: list[dict]) -> list[dict]:
    """Ask Groq to turn the top clusters into engineering-ready tasks."""
    settings = get_settings()
    if not settings.groq_api_key:
        raise ConfigurationError("GROQ_API_KEY is not configured.")

    system = """You convert customer feedback clusters into engineering-ready
tickets. Respond with ONLY a JSON array (no markdown fences). Each element
must have exactly these keys:
- "title": short imperative title
- "description": 1-3 sentence description of the problem and desired outcome
- "acceptance_criteria": array of 2-5 short strings, each a testable
  acceptance criterion
- "priority": one of "Critical", "High", "Medium", "Low"
- "labels": array of 1-4 short lowercase kebab-case labels
- "story_points": integer from the Fibonacci-like set 1, 2, 3, 5, 8, 13
"""
    user = "Aggregated clusters:\n\n" + json.dumps(cluster_summaries, ensure_ascii=False)

    async with httpx.AsyncClient() as client:
        content = await _call_groq(
            client,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )
    return _parse_batch_response(content)
