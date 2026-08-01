"""
Export endpoints. The frontend already has the full AnalyzeResponse in
memory after calling /analyze, so it POSTs that same payload here and
receives back the requested file format as a binary download.
"""
from fastapi import APIRouter
from fastapi.responses import Response

from app.models.schemas import ExportRequest
from app.services import export_service

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/json")
async def export_json(payload: ExportRequest) -> Response:
    content = export_service.build_analysis_json(payload.analysis)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="analysis.json"'},
    )


@router.post("/csv")
async def export_csv(payload: ExportRequest) -> Response:
    content = export_service.build_analysis_csv(payload.analysis)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="analysis.csv"'},
    )


@router.post("/xlsx")
async def export_xlsx(payload: ExportRequest) -> Response:
    content = export_service.build_analysis_xlsx(payload.analysis)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="analysis.xlsx"'},
    )


@router.post("/prd")
async def export_prd(payload: ExportRequest) -> Response:
    content = export_service.build_prd_markdown_bytes(payload.analysis)
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="PRD.md"'},
    )


@router.post("/tasks")
async def export_tasks(payload: ExportRequest) -> Response:
    content = export_service.build_engineering_tasks_json(payload.analysis)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="EngineeringTasks.json"'},
    )
