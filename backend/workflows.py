from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os
import json
import uuid
import httpx
from schemas import GSTPrepOutput, LegalNoticeOutput, BusinessSetupOutput

router = APIRouter(
    prefix="/api/v1/workflows",
    tags=["Agentic Workflows"]
)

# Local database file fallback path
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "workflows_db.json")

# Attempt Firestore client initialization
db_client = None
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app()
    db_client = firestore.client()
    print("workflows.py: Firestore client successfully initialized.")
except Exception as e:
    print(f"workflows.py: Firestore initialization bypassed/failed ({e}). Using local JSON fallback.")

# Help functions for database management
def load_workflows_from_json() -> dict:
    if not os.path.exists(DB_FILE):
        return {}
    try:
        with open(DB_FILE, "r") as f:
            data = json.load(f)
            return data.get("workflows", {})
    except Exception as e:
        print(f"Error reading local workflows DB: {e}")
        return {}

def save_workflows_to_json(workflows: dict):
    try:
        with open(DB_FILE, "w") as f:
            json.dump({"workflows": workflows}, f, indent=2)
    except Exception as e:
        print(f"Error saving local workflows DB: {e}")

# Pydantic Schemas for state machines
class WorkflowState(BaseModel):
    workflow_id: str = Field(..., description="Unique ID for this workflow instance.")
    user_id: str = Field(..., description="ID of the user who owns this workflow.")
    workflow_type: str = Field(..., description="Type of workflow: 'gst_prep', 'legal_notice', or 'business_setup'.")
    current_step: int = Field(1, description="1-indexed current step.")
    total_steps: int = Field(..., description="Total number of steps in the workflow.")
    status: str = Field("active", description="Status of the workflow: active, completed, or failed.")
    steps_completed: List[bool] = Field(..., description="Boolean list tracking completion of each step (0-indexed).")
    data: Dict[str, Any] = Field(default_factory=dict, description="Custom state data payload for this workflow.")
    created_at: str = Field(..., description="ISO timestamp of creation.")
    updated_at: str = Field(..., description="ISO timestamp of last update.")

class StartWorkflowRequest(BaseModel):
    user_id: str
    workflow_type: str  # "gst_prep", "legal_notice", "business_setup"
    initial_data: Optional[Dict[str, Any]] = None

class UpdateStepRequest(BaseModel):
    step_index: int  # 0-indexed step index
    completed: bool
    step_data: Optional[Dict[str, Any]] = None

class LegalNoticeInput(BaseModel):
    sender_name: str
    recipient_name: str
    recipient_address: str
    dispute_reason: str
    dispute_amount: float
    incident_date: str

class GSTPrepInput(BaseModel):
    sales_records: List[Dict[str, Any]]
    entity_name: Optional[str] = "Acme Legal Tech Pvt Ltd"
    period: Optional[str] = "July 2026"

