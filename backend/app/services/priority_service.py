"""
Deterministic priority scoring for issue clusters.

priority_score (0-100) is a weighted combination of:
  - severity        (35%)
  - business_impact (25%)
  - frequency       (20%, normalized against the largest cluster)
  - sentiment       (10%, negative sentiment raises priority)
  - confidence      (10%, low-confidence classifications are discounted)
"""
from typing import List

from app.models.schemas import IssueCluster

SEVERITY_SCORE = {"Critical": 100, "High": 75, "Medium": 45, "Low": 15}
SENTIMENT_SCORE = {"Negative": 100, "Neutral": 50, "Positive": 20}

WEIGHT_SEVERITY = 0.35
WEIGHT_BUSINESS_IMPACT = 0.25
WEIGHT_FREQUENCY = 0.20
WEIGHT_SENTIMENT = 0.10
WEIGHT_CONFIDENCE = 0.10


def score_clusters(clusters: List[IssueCluster]) -> List[IssueCluster]:
    if not clusters:
        return clusters

    max_frequency = max(c.frequency for c in clusters) or 1

    for cluster in clusters:
        severity_component = SEVERITY_SCORE[cluster.severity.value]
        business_component = cluster.business_impact * 10  # 1-10 -> 10-100
        frequency_component = (cluster.frequency / max_frequency) * 100
        sentiment_component = SENTIMENT_SCORE[cluster.sentiment.value]
        confidence_component = cluster.confidence_score * 100

        score = (
            severity_component * WEIGHT_SEVERITY
            + business_component * WEIGHT_BUSINESS_IMPACT
            + frequency_component * WEIGHT_FREQUENCY
            + sentiment_component * WEIGHT_SENTIMENT
            + confidence_component * WEIGHT_CONFIDENCE
        )
        cluster.priority_score = round(score, 1)

    clusters.sort(key=lambda c: c.priority_score, reverse=True)
    return clusters
