"""
Pydantic models shared across the API: request payloads, AI response shapes,
and the final structured response returned to the frontend.
"""
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Category(str, Enum):
    BUG = "Bug"
    FEATURE_REQUEST = "Feature Request"
    PERFORMANCE = "Performance"
    UI_UX = "UI/UX"
    SECURITY = "Security"
    AUTHENTICATION = "Authentication"
    PAYMENTS = "Payments"
    NOTIFICATIONS = "Notifications"
    OTHER = "Other"


class Severity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Sentiment(str, Enum):
    POSITIVE = "Positive"
    NEUTRAL = "Neutral"
    NEGATIVE = "Negative"


class EngineeringEffort(str, Enum):
    SMALL = "Small"
    MEDIUM = "Medium"
    LARGE = "Large"
    EXTRA_LARGE = "Extra Large"


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

class ReviewInput(BaseModel):
    id: int
    review: str = Field(..., min_length=1)


class AnalyzeRequest(BaseModel):
    reviews: List[ReviewInput]


# ---------------------------------------------------------------------------
# Per-review AI analysis
# ---------------------------------------------------------------------------

class ReviewAnalysis(BaseModel):
    id: int
    review: str
    category: Category
    severity: Severity
    sentiment: Sentiment
    confidence_score: float = Field(..., ge=0, le=1)
    business_impact: int = Field(..., ge=1, le=10)
    engineering_effort: EngineeringEffort
    root_cause: Optional[str] = None
    suggested_engineering_task: str


# ---------------------------------------------------------------------------
# Clustering
# ---------------------------------------------------------------------------

class IssueCluster(BaseModel):
    cluster_id: str
    issue: str
    category: Category
    severity: Severity
    sentiment: Sentiment
    frequency: int
    priority_score: float
    business_impact: int
    engineering_effort: EngineeringEffort
    confidence_score: float
    root_cause: Optional[str] = None
    suggested_engineering_task: str
    member_review_ids: List[int]


# ---------------------------------------------------------------------------
# Engineering tasks
# ---------------------------------------------------------------------------

class EngineeringTask(BaseModel):
    title: str
    description: str
    acceptance_criteria: List[str]
    priority: Severity
    labels: List[str]
    story_points: int


# ---------------------------------------------------------------------------
# Summary stats
# ---------------------------------------------------------------------------

class SummaryStats(BaseModel):
    total_reviews: int
    critical_issues: int
    high_priority: int
    bugs: int
    feature_requests: int
    performance_issues: int


class DistributionEntry(BaseModel):
    label: str
    value: int


class ChartData(BaseModel):
    category_distribution: List[DistributionEntry]
    severity_distribution: List[DistributionEntry]
    sentiment_distribution: List[DistributionEntry]
    priority_distribution: List[DistributionEntry]


# ---------------------------------------------------------------------------
# Final response
# ---------------------------------------------------------------------------

class AnalyzeResponse(BaseModel):
    stats: SummaryStats
    charts: ChartData
    clusters: List[IssueCluster]
    reviews: List[ReviewAnalysis]
    engineering_tasks: List[EngineeringTask]
    pm_summary: str
    prd_markdown: str


class ExportRequest(BaseModel):
    """Payload sent back to export endpoints - the already-computed analysis."""
    analysis: AnalyzeResponse