# LLM Gateway Integrations (Unified AWS Bedrock Engine)
async def call_ai_gateway(prompt: str, system_prompt: str = "You are a professional legal compliance assistant.") -> str:
    """Invokes unified AWS Bedrock Foundation Models (Claude 3.5 Sonnet / Nova Pro / Llama 3.3)."""
    try:
        from aws_bedrock import invoke_aws_chat, AwsChatRequest
        req = AwsChatRequest(
            model=os.getenv("VITE_AWS_MODEL", "anthropic.claude-3-5-sonnet-20241022-v2:0"),
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        res = await invoke_aws_chat(req)
        if isinstance(res, dict):
            return res.get("content", "")
        return ""
    except Exception as e:
        print(f"Workflows: AWS Bedrock call error: {e}")
        return ""

# Helper to save state either in Firestore or locally
def persist_state(workflow_id: str, state_dict: Dict[str, Any]):
    if db_client:
        try:
            db_client.collection("workflows").document(workflow_id).set(state_dict)
            return
        except Exception as e:
            print(f"Firestore save error: {e}. Falling back to local.")
    
    # Fallback to local JSON
    all_wf = load_workflows_from_json()
    all_wf[workflow_id] = state_dict
    save_workflows_to_json(all_wf)

# Helper to load state
def fetch_state(workflow_id: str) -> Optional[Dict[str, Any]]:
    if db_client:
        try:
            doc = db_client.collection("workflows").document(workflow_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            print(f"Firestore get error: {e}. Falling back to local.")
            
    all_wf = load_workflows_from_json()
    return all_wf.get(workflow_id)

# Helper to get all workflows
def fetch_all_states(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    results = []
    if db_client:
        try:
            query = db_client.collection("workflows")
            if user_id:
                query = query.where("user_id", "==", user_id)
            docs = query.stream()
            results = [doc.to_dict() for doc in docs]
            if len(results) > 0:
                return results
        except Exception as e:
            print(f"Firestore query error: {e}. Falling back to local.")
            
    all_wf = load_workflows_from_json()
    for wf in all_wf.values():
        if not user_id or wf.get("user_id") == user_id:
            results.append(wf)
    return results

# Endpoints
@router.post("/start", response_model=WorkflowState)
def start_workflow(req: StartWorkflowRequest):
    """Starts a new multi-step compliance state machine workflow."""
    wf_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()
    
    if req.workflow_type == "gst_prep":
        total_steps = 4
    elif req.workflow_type == "legal_notice":
        total_steps = 4
    elif req.workflow_type == "business_setup":
        total_steps = 15
    else:
        raise HTTPException(status_code=400, detail="Invalid workflow type. Choose: gst_prep, legal_notice, or business_setup")

    state = WorkflowState(
        workflow_id=wf_id,
        user_id=req.user_id,
        workflow_type=req.workflow_type,
        current_step=1,
        total_steps=total_steps,
        status="active",
        steps_completed=[False] * total_steps,
        data=req.initial_data or {},
        created_at=now_str,
        updated_at=now_str
    )
    
    persist_state(wf_id, state.model_dump())
    return state

@router.get("/list", response_model=List[WorkflowState])
def list_workflows(user_id: Optional[str] = None):
    """Retrieves all workflows, optionally filtered by user ID."""
    states_dict = fetch_all_states(user_id)
    return [WorkflowState(**wf) for wf in states_dict]

@router.get("/{workflow_id}", response_model=WorkflowState)
def get_workflow(workflow_id: str):
    """Gets the state of a specific workflow."""
    state_dict = fetch_state(workflow_id)
    if not state_dict:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowState(**state_dict)

@router.post("/{workflow_id}/update-step", response_model=WorkflowState)
def update_workflow_step(workflow_id: str, req: UpdateStepRequest):
    """Updates progress status of a workflow step."""
    state_dict = fetch_state(workflow_id)
    if not state_dict:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    state = WorkflowState(**state_dict)
    
    if req.step_index < 0 or req.step_index >= state.total_steps:
        raise HTTPException(status_code=400, detail=f"Step index out of range. Range: 0-{state.total_steps-1}")
        
    state.steps_completed[req.step_index] = req.completed
    
    # Recalculate current active step: first uncompleted step (1-indexed) or total_steps if all completed
    current = 1
    for idx, comp in enumerate(state.steps_completed):
        if not comp:
            current = idx + 1
            break
    else:
        current = state.total_steps
        state.status = "completed"
        
    state.current_step = current
    
    # Merge new step data payload
    if req.step_data:
        state.data = {**state.data, **req.step_data}
        
    state.updated_at = datetime.utcnow().isoformat()
    
    persist_state(workflow_id, state.model_dump())
    return state

@router.post("/{workflow_id}/delete")
def delete_workflow(workflow_id: str):
    """Deletes a workflow from the state store."""
    if db_client:
        try:
            db_client.collection("workflows").document(workflow_id).delete()
        except Exception as e:
            print(f"Firestore delete error: {e}")
            
    all_wf = load_workflows_from_json()
    if workflow_id in all_wf:
        del all_wf[workflow_id]
        save_workflows_to_json(all_wf)
        
    return {"status": "success", "message": "Workflow deleted successfully"}

# Workflow Action: GST Preparation AI & calculation
@router.post("/gst-prep-calculate", response_model=GSTPrepOutput)
async def calculate_gst_draft(input_data: GSTPrepInput):
    """
    Examines sales records, groups by HSN, calculates taxes, 
    and uses LLM or templates to produce GSTR drafts.
    """
    total_taxable_value = 0.0
    tax_liability = 0.0
    cgst_total = 0.0
    sgst_total = 0.0
    igst_total = 0.0
    
    hsn_counts = {}
    hsn_sales = {}
    
    for idx, record in enumerate(input_data.sales_records):
        amount = float(record.get("amount", 0.0))
        rate = float(record.get("tax_rate", 18.0)) / 100.0
        hsn = str(record.get("hsn_code", "9983")) # Default services HSN
        is_interstate = bool(record.get("interstate", False))
        
        total_taxable_value += amount
        tax_calc = amount * rate
        tax_liability += tax_calc
        
        if is_interstate:
            igst_total += tax_calc
        else:
            cgst_total += tax_calc / 2
            sgst_total += tax_calc / 2
            
        hsn_counts[hsn] = hsn_counts.get(hsn, 0) + 1
        hsn_sales[hsn] = hsn_sales.get(hsn, 0.0) + amount

    hsn_cat_summary = {hsn: f"{hsn_counts[hsn]} invoices, Sales: INR {hsn_sales[hsn]:.2f}" for hsn in hsn_sales}
    
    # Draft a report with LLM or fallback
    prompt = f"""
    Generate a professional GSTR Return Preparation Summary report for:
    - Entity Name: {input_data.entity_name}
    - Filing Period: {input_data.period}
    - Total Invoiced Sales: INR {total_taxable_value:.2f}
    - Calculated GST Tax Liability: INR {tax_liability:.2f} (CGST: INR {cgst_total:.2f}, SGST: INR {sgst_total:.2f}, IGST: INR {igst_total:.2f})
    - HSN Breakdown: {json.dumps(hsn_cat_summary)}
    - Details of sales: {json.dumps(input_data.sales_records[:5])}
    
    Format it as a clean compliance report with sections: 'Tax Liability Breakdown', 'HSN Mapping Details', and 'Portal Filing Directions (GST Portal filing instructions)'.
    """
    
    system_prompt = "You are a professional Chartered Accountant compliance assistant specializing in Indian GST filings (GSTR-1 and GSTR-3B)."
    ai_draft = await call_ai_gateway(prompt, system_prompt)
    
    if not ai_draft:
        # Fallback template
        ai_draft = f"""# GSTR Draft Return Summary Report
        
## 📌 Filing Overview
- **Filing Entity**: {input_data.entity_name}
- **Filing Period**: {input_data.period}
- **Tax Filing System**: CGST/SGST/IGST Dual Compliance Structure

## 💰 1. Tax Liability Breakdown
- **Gross Taxable Supplies (Outward)**: INR {total_taxable_value:,.2f}
- **Central Tax (CGST)**: INR {cgst_total:,.2f}
- **State/UT Tax (SGST)**: INR {sgst_total:,.2f}
- **Integrated Tax (IGST)**: INR {igst_total:,.2f}
- **Total Output GST Liability**: INR {tax_liability:,.2f}

## 🏷️ 2. HSN/SAC Classification Summary
{chr(10).join([f'- **HSN {hsn}**: {summary}' for hsn, summary in hsn_cat_summary.items()])}

## ⚡ 3. Portal Filing Directions
1. **GSTR-1 Outward Filings**: Upload all invoices matching the HSN groups above. Validate that the B2B and B2C segments align with the GST portal.
2. **GSTR-3B Tax Settlement**: Prior to paying the liability of INR {tax_liability:,.2f}, execute an ITC (Input Tax Credit) reconciliation against Form GSTR-2B. Offset the liability using available credit, and pay the remaining balance online via GSTR-3B challan by the 20th of the month.
"""

    return GSTPrepOutput(
        sales_data_summary={
            "total_sales_taxable": total_taxable_value,
            "cgst": cgst_total,
            "sgst": sgst_total,
            "igst": igst_total,
            "total_records": len(input_data.sales_records)
        },
        hsn_categorization=hsn_cat_summary,
        gstr_summary_draft=ai_draft,
        tax_liability_estimate=tax_liability
    )

# Workflow Action: Legal Notice Draft Generator
@router.post("/generate-notice-draft", response_model=LegalNoticeOutput)
async def generate_notice_draft(input_data: LegalNoticeInput):
    """
    Takes dispute details and utilizes LLM (or templates) to draft a professional 
    Notice under Indian laws, setting a 30-day response deadline.
    """
    # Decide appropriate legal act depending on reason
    reason_lower = input_data.dispute_reason.lower()
    statute_cite = "Section 55 & 73 of the Indian Contract Act, 1872"
    if "check" in reason_lower or "cheque" in reason_lower or "bounce" in reason_lower:
        statute_cite = "Section 138 of the Negotiable Instruments Act, 1881"
    elif "tenant" in reason_lower or "rent" in reason_lower or "landlord" in reason_lower:
        statute_cite = "Section 106 of the Transfer of Property Act, 1882"
    elif "defamation" in reason_lower or "reputation" in reason_lower:
        statute_cite = "Section 499 & 500 of the Indian Penal Code, 1860 / Civil Tort of Defamation"

    prompt = f"""
    Draft a formal, professional Legal Notice under Indian Law from a lawyer on behalf of the Sender client to the Recipient.
    
    Details:
    - Sender (My Client): {input_data.sender_name}
    - Recipient: {input_data.recipient_name}
    - Recipient Address: {input_data.recipient_address}
    - Dispute Reason: {input_data.dispute_reason}
    - Dispute Amount: INR {input_data.dispute_amount:.2f}
    - Incident Date: {input_data.incident_date}
    - Applicable Law: {statute_cite}
    
    The notice should command the recipient to pay the dispute amount of INR {input_data.dispute_amount:.2f} or resolve the issue within 30 days of receipt, failing which legal proceedings will be initiated.
    Include standard lawyer signature placeholder and format.
    """
    
    system_prompt = "You are a senior legal advocate representing corporate and civil disputes in Indian courts. Write in formal, precise, and authoritative legal draft format."
    draft_text = await call_ai_gateway(prompt, system_prompt)
    
    if not draft_text:
        draft_text = f"""LEGAL NOTICE
(BY REGISTERED POST A.D. / SPEED POST)

Date: {datetime.now().strftime('%B %d, %Y')}

To,
{input_data.recipient_name}
{input_data.recipient_address}

SUBJECT: LEGAL NOTICE FOR RECOVERY OF INR {input_data.dispute_amount:,.2f} DUE TO {input_data.dispute_reason.upper()}

Dear Sir/Madam,

Under instructions from and on behalf of my client, {input_data.sender_name}, I hereby serve you with the following Legal Notice:

1. That my client is a law-abiding citizen/entity engaged in business operations. You and my client entered into a mutual transaction/agreement regarding which an incident/dispute occurred on or about {input_data.incident_date}.

2. That pursuant to the transaction, you were legally obligated to perform services/make payments. However, you have failed to comply, leaving an outstanding balance of INR {input_data.dispute_amount:,.2f} representing a clear breach of terms under {statute_cite}.

3. That despite repeated telephonic reminders and written requests, you have deliberately avoided payments, causing wrongful loss to my client and wrongful gain to yourself.

4. You are hereby called upon to pay/resolve the outstanding sum of INR {input_data.dispute_amount:,.2f} along with interest at 18% per annum from the due date within 30 days of the receipt of this legal notice.

5. Please note that if you fail to comply with this notice within the stipulated 30 days, my client has given me absolute instructions to file appropriate civil recovery suits and initiate criminal prosecutions against you in the court of competent jurisdiction entirely at your cost and risk.

Yours faithfully,

[Advocate Signature Placeholder]
Advocate, Supreme Court of India
(Representing {input_data.sender_name})
"""

    return LegalNoticeOutput(
        dispute_summary=f"Notice issued to {input_data.recipient_name} for {input_data.dispute_reason} involving INR {input_data.dispute_amount:.2f}.",
        draft_notice=draft_text,
        response_deadline_days=30,
        next_steps=[
            "Dispatch notice via Speed Post or Registered Post AD.",
            "Save dispatch slip & tracking report to the Vault.",
            "Wait for 30-day response window (monitored in Case Tracker).",
            "If unpaid/unresolved by day 30, consult a lawyer to draft a court petition."
        ]
    )

# Workflow Action: Business Setup Steps Customizer
class BusinessSetupRequest(BaseModel):
    business_type: str  # "pvt_ltd" | "llp" | "proprietorship" | "partnership"
    proposed_name: str
    directors_count: int
    state: str

@router.post("/business-setup-plan", response_model=BusinessSetupOutput)
async def generate_business_setup(input_data: BusinessSetupRequest):
    """
    Returns custom incorporation steps, timeline, and document checklists 
    based on the target corporate entity structure.
    """
    b_type = input_data.business_type.lower()
    
    # Setup standard metadata based on entity type
    if b_type == "pvt_ltd":
        b_label = "Private Limited Company (Pvt Ltd)"
        steps = [
            "Acquire Digital Signature Certificates (DSC) for all Directors",
            "Check Proposed Company Name Availability on MCA (Ministry of Corporate Affairs) Portal",
            "Apply for Director Identification Numbers (DIN) via SPICe+ Part A",
            "Submit SPICe+ Part A Form for Name Approval",
            "Draft Memorandum of Association (MOA) (Form INC-33) & Articles of Association (AOA) (Form INC-34)",
            "Submit SPICe+ Part B Incorporation Form along with AGILE-PRO-S (for GSTIN, EPFO, ESIC, Bank A/c)",
            "Pay MCA stamp duties and incorporation filing fees online",
            "Obtain Certificate of Incorporation (COI) issued by RoC (Registrar of Companies)",
            "Download Permanent Account Number (PAN) and TAN allocated by NSDL",
            "Open Corporate Current Bank Account using COI, Board Resolution, and PAN",
            "Appoint first Auditors within 30 days of incorporation",
            "Complete GSTIN Registration (if turnover exceeds INR 20L/40L or doing inter-state sales)",
            "Verify EPFO (PF) & ESIC active registrations for employee welfare",
            "Apply for Professional Tax (PT) registration under state commercial tax department",
            "File Commencement of Business Certificate (Form INC-20A) with MCA within 180 days"
        ]
        docs = [
            "PAN Card and Aadhaar/Passport of all directors",
            "Utility Bill (Electricity/Water/Gas) of the registered office (not older than 2 months)",
            "NOC (No Objection Certificate) from the property owner for registered office usage",
            "Rent Agreement of registered office (if rented)",
            "Passport size photos and DSC tokens of all directors",
            "Specimen signatures of directors (Form INC-10)"
        ]
        timeline = 3  # weeks
    elif b_type == "llp":
        b_label = "Limited Liability Partnership (LLP)"
        steps = [
            "Acquire Digital Signature Certificates (DSC) for all Designated Partners",
            "Check Proposed Name Availability on MCA Portal & Submit RUN-LLP (Reserve Unique Name)",
            "Draft Limited Liability Partnership (LLP) Agreement containing rights & duties",
            "File FiLLiP Form for LLP Incorporation with RoC",
            "Pay stamp duty on incorporation & file LLP Agreement (Form-3) within 30 days",
            "Obtain Certificate of Incorporation (COI) from Registrar of Companies",
            "Apply and receive LLP PAN and TAN cards",
            "Open Current Bank Account in the name of the LLP",
            "Register for GSTIN if undertaking taxable supplies",
            "Register for Professional Tax (PT) in states where applicable",
            "Setup compliance register for annual filing of Form-8 (Accounts) and Form-11 (Annual Return)"
        ]
        # LLP has 11 primary steps, we add 4 administrative steps to make it a full compliance roadmap of 15 steps
        steps.extend([
            "Obtain Shops & Establishment Act license for offices",
            "Register for MSME / Udyam Certificate to get credit benefits",
            "Draft internal partnership compliance guidelines",
            "Activate EPFO / ESIC accounts if hiring more than 10-20 workers"
        ])
        docs = [
            "PAN & Aadhaar of all Partners",
            "Proof of Registered Office Address (Electricity bill, Rent deed, Landlord NOC)",
            "LLP Agreement drafted on stamp paper",
            "Digital Signatures of designated partners"
        ]
        timeline = 2  # weeks
    else:
        b_label = "Sole Proprietorship / Partnership Firm"
        steps = [
            "Draft Partnership Deed on Stamp Paper (if Partnership firm)",
            "Register Partnership Deed with Registrar of Firms (Optional but recommended)",
            "Apply for Owner / Partners PAN Card",
            "Obtain MSME Registration / Udyam Certificate to establish entity existence",
            "Apply for Shops and Establishment Act License in the respective municipality",
            "Apply for GSTIN Registration (compulsory for inter-state business or >20L sales)",
            "Obtain IEC (Import Export Code) if planning international trade",
            "Open Current Bank Account using Udyam and Shop license as identity proof",
            "Obtain Professional Tax (PT) Registration for the firm",
            "Register for Trademark (highly recommended to protect brand name)",
            "Register under EPFO if hiring more than 20 employees",
            "Register under ESIC if hiring more than 10 employees",
            "Establish accounts ledger & tax accounting systems",
            "Draft standard customer contracts and terms of services",
            "File annual Income Tax returns under Form ITR-3 or ITR-4 (Presumptive taxation)"
        ]
        docs = [
            "PAN Card & Aadhaar Card of Owner/Partners",
            "Utility Bill of office premises + Owner NOC",
            "Partnership Deed (signed & stamped)",
            "MSME / Udyam certificate copy",
            "Current Bank Account statement copy"
        ]
        timeline = 2  # weeks

    # Trigger custom AI enrichment if LLM is online
    prompt = f"""
    Provide structural incorporation context for establishing a '{b_label}' named '{input_data.proposed_name}' in '{input_data.state}' with {input_data.directors_count} directors/partners.
    Write a brief advisory on state-specific taxes (such as Professional Tax or stamp duties in {input_data.state}) and standard regulatory compliance timeline. Keep it under 200 words.
    """
    system_prompt = "You are a corporate legal counsel advising startup founders on company incorporation steps in India."
    advisory = await call_ai_gateway(prompt, system_prompt)
    if advisory:
        steps.append(f"State-Specific Advisory ({input_data.state}): {advisory}")
        # Keep steps to 15 max by trimming if needed, or keeping it as step 15
        if len(steps) > 15:
            steps = steps[:14] + [f"Advisory: {advisory}"]

    return BusinessSetupOutput(
        business_type=b_label,
        incorporation_steps=steps[:15],  # Enforce exactly 15 steps
        required_documents=docs,
        estimated_timeline_weeks=timeline
    )
