"""
Builds the top-card stats and chart-ready distributions from the analyzed
reviews and clusters.
"""
from collections import Counter
from typing import List

from app.models.schemas import ChartData, DistributionEntry, IssueCluster, ReviewAnalysis, SummaryStats


def build_stats(analyses: List[ReviewAnalysis]) -> SummaryStats:
    return SummaryStats(
        total_reviews=len(analyses),
        critical_issues=sum(1 for a in analyses if a.severity.value == "Critical"),
        high_priority=sum(1 for a in analyses if a.severity.value in ("Critical", "High")),
        bugs=sum(1 for a in analyses if a.category.value == "Bug"),
        feature_requests=sum(1 for a in analyses if a.category.value == "Feature Request"),
        performance_issues=sum(1 for a in analyses if a.category.value == "Performance"),
    )


def _bucketize_priority(score: float) -> str:
    if score >= 75:
        return "Urgent (75-100)"
    if score >= 50:
        return "High (50-74)"
    if score >= 25:
        return "Medium (25-49)"
    return "Low (0-24)"


def build_charts(analyses: List[ReviewAnalysis], clusters: List[IssueCluster]) -> ChartData:
    category_counts = Counter(a.category.value for a in analyses)
    severity_counts = Counter(a.severity.value for a in analyses)
    sentiment_counts = Counter(a.sentiment.value for a in analyses)
    priority_counts = Counter(_bucketize_priority(c.priority_score) for c in clusters)

    priority_order = ["Urgent (75-100)", "High (50-74)", "Medium (25-49)", "Low (0-24)"]

    return ChartData(
        category_distribution=[
            DistributionEntry(label=label, value=count) for label, count in category_counts.most_common()
        ],
        severity_distribution=[
            DistributionEntry(label=label, value=severity_counts.get(label, 0))
            for label in ["Critical", "High", "Medium", "Low"]
        ],
        sentiment_distribution=[
            DistributionEntry(label=label, value=sentiment_counts.get(label, 0))
            for label in ["Positive", "Neutral", "Negative"]
        ],
        priority_distribution=[
            DistributionEntry(label=label, value=priority_counts.get(label, 0)) for label in priority_order
        ],
    )
