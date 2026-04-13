"""PDF report generation endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_db
from app.schemas.pdf_report import ExecReportRequest, PortfolioReportRequest
from app.services.pdf_export import PDFExportService

router = APIRouter(tags=["reports-pdf"])


@router.post(
    "/projects/{project_id}/reports-pdf/executive",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Executive PDF report",
        }
    },
)
async def generate_executive_report(
    project_id: UUID,
    body: ExecReportRequest | None = None,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> Response:
    """Generate an executive PDF report for a project.

    Returns a PDF file with RAG status, EVM metrics, AI-generated
    summary, risk highlights, and milestone forecasts.
    """
    period = body.period if body else "week"
    service = PDFExportService(session)
    pdf_bytes = await service.generate_exec_report(project_id, period)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="exec-report-{project_id}.pdf"'
            ),
        },
    )


@router.get(
    "/projects/{project_id}/reports-pdf/executive/preview",
    response_class=HTMLResponse,
)
async def preview_executive_report(
    project_id: UUID,
    period: str = "week",
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> HTMLResponse:
    """Return the executive report as HTML for browser preview."""
    service = PDFExportService(session)
    html = await service.get_report_html(project_id, period)
    return HTMLResponse(content=html)


@router.post(
    "/workspaces/{workspace_id}/reports-pdf/portfolio",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Portfolio PDF report",
        }
    },
)
async def generate_portfolio_report(
    workspace_id: UUID,
    body: PortfolioReportRequest | None = None,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> Response:
    """Generate a multi-project portfolio PDF for a workspace.

    Returns a PDF with project cards showing RAG status,
    completion percentage, forecast dates, and top risks.
    """
    service = PDFExportService(session)
    pdf_bytes = await service.generate_portfolio_report(workspace_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="portfolio-report-{workspace_id}.pdf"'
            ),
        },
    )
