"""
POST /analyze - the main pipeline endpoint.

Flow:
  1. Validate input reviews.
  2. Call Groq to classify each review.
  3. Cluster similar reviews into issues.
  4. Score clusters with the priority formula.
  5. Ask Groq for a PM summary and engineering tasks based on the clusters.
  6. Build chart-ready stats and a PRD.
  7. Return the full structured response.
"""
from fastapi import APIRouter, HTTPException

from app.core.exceptions import CursorPMError
from app.core.logging import get_logger
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EngineeringTask,
)
from app.services import ai_service
from app.services.aggregation_service import build_charts, build_stats
from app.services.clustering_service import cluster_reviews
from app.services.prd_service import build_prd_markdown
from app.services.priority_service import score_clusters

logger = get_logger(__name__)

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_feedback(payload: AnalyzeRequest) -> AnalyzeResponse:
    if not payload.reviews:
        raise HTTPException(status_code=422, detail="At least one review is required.")

    try:
        logger.info("Analyzing %d reviews", len(payload.reviews))
        review_analyses = await ai_service.analyze_reviews(payload.reviews)

        if not review_analyses:
            raise HTTPException(status_code=502, detail="The AI provider returned no usable analysis.")

        clusters = cluster_reviews(review_analyses)
        clusters = score_clusters(clusters)

        cluster_summaries_for_ai = [
            {
                "issue": c.issue,
                "category": c.category.value,
                "severity": c.severity.value,
                "sentiment": c.sentiment.value,
                "frequency": c.frequency,
                "priority_score": c.priority_score,
                "root_cause": c.root_cause,
            }
            for c in clusters[:15]
        ]

        pm_summary = await ai_service.generate_pm_summary(cluster_summaries_for_ai)
        raw_tasks = await ai_service.generate_engineering_tasks(cluster_summaries_for_ai)

        engineering_tasks: list[EngineeringTask] = []
        for raw in raw_tasks:
            try:
                engineering_tasks.append(
                    EngineeringTask(
                        title=raw["title"],
                        description=raw["description"],
                        acceptance_criteria=raw.get("acceptance_criteria", []),
                        priority=raw.get("priority", "Medium"),
                        labels=raw.get("labels", []),
                        story_points=int(raw.get("story_points", 3)),
                    )
                )
            except (KeyError, ValueError, TypeError) as exc:
                logger.warning("Skipping malformed engineering task %s: %s", raw, exc)

        stats = build_stats(review_analyses)
        charts = build_charts(review_analyses, clusters)
        prd_markdown = build_prd_markdown(stats, clusters, engineering_tasks, pm_summary)

        return AnalyzeResponse(
            stats=stats,
            charts=charts,
            clusters=clusters,
            reviews=review_analyses,
            engineering_tasks=engineering_tasks,
            pm_summary=pm_summary,
            prd_markdown=prd_markdown,
        )

    except CursorPMError as exc:
        logger.error("Analysis pipeline error: %s", exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
