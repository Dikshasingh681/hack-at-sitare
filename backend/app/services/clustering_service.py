"""
Groups similar review analyses into issue clusters (e.g. "App crashes",
"Application closes", "Force stop" -> one "Application Crash" cluster).

Uses a lightweight local text-similarity approach (difflib) scoped within
each category, so we don't need an extra AI round-trip just to cluster.
"""
import re
import uuid
from difflib import SequenceMatcher
from typing import List

from app.models.schemas import IssueCluster, ReviewAnalysis

SIMILARITY_THRESHOLD = 0.42

STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on",
    "and", "or", "it", "this", "that", "i", "my", "me", "for", "with",
    "app", "when", "while", "please", "would", "could", "be", "very",
}


def _normalize(text: str) -> str:
    words = re.findall(r"[a-zA-Z]+", text.lower())
    return " ".join(w for w in words if w not in STOPWORDS)


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def _pick_cluster_name(members: List[ReviewAnalysis]) -> str:
    """Use the shortest, most representative review text as the cluster label,
    falling back to the category name."""
    candidates = sorted(members, key=lambda m: len(m.review))
    label = candidates[0].review.strip()
    if len(label) > 60:
        label = label[:57].rsplit(" ", 1)[0] + "..."
    return label or members[0].category.value


def cluster_reviews(analyses: List[ReviewAnalysis]) -> List[IssueCluster]:
    # Group first by category so unrelated issues never merge.
    by_category: dict[str, List[ReviewAnalysis]] = {}
    for analysis in analyses:
        by_category.setdefault(analysis.category.value, []).append(analysis)

    clusters: List[List[ReviewAnalysis]] = []

    for _, items in by_category.items():
        normalized = [(item, _normalize(item.review)) for item in items]
        assigned = [False] * len(normalized)

        for i in range(len(normalized)):
            if assigned[i]:
                continue
            group = [normalized[i][0]]
            assigned[i] = True
            for j in range(i + 1, len(normalized)):
                if assigned[j]:
                    continue
                if _similarity(normalized[i][1], normalized[j][1]) >= SIMILARITY_THRESHOLD:
                    group.append(normalized[j][0])
                    assigned[j] = True
            clusters.append(group)

    severity_rank = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    effort_rank = {"Small": 1, "Medium": 2, "Large": 3, "Extra Large": 4}
    rank_to_effort = {v: k for k, v in effort_rank.items()}

    issue_clusters: List[IssueCluster] = []
    for group in clusters:
        worst_severity = max(group, key=lambda m: severity_rank[m.severity.value]).severity
        avg_confidence = sum(m.confidence_score for m in group) / len(group)
        avg_business_impact = round(sum(m.business_impact for m in group) / len(group))
        avg_effort_rank = round(sum(effort_rank[m.engineering_effort.value] for m in group) / len(group))
        # Most common sentiment in the group
        sentiment_counts: dict[str, int] = {}
        for m in group:
            sentiment_counts[m.sentiment.value] = sentiment_counts.get(m.sentiment.value, 0) + 1
        dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)

        representative = max(group, key=lambda m: severity_rank[m.severity.value])

        issue_clusters.append(
            IssueCluster(
                cluster_id=str(uuid.uuid4())[:8],
                issue=_pick_cluster_name(group),
                category=group[0].category,
                severity=worst_severity,
                sentiment=dominant_sentiment,
                frequency=len(group),
                priority_score=0.0,  # filled in by priority_service
                business_impact=avg_business_impact,
                engineering_effort=rank_to_effort[max(1, min(4, avg_effort_rank))],
                confidence_score=round(avg_confidence, 2),
                root_cause=representative.root_cause,
                suggested_engineering_task=representative.suggested_engineering_task,
                member_review_ids=[m.id for m in group],
            )
        )

    # Largest clusters first by default
    issue_clusters.sort(key=lambda c: c.frequency, reverse=True)
    return issue_clusters
