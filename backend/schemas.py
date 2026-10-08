from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class LegalAnalysisOutput(BaseModel):
    summary: str = Field(..., description="A brief summary of the legal analysis.")
    key_points: List[str] = Field(..., description="Key points from the legal analysis.")
    recommendations: List[str] = Field(..., description="Actionable recommendations based on the analysis.")
    risk_level: str = Field(..., description="Assessed risk level (e.g., Low, Medium, High).")

class GSTPrepOutput(BaseModel):
    sales_data_summary: Dict[str, Any] = Field(..., description="Summary of the provided sales data.")
    hsn_categorization: Dict[str, str] = Field(..., description="Categorization of items by HSN code.")
    gstr_summary_draft: str = Field(..., description="Draft summary for the GSTR return.")
    tax_liability_estimate: float = Field(..., description="Estimated tax liability.")

class LegalNoticeOutput(BaseModel):
    dispute_summary: str = Field(..., description="Summary of the dispute based on input.")
    draft_notice: str = Field(..., description="The AI-generated draft of the legal notice.")
    response_deadline_days: int = Field(30, description="Deadline for response in days.")
    next_steps: List[str] = Field(..., description="Recommended next steps after sending the notice.")

class BusinessSetupOutput(BaseModel):
    business_type: str = Field(..., description="The recommended or selected business type.")
    incorporation_steps: List[str] = Field(..., description="Step-by-step guide for incorporation.")
    required_documents: List[str] = Field(..., description="List of documents required for setup.")
    estimated_timeline_weeks: int = Field(..., description="Estimated timeline for complete setup.")
