"""
Builds downloadable export payloads (CSV, XLSX, JSON) from an AnalyzeResponse.
"""
import io
import json

import pandas as pd

from app.models.schemas import AnalyzeResponse


def _clusters_dataframe(analysis: AnalyzeResponse) -> pd.DataFrame:
    rows = [
        {
            "Issue": c.issue,
            "Frequency": c.frequency,
            "Category": c.category.value,
            "Severity": c.severity.value,
            "Sentiment": c.sentiment.value,
            "Priority Score": c.priority_score,
            "Business Impact": c.business_impact,
            "Engineering Effort": c.engineering_effort.value,
            "Confidence": c.confidence_score,
            "Root Cause": c.root_cause or "",
            "Suggested Task": c.suggested_engineering_task,
        }
        for c in analysis.clusters
    ]
    return pd.DataFrame(rows)


def build_analysis_json(analysis: AnalyzeResponse) -> bytes:
    return analysis.model_dump_json(indent=2).encode("utf-8")


def build_analysis_csv(analysis: AnalyzeResponse) -> bytes:
    df = _clusters_dataframe(analysis)
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    return buffer.getvalue().encode("utf-8")


def build_analysis_xlsx(analysis: AnalyzeResponse) -> bytes:
    df = _clusters_dataframe(analysis)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Issues")

        stats_df = pd.DataFrame(
            [
                {"Metric": "Total Reviews", "Value": analysis.stats.total_reviews},
                {"Metric": "Critical Issues", "Value": analysis.stats.critical_issues},
                {"Metric": "High Priority", "Value": analysis.stats.high_priority},
                {"Metric": "Bugs", "Value": analysis.stats.bugs},
                {"Metric": "Feature Requests", "Value": analysis.stats.feature_requests},
                {"Metric": "Performance Issues", "Value": analysis.stats.performance_issues},
            ]
        )
        stats_df.to_excel(writer, index=False, sheet_name="Summary")

        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            for column_cells in worksheet.columns:
                length = max(len(str(cell.value)) if cell.value is not None else 0 for cell in column_cells)
                worksheet.column_dimensions[column_cells[0].column_letter].width = min(max(length + 2, 10), 60)

    return buffer.getvalue()


def build_engineering_tasks_json(analysis: AnalyzeResponse) -> bytes:
    tasks = [task.model_dump() for task in analysis.engineering_tasks]
    return json.dumps(tasks, indent=2).encode("utf-8")


def build_prd_markdown_bytes(analysis: AnalyzeResponse) -> bytes:
    return analysis.prd_markdown.encode("utf-8")
