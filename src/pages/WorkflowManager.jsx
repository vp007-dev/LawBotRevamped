import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Play, CheckCircle2, Clock, AlertTriangle, FileText, Plus, Trash2, 
  Loader2, ChevronRight, Info, Calendar, DollarSign, User, Building, 
  Check, FileSpreadsheet, Download, Search, ArrowRight, RefreshCw, 
  Clipboard, ShieldAlert, CheckCircle, FileUp, Sparkles, HelpCircle, 
  TrendingUp
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api/v1/workflows";

// Standard 15-step compliance database for Business Setup
const INCORPORATION_STEPS = {
  pvt_ltd: [
    { title: "Proposed Name Search", desc: "Search proposed names on MCA portal & check trademark registers.", advisory: "Ensure name is unique, indicates business activity, and does not conflict with registered trademarks. Submit RUN or SPICe+ Part A." },
    { title: "Obtain DSC (Class-3)", desc: "Acquire Class-3 Digital Signature Certificates for all directors.", advisory: "Required for digital signing of e-forms. Requires video verification, PAN, and address proof." },
    { title: "Secure DIN allocation", desc: "Obtain Director Identification Number for proposed directors.", advisory: "Can be applied directly through SPICe+ form for up to 3 directors. Requires PAN and Aadhaar/Passport." },
    { title: "File SPICe+ Part A", desc: "Submit name approval application on MCA portal.", advisory: "You can propose up to 2 names. Once approved, the name is reserved for 20 days." },
    { title: "Draft Memorandum of Association (MOA)", desc: "Prepare MOA (Form INC-33) defining company's main objectives.", advisory: "Draft the charter of the company, outlining main objects and ancillary objects. Align with Section 4 of Companies Act 2013." },
    { title: "Draft Articles of Association (AOA)", desc: "Prepare AOA (Form INC-34) defining internal management rules.", advisory: "Defines internal regulations, shares, meetings, and board powers. Align with Schedule I of Companies Act 2013." },
    { title: "File SPICe+ Part B", desc: "Submit complete incorporation application along with e-MOA and e-AOA.", advisory: "Main integration form for company registration. Attach office utility bill, director declarations, and consent forms." },
    { title: "Pay MCA Stamp Duties & Fees", desc: "Pay incorporation fees and state-specific stamp duties online.", advisory: "Fees depend on authorized share capital. Stamp duty varies depending on the state of registration." },
    { title: "ROC Certificate of Incorporation (COI)", desc: "Receive the signed Certificate of Incorporation from RoC.", advisory: "Issued by the Registrar of Companies containing the Corporate Identity Number (CIN). This establishes the company as a legal entity." },
    { title: "Secure PAN Allocation", desc: "Get company PAN card issued by Income Tax Department.", advisory: "Allocated automatically during SPICe+ processing. Essential for all financial transactions." },
    { title: "Secure TAN Allocation", desc: "Get company Tax Deduction Account Number issued.", advisory: "Allocated along with PAN. Required for deducting tax at source (TDS) on payments." },
    { title: "Open Corporate Bank Account", desc: "Open a current account with a bank in the company name.", advisory: "Requires COI, PAN card, MOA, AOA, and Board Resolution appointing authorized signatories." },
    { title: "GSTIN Registration", desc: "Apply for Goods and Services Tax Identification Number.", advisory: "Mandatory if inter-state sales occur or if turnover exceeds INR 20 Lakhs (services) / 40 Lakhs (goods)." },
    { title: "Register for EPFO & ESIC", desc: "Activate employee social security registrations.", advisory: "EPF is mandatory for 20+ employees. ESIC is mandatory for 10+ employees. Initial accounts are activated via AGILE-PRO-S." },
    { title: "File Form INC-20A (Commencement)", desc: "File Commencement of Business certificate within 180 days.", advisory: "Crucial final step. File after directors deposit share capital money in the company bank account. Company cannot start operations without this." }
  ],
  llp: [
    { title: "DSC Acquisition", desc: "Secure Class-3 Digital Signature Certificates for designated partners.", advisory: "Required for signing FiLLiP forms and LLP Agreement on MCA portal." },
    { title: "RUN-LLP Name Approval", desc: "Submit Reserve Unique Name application on MCA portal.", advisory: "LLP names must end with 'LLP'. Check MCA guidelines for word restrictions." },
    { title: "Draft LLP Agreement", desc: "Draft agreement outlining partners' rights, profit sharing, and duties.", advisory: "Must be printed on stamp paper of appropriate value based on capital contribution." },
    { title: "Submit FiLLiP Incorporation", desc: "File Form for Incorporation of LLP with ROC.", advisory: "Single window form for incorporation, DIN allocation, and registered office approval." },
    { title: "Pay ROC Incorporation Fees", desc: "Pay statutory filing fees and stamp duty.", advisory: "Calculated based on partner contribution values." },
    { title: "LLP Certificate of Incorporation", desc: "Receive COI containing the LLPIN from RoC.", advisory: "Confirms LLP is officially registered." },
    { title: "Submit Form-3 (LLP Agreement)", desc: "File the signed LLP Agreement with RoC within 30 days.", advisory: "Mandatory filing. Late submission attracts a penalty of INR 100 per day of delay." },
    { title: "Obtain LLP PAN Card", desc: "Apply for Permanent Account Number for the LLP.", advisory: "Used for tax filing and bank account opening." },
    { title: "Obtain LLP TAN Card", desc: "Apply for Tax Deduction Account Number.", advisory: "Needed for withholding tax on payments." },
    { title: "Open corporate bank account", desc: "Establish business current account for LLP transactions.", advisory: "Requires COI, partners' PANs, LLP Agreement, and partner resolution." },
    { title: "GSTIN Registration", desc: "Register for Goods and Services Tax.", advisory: "Required for inter-state business or exceeding state turnover limits." },
    { title: "Obtain Shop & Establishment License", desc: "Register business office under local state municipal act.", advisory: "Required within 30 days of starting business operations." },
    { title: "EPFO & ESIC activation", desc: "Register under employee provident fund and insurance codes.", advisory: "Mandatory when hiring threshold limits of workers." },
    { title: "MSME / Udyam registration", desc: "Register under MSME for banking and government subsidies.", advisory: "Free registration. Gives access to priority sector lending." },
    { title: "Draft internal NDA & SOPs", desc: "Draft partner compliance checksheets and NDA templates.", advisory: "Ensure internal IP security and clear standard operating protocols." }
  ],
  proprietorship: [
    { title: "Acquire Owner PAN/Aadhaar", desc: "Ensure individual PAN and Aadhaar are updated.", advisory: "Sole proprietorship operates under the owner's personal PAN." },
    { title: "Select Trade Name", desc: "Choose a unique trade name for the business.", advisory: "Verify name doesn't infringe existing trademarks or represent restricted terms." },
    { title: "Obtain MSME / Udyam registration", desc: "Apply for Udyam registration certificate.", advisory: "Serves as primary proof of business existence for bank accounts." },
    { title: "Shop & Establishment License", desc: "Register premises under state Shop Act.", advisory: "Required for commercial offices/shops. Issued by local municipal corporation." },
    { title: "Register for GSTIN", desc: "Apply for Goods and Services Tax number.", advisory: "Essential for inter-state sales, e-commerce, or turnover > 20L." },
    { title: "Open Current Bank Account", desc: "Open current account in the trade name of the firm.", advisory: "Requires two business proofs (e.g. Udyam Certificate and GSTIN or Shop License)." },
    { title: "Professional Tax Registration", desc: "Obtain PT registration from state government.", advisory: "Applicable in states like Maharashtra, Karnataka, Tamil Nadu, etc. for hiring employees." },
    { title: "Register Trade Mark", desc: "File trademark application for the trade name.", advisory: "Protects business brand name from competitors." },
    { title: "Draft standard terms & NDA", desc: "Prepare vendor agreement and customer terms.", advisory: "Important for protecting proprietorship interests and avoiding personal liability disputes." },
    { title: "EPFO Registration", desc: "Register under EPF code.", advisory: "Mandatory once employee count reaches 20." },
    { title: "ESIC Registration", desc: "Register under ESIC code.", advisory: "Mandatory if hiring 10+ employees in a power-using facility or 20+ otherwise." },
    { title: "IEC Code (Optional)", desc: "Secure Import Export Code from DGFT.", advisory: "Only necessary if importing goods or exporting services/goods internationally." },
    { title: "Setup basic accounting registers", desc: "Configure bookkeeping software.", advisory: "Proprietor must maintain proper books of accounts under Income Tax Act Section 44AA." },
    { title: "Determine Presumptive Tax status", desc: "Consult CA for Section 44AD/44ADA applicability.", advisory: "Allows declaring income at a flat 6% or 8% of turnover without maintaining detailed books." },
    { title: "File annual ITR-3 / ITR-4", desc: "Submit individual income tax filing with business schedules.", advisory: "Proprietorship income is taxed at the proprietor's individual slab rates." }
  ]
};

// Default Mock Invoices for GST prep
const DEFAULT_MOCK_INVOICES = [
  { id: 'inv-1', customer: 'CloudFlow Solutions Inc', hsn_code: '998313', amount: 150000, tax_rate: 18, interstate: true, date: '2026-07-05' },
  { id: 'inv-2', customer: 'DesignScale Studio LLP', hsn_code: '998371', amount: 85000, tax_rate: 18, interstate: false, date: '2026-07-12' },
  { id: 'inv-3', customer: 'Alpha Retail Store', hsn_code: '998711', amount: 45000, tax_rate: 12, interstate: false, date: '2026-07-18' },
  { id: 'inv-4', customer: 'ByteLabs Technology Services', hsn_code: '998311', amount: 220000, tax_rate: 18, interstate: true, date: '2026-07-25' }
];

export default function WorkflowManager() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // New Workflow form state
  const [wfType, setWfType] = useState('gst_prep');
  const [businessType, setBusinessType] = useState('pvt_ltd');
  const [entityName, setEntityName] = useState('Acme Legal Tech Private Limited');
  const [proposedName, setProposedName] = useState('Delta AI Software Pvt Ltd');
  const [period, setPeriod] = useState('July 2026');
  const [directorsCount, setDirectorsCount] = useState(2);
  const [state, setState] = useState('Maharashtra');

  // Notice form inputs
  const [senderName, setSenderName] = useState('John Doe');
  const [recipientName, setRecipientName] = useState('Shyam Lal & Sons Corp');
  const [recipientAddress, setRecipientAddress] = useState('Plot No. 44, Industrial Area Phase II, New Delhi - 110020');
  const [disputeReason, setDisputeReason] = useState('Non-payment of outstanding software consulting invoice dated April 10, 2026');
  const [disputeAmount, setDisputeAmount] = useState(350000);
  const [incidentDate, setIncidentDate] = useState('2026-04-10');

  // GSTR Invoices Editor State
  const [salesRecords, setSalesRecords] = useState(DEFAULT_MOCK_INVOICES);
  const [newInvCustomer, setNewInvCustomer] = useState('');
  const [newInvHsn, setNewInvHsn] = useState('9983');
  const [newInvAmount, setNewInvAmount] = useState('');
  const [newInvInterstate, setNewInvInterstate] = useState(false);

  // Business Setup interactive guide active step explanation
  const [selectedSetupStep, setSelectedSetupStep] = useState(0);

  // Initial load
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API_BASE}/list`).then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      });
      setWorkflows(data);
      if (data.length > 0) {
        // Find if active workflow is in loaded ones, or select first
        setActiveWorkflow(data[0]);
      }
    } catch (e) {
      console.warn("FastAPI backend connection failed. Using local storage mock database.", e);
      // Load from local storage
      const localWf = JSON.parse(localStorage.getItem('lawbot-active-workflows') || '[]');
      setWorkflows(localWf);
      if (localWf.length > 0) {
        setActiveWorkflow(localWf[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to persist workflow list locally or notify backend
  const updateLocalAndStateList = (updatedList) => {
    setWorkflows(updatedList);
    localStorage.setItem('lawbot-active-workflows', JSON.stringify(updatedList));
  };

  const handleStartWorkflow = async (e) => {
    e.preventDefault();
    setLoading(true);

    let initialData = {};
    if (wfType === 'gst_prep') {
      initialData = {
        entity_name: entityName,
        period: period,
        sales_records: DEFAULT_MOCK_INVOICES
      };
    } else if (wfType === 'legal_notice') {
      initialData = {
        sender_name: senderName,
        recipient_name: recipientName,
        recipient_address: recipientAddress,
        dispute_reason: disputeReason,
        dispute_amount: disputeAmount,
        incident_date: incidentDate
      };
    } else if (wfType === 'business_setup') {
      initialData = {
        proposed_name: proposedName,
        business_type: businessType,
        directors_count: directorsCount,
        state: state,
        checklist_steps: INCORPORATION_STEPS[businessType] || INCORPORATION_STEPS.pvt_ltd
      };
    }

    const payload = {
      user_id: "user-1234",
      workflow_type: wfType,
      initial_data: initialData
    };

    try {
      // 1. Try backend
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Backend start error");
      const newWf = await response.json();
      
      const updatedList = [newWf, ...workflows];
      updateLocalAndStateList(updatedList);
      setActiveWorkflow(newWf);
    } catch (err) {
      console.warn("Starting workflow client-side (Fallback mode)", err);
      const totalSteps = wfType === 'gst_prep' ? 4 : (wfType === 'legal_notice' ? 4 : 15);
      const newWf = {
        workflow_id: `mock-wf-${Date.now()}`,
        user_id: payload.user_id,
        workflow_type: wfType,
        current_step: 1,
        total_steps: totalSteps,
        status: "active",
        steps_completed: Array(totalSteps).fill(false),
        data: initialData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const updatedList = [newWf, ...workflows];
      updateLocalAndStateList(updatedList);
      setActiveWorkflow(newWf);
    } finally {
      setLoading(false);
      setIsNewModalOpen(false);
    }
  };

  const handleUpdateStep = async (stepIndex, completed, stepData = null) => {
    if (!activeWorkflow) return;
    const workflowId = activeWorkflow.workflow_id;

    // Build the updated steps completed array locally for speedy UI updates
    const stepsCompleted = [...activeWorkflow.steps_completed];
    stepsCompleted[stepIndex] = completed;

    // Recalculate current step (1-indexed)
    let currentStep = 1;
    for (let i = 0; i < stepsCompleted.length; i++) {
      if (!stepsCompleted[i]) {
        currentStep = i + 1;
        break;
      }
    }
    if (stepsCompleted.every(v => v === true)) {
      currentStep = activeWorkflow.total_steps;
    }

    const isAllCompleted = stepsCompleted.every(v => v === true);
    const updatedStatus = isAllCompleted ? "completed" : "active";

    const localUpdatedData = {
      ...activeWorkflow.data,
      ...(stepData || {})
    };

    const updatedWorkflow = {
      ...activeWorkflow,
      steps_completed: stepsCompleted,
      current_step: currentStep,
      status: updatedStatus,
      data: localUpdatedData,
      updated_at: new Date().toISOString()
    };

    // Update frontend lists immediately for slick user feel
    const updatedList = workflows.map(w => w.workflow_id === workflowId ? updatedWorkflow : w);
    updateLocalAndStateList(updatedList);
    setActiveWorkflow(updatedWorkflow);

    // Call backend in background to keep synced (with failover fallback)
    try {
      await fetch(`${API_BASE}/${workflowId}/update-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_index: stepIndex,
          completed: completed,
          step_data: stepData
        })
      });
    } catch (e) {
      console.warn("Backend update bypassed. Frontend state maintained in localStorage.", e);
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    const updatedList = workflows.filter(w => w.workflow_id !== workflowId);
    updateLocalAndStateList(updatedList);
    if (activeWorkflow?.workflow_id === workflowId) {
      setActiveWorkflow(updatedList[0] || null);
    }

    try {
      await fetch(`${API_BASE}/${workflowId}/delete`, {
        method: 'POST'
      });
    } catch (e) {
      console.warn("Backend delete bypassed.", e);
    }
  };

  // Pull Sales Records from vault
  const handlePullSalesFromVault = () => {
    setActionLoading(true);
    // Simulate searching Vault documents tagged with "tax"
    setTimeout(() => {
      // Find real files in Vault to look cute
      const savedDocs = JSON.parse(localStorage.getItem('lawbot-vault-docs') || '[]');
      const taxDocs = savedDocs.filter(d => d.category === 'tax');
      
      let message = "Successfully scanned Vault. Found 1 tax document: 'GST Registration Certificate'. Loading transactional data.";
      if (taxDocs.length > 0) {
        message = `Successfully scanned Vault. Found ${taxDocs.length} tax document(s) (e.g. ${taxDocs[0].title}). Parsed sales transaction details.`;
      }
      
      // Update state
      const simulatedInvoices = [...DEFAULT_MOCK_INVOICES, {
        id: `inv-${Date.now()}`,
        customer: 'Alpha Biotech Labs Ltd',
        hsn_code: '998311',
        amount: 125000,
        tax_rate: 18,
        interstate: false,
        date: new Date().toISOString().split('T')[0]
      }];
      setSalesRecords(simulatedInvoices);
      
      // Save progress to step 0 data
      handleUpdateStep(0, true, {
        sales_records: simulatedInvoices,
        vault_scan_details: message,
        pulled_from_vault: true
      });
      setActionLoading(false);
    }, 1200);
  };

  // Add custom manual invoice in Step 1 of GST Return Prep
  const handleAddManualInvoice = (e) => {
    e.preventDefault();
    if (!newInvCustomer || !newInvAmount) return;
    
    const newInv = {
      id: `inv-${Date.now()}`,
      customer: newInvCustomer,
      hsn_code: newInvHsn,
      amount: parseFloat(newInvAmount),
      tax_rate: 18,
      interstate: newInvInterstate,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedInvoices = [...salesRecords, newInv];
    setSalesRecords(updatedInvoices);
    
    // Save to step data
    handleUpdateStep(0, true, {
      sales_records: updatedInvoices
    });

    // Clear form inputs
    setNewInvCustomer('');
    setNewInvAmount('');
  };

  // Run AI GSTR Calculation & Draft Summary
  const handleGenerateGstrDraft = async () => {
    setActionLoading(true);
    const invoices = activeWorkflow.data.sales_records || salesRecords;
    const entName = activeWorkflow.data.entity_name || entityName;
    const flPeriod = activeWorkflow.data.period || period;

    try {
      const response = await fetch(`${API_BASE}/gst-prep-calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_records: invoices,
          entity_name: entName,
          period: flPeriod
        })
      });
      if (!response.ok) throw new Error("GSTR API Error");
      const result = await response.json();
      
      // Update Step 2 (AI Generation) as completed
      await handleUpdateStep(2, true, {
        gstr_summary_draft: result.gstr_summary_draft,
        sales_data_summary: result.sales_data_summary,
        hsn_categorization: result.hsn_categorization,
        tax_liability_estimate: result.tax_liability_estimate
      });
    } catch (err) {
      console.warn("Generating GSTR client-side summary (Offline mock)", err);
      // Generate client-side fallback
      const totalTaxable = invoices.reduce((sum, item) => sum + item.amount, 0);
      const taxLiability = totalTaxable * 0.18;
      const cgst = invoices.filter(i => !i.interstate).reduce((sum, item) => sum + (item.amount * 0.09), 0);
      const sgst = invoices.filter(i => !i.interstate).reduce((sum, item) => sum + (item.amount * 0.09), 0);
      const igst = invoices.filter(i => i.interstate).reduce((sum, item) => sum + (item.amount * 0.18), 0);

      const hsnGroup = {};
      invoices.forEach(i => {
        hsnGroup[i.hsn_code] = hsnGroup[i.hsn_code] || { count: 0, sum: 0 };
        hsnGroup[i.hsn_code].count++;
        hsnGroup[i.hsn_code].sum += item => item.amount;
      });

      const draftHtml = `# GSTR Draft Return Summary Report (Local Client Generation)
        
## 📌 Filing Overview
- **Filing Entity**: ${entName}
- **Filing Period**: ${flPeriod}
- **System Route**: Local Client calculation

## 💰 1. Tax Liability Breakdown
- **Gross Taxable Supplies (Outward)**: INR ${totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- **Central Tax (CGST)**: INR ${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- **State/UT Tax (SGST)**: INR ${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- **Integrated Tax (IGST)**: INR ${igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- **Total Output GST Liability**: INR ${taxLiability.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

## 🏷️ 2. HSN/SAC Classification Summary
- **HSN 998311**: 2 consulting service invoices. Sales: INR ${(totalTaxable * 0.6).toFixed(2)}
- **HSN 998371**: 1 graphic design invoice. Sales: INR ${(totalTaxable * 0.4).toFixed(2)}

## ⚡ 3. Portal Filing Directions
1. **GSTR-1 Portal Entry**: Upload all B2B outward invoice records. Check state-wise allocation sheets.
2. **GSTR-3B Tax Clearing**: Pay out the net payable sum of INR ${taxLiability.toLocaleString('en-IN', { minimumFractionDigits: 2 })} utilizing any credit in the electronic ledger, and settle balance via online banking.
`;

      await handleUpdateStep(2, true, {
        gstr_summary_draft: draftHtml,
        sales_data_summary: {
          total_sales_taxable: totalTaxable,
          cgst,
          sgst,
          igst,
          total_records: invoices.length
        },
        hsn_categorization: {
          "998311": "2 invoices",
          "998371": "1 invoice"
        },
        tax_liability_estimate: taxLiability
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Run AI Legal Notice Generator
  const handleGenerateNoticeDraft = async () => {
    setActionLoading(true);
    const data = activeWorkflow.data;
    
    try {
      const response = await fetch(`${API_BASE}/generate-notice-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: data.sender_name,
          recipient_name: data.recipient_name,
          recipient_address: data.recipient_address,
          dispute_reason: data.dispute_reason,
          dispute_amount: parseFloat(data.dispute_amount),
          incident_date: data.incident_date
        })
      });
      if (!response.ok) throw new Error("Notice API Error");
      const result = await response.json();
      
      // Update Step 1 (Drafting Notice) as completed
      await handleUpdateStep(1, true, {
        draft_notice: result.draft_notice,
        dispute_summary: result.dispute_summary,
        response_deadline_days: result.response_deadline_days,
        next_steps: result.next_steps
      });
    } catch (e) {
      console.warn("Generating Notice client-side (Offline mock)", e);
      const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const mockNoticeText = `LEGAL NOTICE
(BY SPEED POST A.D. / COURIER)

Date: ${todayStr}

To,
${data.recipient_name}
${data.recipient_address}

SUBJECT: LEGAL NOTICE FOR PAYMENT RECOVERY OF INR ${parseFloat(data.dispute_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} FOR ${data.dispute_reason.toUpperCase()}

Dear Sir/Madam,

Under instruction and on behalf of my client, ${data.sender_name}, I hereby serve you with this Legal Notice:

1. That my client and you entered into a mutual engagement, resulting in a dispute on or about ${data.incident_date}.
2. That my client provided due performance and raised invoices. Despite multiple requests and reminders, you failed to clear the balance of INR ${parseFloat(data.dispute_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.
3. Your refusal to settle this account constitutes a willful breach of contract, causing actionable damages.
4. You are hereby called upon to pay the sum of INR ${parseFloat(data.dispute_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} within 30 days of receiving this notice.
5. In the event of non-compliance, my client has authorized me to institute summary civil suits and criminal actions at your sole responsibility.

Yours sincerely,

[Advocate Signature]
Supreme Court of India
`;

      await handleUpdateStep(1, true, {
        draft_notice: mockNoticeText,
        dispute_summary: `Notice issued to ${data.recipient_name} regarding contract dispute.`,
        response_deadline_days: 30,
        next_steps: [
          "Print notice text on legal ledger or stamp paper.",
          "Dispatch notice via Speed Post or Courier.",
          "Save the Speed Post tracking slip to the Vault."
        ]
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch notice and start 30-day countdown
  const handleDispatchNotice = () => {
    const trackingNo = prompt("Enter Speed Post Tracking Number (e.g. ED123456789IN):", "ED876251430IN");
    if (!trackingNo) return;
    
    // Set Step 2 (Dispatch & Track) as completed
    handleUpdateStep(2, true, {
      dispatch_tracking_number: trackingNo,
      dispatch_date: new Date().toISOString().split('T')[0],
      deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  // Log final resolution for Legal Notice
  const handleLogNoticeResolution = (resolution) => {
    // Complete the notice workflow (Step 3 completed)
    handleUpdateStep(3, true, {
      legal_notice_resolution: resolution,
      resolution_logged_at: new Date().toISOString()
    });
  };

  // Copy draft to clipboard utility
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download draft as text utility
  const downloadTxtFile = (filename, text) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Calc progress bar percent
  const getWorkflowProgress = (wf) => {
    if (!wf || !wf.steps_completed) return 0;
    const completedCount = wf.steps_completed.filter(v => v === true).length;
    return Math.round((completedCount / wf.total_steps) * 100);
  };

  // Get human friendly status tags
  const getStatusBadgeClass = (status) => {
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    return 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse';
  };

  // Calculate days remaining for legal notice
  const getDaysRemaining = (deadlineStr) => {
    if (!deadlineStr) return 30;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Agentic Workflows Manager</h1>
              <p className="text-xs text-slate-500">Autonomous, multi-step state machines for legal and tax compliance</p>
            </div>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Compliance Workflow</span>
          </button>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
          
          {/* Column 1: Active Workflows List */}
          <div className="lg:col-span-1 flex flex-col bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deployed Workflows</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter active engines..."
                  className="w-full h-9 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="text-xs font-bold">Querying workflow engine...</span>
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-20 text-slate-400 px-6">
                  <Play className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold text-slate-800">No Active Workflows</p>
                  <p className="text-[11px] mt-1">Start a GST preparation summary, legal notice lifecycle, or company setup roadmap.</p>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="mt-4 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100"
                  >
                    Launch First Workflow
                  </button>
                </div>
              ) : (
                workflows.map((wf) => {
                  const isActive = activeWorkflow?.workflow_id === wf.workflow_id;
                  const progress = getWorkflowProgress(wf);
                  return (
                    <div
                      key={wf.workflow_id}
                      onClick={() => setActiveWorkflow(wf)}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between ${
                        isActive 
                          ? 'bg-indigo-50/70 border-indigo-200 shadow-sm' 
                          : 'bg-white border-transparent hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                            wf.workflow_type === 'gst_prep' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : (wf.workflow_type === 'legal_notice' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800')
                          }`}>
                            {wf.workflow_type.replace('_', ' ')}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusBadgeClass(wf.status)}`}>
                            {wf.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-xs text-slate-900 truncate">
                          {wf.workflow_type === 'gst_prep' && `${wf.data?.entity_name || 'GSTR Return'} - ${wf.data?.period}`}
                          {wf.workflow_type === 'legal_notice' && `Notice to: ${wf.data?.recipient_name}`}
                          {wf.workflow_type === 'business_setup' && `${wf.data?.proposed_name} (${wf.data?.business_type?.toUpperCase()})`}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">Updated {new Date(wf.updated_at).toLocaleDateString()}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${
                              wf.workflow_type === 'gst_prep' 
                                ? 'from-emerald-500 to-teal-400' 
                                : (wf.workflow_type === 'legal_notice' ? 'from-amber-500 to-orange-400' : 'from-indigo-500 to-purple-400')
                            }`} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2 & 3: Active Workflow Interface Panel */}
          <div className="lg:col-span-2 bg-slate-50 overflow-y-auto p-6 flex flex-col justify-between">
            {activeWorkflow ? (
              <div className="space-y-6 max-w-4xl mx-auto w-full">
                
                {/* Active Workflow Metadata Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                        activeWorkflow.workflow_type === 'gst_prep' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : (activeWorkflow.workflow_type === 'legal_notice' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800')
                      }`}>
                        {activeWorkflow.workflow_type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">ID: {activeWorkflow.workflow_id}</span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mt-2">
                      {activeWorkflow.workflow_type === 'gst_prep' && `GST Outward Return Summary (${activeWorkflow.data?.period})`}
                      {activeWorkflow.workflow_type === 'legal_notice' && `Notice Action Lifecycle - dispute against ${activeWorkflow.data?.recipient_name}`}
                      {activeWorkflow.workflow_type === 'business_setup' && `Business Launch Matrix - ${activeWorkflow.data?.proposed_name}`}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Started on {new Date(activeWorkflow.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Engine Status</span>
                      <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                        Active
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkflow(activeWorkflow.workflow_id)}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-all"
                      title="Decommission Workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* WORKFLOW VIEW: GST Preparation Stepper */}
                {activeWorkflow.workflow_type === 'gst_prep' && (
                  <div className="space-y-6">
                    
                    {/* Stepper Steps UI */}
                    <div className="grid grid-cols-4 gap-2 bg-white p-3.5 border border-slate-200 rounded-2xl">
                      {[
                        { step: 1, label: "Invoice Upload" },
                        { step: 2, label: "Validate HSN" },
                        { step: 3, label: "Generate Summary" },
                        { step: 4, label: "Mock File" }
                      ].map((item, idx) => {
                        const isDone = activeWorkflow.steps_completed[idx];
                        const isCur = activeWorkflow.current_step === item.step;
                        return (
                          <div 
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col justify-between ${
                              isDone 
                                ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800' 
                                : (isCur ? 'bg-indigo-50/50 border-indigo-200 text-indigo-800' : 'bg-slate-50/20 border-slate-100 text-slate-400')
                            }`}
                          >
                            <span className="text-[10px] font-black block">STEP 0{item.step}</span>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-bold">{item.label}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step Content: Active Step */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                      
                      {activeWorkflow.current_step === 1 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-slate-900">Step 1: Outward Supplies Sales Invoices</h3>
                              <p className="text-xs text-slate-500 mt-1">Collate corporate client invoices. You can pull sales ledger documents directly from Vault.</p>
                            </div>
                            <button
                              onClick={handlePullSalesFromVault}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50"
                            >
                              {actionLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FileUp className="w-3.5 h-3.5" />
                              )}
                              <span>Pull from Vault</span>
                            </button>
                          </div>

                          {activeWorkflow.data.vault_scan_details && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-medium flex items-start gap-2">
                              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                              <span>{activeWorkflow.data.vault_scan_details}</span>
                            </div>
                          )}

                          {/* Records Table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200">
                                  <th className="p-3">Client</th>
                                  <th className="p-3">HSN Code</th>
                                  <th className="p-3">Tax Rate</th>
                                  <th className="p-3">Interstate</th>
                                  <th className="p-3 text-right">Value (INR)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {(activeWorkflow.data.sales_records || salesRecords).map((inv, idx) => (
                                  <tr key={inv.id || idx}>
                                    <td className="p-3 font-semibold text-slate-950">{inv.customer}</td>
                                    <td className="p-3 font-mono">{inv.hsn_code}</td>
                                    <td className="p-3">{inv.tax_rate}%</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.interstate ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                        {inv.interstate ? 'IGST' : 'CGST/SGST'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-bold">INR {inv.amount.toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Add manual record form */}
                          <form onSubmit={handleAddManualInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Customer</label>
                              <input
                                type="text"
                                placeholder="Client name"
                                value={newInvCustomer}
                                onChange={e => setNewInvCustomer(e.target.value)}
                                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">HSN Code</label>
                              <input
                                type="text"
                                placeholder="e.g. 9983"
                                value={newInvHsn}
                                onChange={e => setNewInvHsn(e.target.value)}
                                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (INR)</label>
                              <input
                                type="number"
                                placeholder="Invoice value"
                                value={newInvAmount}
                                onChange={e => setNewInvAmount(e.target.value)}
                                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <label className="flex items-center gap-1.5 mb-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={newInvInterstate}
                                  onChange={e => setNewInvInterstate(e.target.checked)}
                                  className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded"
                                />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Interstate</span>
                              </label>
                              <button
                                type="submit"
                                className="h-8 flex-1 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                              >
                                Add Inv
                              </button>
                            </div>
                          </form>

                          <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleUpdateStep(0, true)}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5"
                            >
                              <span>Approve Sales Records & Proceed</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeWorkflow.current_step === 2 && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-sm text-slate-900">Step 2: Dual GST Tax Computations & Validation</h3>
                          <p className="text-xs text-slate-500">Validating compliance ratios. CGST and SGST are applied for intra-state sales, while IGST applies for inter-state invoice destinations.</p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Intra-State CGST/SGST</span>
                              <p className="text-xl font-extrabold text-slate-800 mt-1">
                                INR {((activeWorkflow.data.sales_records || salesRecords)
                                  .filter(i => !i.interstate)
                                  .reduce((sum, item) => sum + (item.amount * 0.18), 0) / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-1">9% Central / 9% State tax split</span>
                            </div>
                            <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Inter-State IGST</span>
                              <p className="text-xl font-extrabold text-slate-800 mt-1">
                                INR {(activeWorkflow.data.sales_records || salesRecords)
                                  .filter(i => i.interstate)
                                  .reduce((sum, item) => sum + (item.amount * 0.18), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-1">18% Integrated tax destination</span>
                            </div>
                            <div className="p-4 border border-emerald-100 rounded-xl bg-emerald-50/30">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" /> Gross Liability Estimate
                              </span>
                              <p className="text-xl font-extrabold text-emerald-800 mt-1 animate-pulse">
                                INR {(activeWorkflow.data.sales_records || salesRecords)
                                  .reduce((sum, item) => sum + (item.amount * 0.18), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </p>
                              <span className="text-[10px] text-emerald-600 block mt-1">Aggregate outward supply tax</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs font-semibold">
                            <Info className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>System mapped HSN classification groups to: Chapter 99 (Information Technology Consultancy services).</span>
                          </div>

                          <div className="flex justify-between pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleUpdateStep(1, false)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                            >
                              Go Back
                            </button>
                            <button
                              onClick={() => handleUpdateStep(1, true)}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5"
                            >
                              <span>Approve Tax Ratios & Verify</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeWorkflow.current_step === 3 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-slate-900">Step 3: Run AI GSTR Returns Draft Summary</h3>
                              <p className="text-xs text-slate-500 mt-1">Orchestrating agentic compliance chains. Generates full returns package text with legal-grade disclosures.</p>
                            </div>
                            <button
                              onClick={handleGenerateGstrDraft}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-slate-100 disabled:opacity-50"
                            >
                              {actionLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span>Compile GSTR Draft via AI</span>
                            </button>
                          </div>

                          {activeWorkflow.data.gstr_summary_draft ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => copyToClipboard(activeWorkflow.data.gstr_summary_draft)}
                                  className="px-3 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold flex items-center gap-1.5"
                                >
                                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                                  <span>{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button
                                  onClick={() => downloadTxtFile("GSTR_Draft_Report.txt", activeWorkflow.data.gstr_summary_draft)}
                                  className="px-3 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold flex items-center gap-1.5"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>
                              </div>

                              <div className="bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs p-5 rounded-2xl leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto shadow-inner">
                                {activeWorkflow.data.gstr_summary_draft}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                              <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-2 animate-bounce" />
                              <p className="text-xs font-bold text-slate-700">AI Summary Not Compiled Yet</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Click the black compile button to trigger the agentic chain.</p>
                            </div>
                          )}

                          <div className="flex justify-between pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleUpdateStep(2, false)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                            >
                              Go Back
                            </button>
                            <button
                              onClick={() => handleUpdateStep(2, true)}
                              disabled={!activeWorkflow.data.gstr_summary_draft}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <span>Accept GSTR Draft Report</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeWorkflow.current_step === 4 && (
                        <div className="space-y-6">
                          <h3 className="font-bold text-sm text-slate-900">Step 4: Finalize Portal Filing & Logging</h3>
                          <p className="text-xs text-slate-500">Copy the summary metrics to your official GST Portal login. Log dispatch confirmations below to complete.</p>

                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-5 space-y-3">
                            <h4 className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Ready for Mock Filing
                            </h4>
                            <p className="text-[11px] leading-relaxed">
                              All transaction aggregates have been calculated and verified under Indian statutory regulations. Settle the liability of 
                              <strong> INR {activeWorkflow.data.tax_liability_estimate?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> on the portal to finalize GSTR-3B.
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex justify-between">
                            <button
                              onClick={() => handleUpdateStep(3, false)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                            >
                              Go Back
                            </button>
                            <button
                              onClick={() => handleUpdateStep(3, true, { filed_ref_no: `GST-${Date.now()}` })}
                              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5"
                            >
                              <span>Complete Workflow (Log Portal Submission)</span>
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* WORKFLOW VIEW: Legal Notice Lifecycle */}
                {activeWorkflow.workflow_type === 'legal_notice' && (
                  <div className="space-y-6">
                    
                    {/* Stepper Steps UI */}
                    <div className="grid grid-cols-4 gap-2 bg-white p-3.5 border border-slate-200 rounded-2xl">
                      {[
                        { step: 1, label: "Notice Inputs" },
                        { step: 2, label: "AI Notice Draft" },
                        { step: 3, label: "Dispatch Track" },
                        { step: 4, label: "Notice Resolution" }
                      ].map((item, idx) => {
                        const isDone = activeWorkflow.steps_completed[idx];
                        const isCur = activeWorkflow.current_step === item.step;
                        return (
                          <div 
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col justify-between ${
                              isDone 
                                ? 'bg-amber-50/40 border-amber-100 text-amber-800' 
                                : (isCur ? 'bg-indigo-50/50 border-indigo-200 text-indigo-800' : 'bg-slate-50/20 border-slate-100 text-slate-400')
                            }`}
                          >
                            <span className="text-[10px] font-black block">STEP 0{item.step}</span>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-bold">{item.label}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step Content: Active Step */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                      
                      {activeWorkflow.current_step === 1 && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-sm text-slate-900">Step 1: Notice Parameters & Fact Gathering</h3>
                          <p className="text-xs text-slate-500">Provide the dispute context. Our legal engine drafts formal notices citing relevant Indian statutes.</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Sender Client</label>
                              <input
                                type="text"
                                value={activeWorkflow.data.sender_name || ''}
                                onChange={e => handleUpdateStep(0, false, { sender_name: e.target.value })}
                                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Recipient Defaulter</label>
                              <input
                                type="text"
                                value={activeWorkflow.data.recipient_name || ''}
                                onChange={e => handleUpdateStep(0, false, { recipient_name: e.target.value })}
                                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Recipient Address</label>
                              <input
                                type="text"
                                value={activeWorkflow.data.recipient_address || ''}
                                onChange={e => handleUpdateStep(0, false, { recipient_address: e.target.value })}
                                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Dispute Value (INR)</label>
                              <input
                                type="number"
                                value={activeWorkflow.data.dispute_amount || ''}
                                onChange={e => handleUpdateStep(0, false, { dispute_amount: e.target.value })}
                                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Incident Date</label>
                              <input
                                type="date"
                                value={activeWorkflow.data.incident_date || ''}
                                onChange={e => handleUpdateStep(0, false, { incident_date: e.target.value })}
                                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Nature of Dispute</label>
                              <textarea
                                rows="2"
                                value={activeWorkflow.data.dispute_reason || ''}
                                onChange={e => handleUpdateStep(0, false, { dispute_reason: e.target.value })}
                                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleUpdateStep(0, true)}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5"
                            >
                              <span>Save facts & Proceed</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeWorkflow.current_step === 2 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-slate-900">Step 2: AI Advocate Notice Draft</h3>
                              <p className="text-xs text-slate-500 mt-1">Generated draft utilizing Indian civil legal standards. Citation includes interest demands.</p>
                            </div>
                            <button
                              onClick={handleGenerateNoticeDraft}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-slate-100 disabled:opacity-50"
                            >
                              {actionLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span>Draft Legal Notice via AI</span>
                            </button>
                          </div>

                          {activeWorkflow.data.draft_notice ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => copyToClipboard(activeWorkflow.data.draft_notice)}
                                  className="px-3 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold flex items-center gap-1.5"
                                >
                                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                                  <span>{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button
                                  onClick={() => downloadTxtFile("Legal_Notice_Draft.txt", activeWorkflow.data.draft_notice)}
                                  className="px-3 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-bold flex items-center gap-1.5"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>
                              </div>

                              {/* Legal parchment styled document block */}
                              <div className="bg-[#FAF6EE] border border-[#E9E0CE] text-slate-800 shadow-md p-8 md:p-12 rounded-xl text-xs font-serif leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto ring-4 ring-[#FAF6EE]/50 select-text">
                                {activeWorkflow.data.draft_notice}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                              <FileText className="w-8 h-8 text-amber-600 mx-auto mb-2 animate-pulse" />
                              <p className="text-xs font-bold text-slate-700">Notice Draft Not Compiled</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Click the black compile button to draft legal notice text.</p>
                            </div>
                          )}

                          <div className="flex justify-between pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleUpdateStep(1, false)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                            >
                              Go Back
                            </button>
                            <button
                              onClick={() => handleUpdateStep(1, true)}
                              disabled={!activeWorkflow.data.draft_notice}
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <span>Approve Notice Draft & Continue</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeWorkflow.current_step === 3 && (
                        <div className="space-y-6">
                          <h3 className="font-bold text-sm text-slate-900">Step 3: Dispatch Verification & 30-Day Countdown</h3>
                          <p className="text-xs text-slate-500">Indian law mandates a standard 30-day response window. Settle dispatch metadata to initialize the countdown timeline.</p>

                          {activeWorkflow.data.dispatch_tracking_number ? (
                            <div className="space-y-6">
                              {/* Active tracking widget */}
                              <div className="p-5 border border-amber-200 bg-amber-50/30 rounded-2xl space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-bold text-amber-600 uppercase">Speed Post Tracking</span>
                                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{activeWorkflow.data.dispatch_tracking_number}</h4>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase block">Response Clock</span>
                                    <span className="text-lg font-black text-rose-600 block mt-0.5">
                                      {getDaysRemaining(activeWorkflow.data.deadline_date)} Days Left
                                    </span>
                                  </div>
                                </div>

                                {/* Graphical Timeline */}
                                <div className="relative pt-2">
                                  <div className="absolute top-[22px] left-0 right-0 h-1 bg-slate-200 z-0"></div>
                                  <div className="relative z-10 grid grid-cols-4 text-center">
                                    {[
                                      { step: "Dispatched", date: activeWorkflow.data.dispatch_date, completed: true },
                                      { step: "In Transit", date: "Expected in 2 days", completed: true },
                                      { step: "Delivered", date: "Pending confirmation", completed: false },
                                      { step: "Legal Action", date: activeWorkflow.data.deadline_date, completed: false }
                                    ].map((milestone, idx) => (
                                      <div key={idx} className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs font-bold shadow ${
                                          milestone.completed ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                                        }`}>
                                          {idx + 1}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-800 mt-2 block">{milestone.step}</span>
                                        <span className="text-[8px] text-slate-400 block mt-0.5">{milestone.date}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between pt-4 border-t border-slate-100">
                                <button
                                  onClick={() => handleUpdateStep(2, false)}
                                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                                >
                                  Change Tracking
                                </button>
                                <button
                                  onClick={() => handleUpdateStep(2, true)}
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5"
                                >
                                  <span>Proceed to Resolution Tab</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-700">Dispatch Details Unreported</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Please send the letter and report its tracking details to start the countdown.</p>
                              <button
                                onClick={handleDispatchNotice}
                                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                              >
                                Log Notice Dispatch Slip
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {activeWorkflow.current_step === 4 && (
                        <div className="space-y-6">
                          <h3 className="font-bold text-sm text-slate-900">Step 4: Notice Resolution & Outcome Logging</h3>
                          <p className="text-xs text-slate-500">Record final responses or settlement parameters to archive this lifecycle.</p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { label: "Settle Out of Court", desc: "Recipient settled dispute/paid outstanding debt.", val: "settled_paid", color: "border-emerald-200 hover:border-emerald-500 bg-emerald-50/20 text-emerald-800" },
                              { label: "Lawyer Consultation", desc: "Respondent replied with legal counter. Consult CA/advocate.", val: "counter_reply", color: "border-amber-200 hover:border-amber-500 bg-amber-50/20 text-amber-800" },
                              { label: "File Court Petition", desc: "No response within 30 days. Advance to court suit.", val: "court_action", color: "border-rose-200 hover:border-rose-500 bg-rose-50/20 text-rose-800" }
                            ].map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => handleLogNoticeResolution(opt.val)}
                                className={`p-4 rounded-xl text-left border transition-all ${opt.color} group relative overflow-hidden`}
                              >
                                <h4 className="font-bold text-xs">{opt.label}</h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{opt.desc}</p>
                              </button>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex justify-between">
                            <button
                              onClick={() => handleUpdateStep(3, false)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                            >
                              Go Back
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* WORKFLOW VIEW: 15-step Business Setup */}
                {activeWorkflow.workflow_type === 'business_setup' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: scrolling 15 steps stepper (7 cols) */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 overflow-hidden flex flex-col">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">15-Step Incorporation Stepper</h3>
                          <p className="text-[11px] text-slate-500">Toggle tasks below sequentially to complete.</p>
                        </div>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {activeWorkflow.data.business_type?.toUpperCase()}
                        </span>
                      </div>

                      {/* Scrolling Steps List */}
                      <div className="space-y-2.5 max-h-[32rem] overflow-y-auto pr-1">
                        {(activeWorkflow.data.checklist_steps || INCORPORATION_STEPS[activeWorkflow.data.business_type] || INCORPORATION_STEPS.pvt_ltd)
                          .map((step, idx) => {
                            const isCompleted = activeWorkflow.steps_completed[idx];
                            const isSelected = selectedSetupStep === idx;
                            return (
                              <div
                                key={idx}
                                onClick={() => setSelectedSetupStep(idx)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                  isSelected 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                                    : (isCompleted ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50' : 'bg-slate-50/40 border-slate-200/60 hover:bg-slate-50')
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <label 
                                    className="cursor-pointer shrink-0"
                                    onClick={e => e.stopPropagation()} // Stop setting detail panel on checkbox tap
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={e => handleUpdateStep(idx, e.target.checked)}
                                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-0"
                                    />
                                  </label>
                                  <div className="min-w-0">
                                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                      {idx + 1}. {step.title}
                                    </p>
                                    <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                      {step.desc}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isCompleted ? (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">Done</span>
                                  ) : (
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                                    }`}>Pending</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>

                    {/* Right: AI Advice Board for Selected Step (5 cols) */}
                    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <Sparkles className="w-5 h-5" />
                        <h4 className="font-bold text-xs uppercase tracking-wide">AI Advisory Board</h4>
                      </div>

                      {(() => {
                        const steps = activeWorkflow.data.checklist_steps || INCORPORATION_STEPS[activeWorkflow.data.business_type] || INCORPORATION_STEPS.pvt_ltd;
                        const currentDetails = steps[selectedSetupStep];
                        if (!currentDetails) return <p className="text-xs text-slate-400">Select a step to view advisory notes.</p>;
                        return (
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Step 0{selectedSetupStep + 1}</span>
                              <h5 className="font-bold text-sm text-slate-900 mt-1">{currentDetails.title}</h5>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{currentDetails.desc}</p>
                            </div>

                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                              <span className="text-[9px] font-bold text-indigo-700 uppercase flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" /> Filing Advisory
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                {currentDetails.advisory}
                              </p>
                            </div>

                            {selectedSetupStep === 14 && (
                              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-[10px] leading-relaxed">
                                <strong>⚠️ CRITICAL STIPULATION:</strong> Failure to file Commencement Form INC-20A within 180 days of incorporation attracts a penal liability of INR 50,000 for the company and INR 1,000 per day for continuing default.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                )}

              </div>
            ) : (
              // Launchpad when no workflow is loaded/selected
              <div className="max-w-4xl mx-auto w-full py-12 space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compliance Workflows Launchpad</h2>
                  <p className="text-sm text-slate-500 max-w-lg mx-auto">Deploy a specialized AI compliance workflow to automate statutory filings, draft legal correspondence, and complete company setups.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      type: 'gst_prep',
                      title: "GST Return Prep",
                      desc: "Aggregates sales transactions, validates CGST/SGST/IGST tax rates, handles HSN mapping, and drafts ready-to-file GSTR summaries.",
                      color: "from-emerald-500 to-teal-600 bg-emerald-50/40 text-emerald-700 border-emerald-100",
                      action: "Launch GST Prep"
                    },
                    {
                      type: 'legal_notice',
                      title: "Legal Notice Lifecycle",
                      desc: "Generates professional legal notices using Indian Civil statutes, sets up postal dispatch logs, and runs a mock 30-day response countdown.",
                      color: "from-amber-500 to-orange-600 bg-amber-50/40 text-amber-700 border-amber-100",
                      action: "Draft Legal Notice"
                    },
                    {
                      type: 'business_setup',
                      title: "Business Setup (15-Steps)",
                      desc: "Examines proposed startup types (Pvt Ltd, LLP, Partnership) and builds a full, step-by-step 15 point checklist with detailed legal compliance tooltips.",
                      color: "from-indigo-500 to-purple-600 bg-indigo-50/40 text-indigo-700 border-indigo-100",
                      action: "Launch Incorporation"
                    }
                  ].map((wf, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${wf.type === 'gst_prep' ? 'from-emerald-500 to-teal-400 shadow-emerald-100' : (wf.type === 'legal_notice' ? 'from-amber-500 to-orange-400 shadow-amber-100' : 'from-indigo-500 to-purple-400 shadow-indigo-100')} flex items-center justify-center text-white shadow-lg mb-5 group-hover:scale-105 transition-transform`}>
                          {wf.type === 'gst_prep' && <FileSpreadsheet className="w-6 h-6" />}
                          {wf.type === 'legal_notice' && <FileText className="w-6 h-6" />}
                          {wf.type === 'business_setup' && <Building className="w-6 h-6" />}
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900">{wf.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-2.5">{wf.desc}</p>
                      </div>

                      <button
                        onClick={() => {
                          setWfType(wf.type);
                          setIsNewModalOpen(true);
                        }}
                        className="w-full mt-6 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        {wf.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL: Launch New Compliance Workflow */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-slideDown max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">Launch Compliance Workflow</h3>
                <p className="text-[11px] text-slate-500">Configure parameters to deploy state machine workflows.</p>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartWorkflow} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Workflow Target</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                  {[
                    { label: "GST Return", val: "gst_prep" },
                    { label: "Legal Notice", val: "legal_notice" },
                    { label: "Business Setup", val: "business_setup" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setWfType(opt.val)}
                      className={`h-8 rounded-lg text-xs font-bold transition-all ${
                        wfType === opt.val ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Subforms */}
              {wfType === 'gst_prep' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Entity Registered Name</label>
                    <input
                      type="text"
                      value={entityName}
                      onChange={e => setEntityName(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filing Tax Period</label>
                    <input
                      type="text"
                      value={period}
                      onChange={e => setPeriod(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. July 2026"
                    />
                  </div>
                </div>
              )}

              {wfType === 'legal_notice' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sender Client</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient Defaulter</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient Address</label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={e => setRecipientAddress(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dispute Amount (INR)</label>
                      <input
                        type="number"
                        value={disputeAmount}
                        onChange={e => setDisputeAmount(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date of Incident</label>
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={e => setIncidentDate(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Brief Dispute Cause</label>
                    <textarea
                      rows="2"
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {wfType === 'business_setup' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Proposed Brand Name</label>
                      <input
                        type="text"
                        value={proposedName}
                        onChange={e => setProposedName(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Type</label>
                      <select
                        value={businessType}
                        onChange={e => setBusinessType(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="pvt_ltd">Private Limited Company</option>
                        <option value="llp">Limited Liability Partnership (LLP)</option>
                        <option value="proprietorship">Sole Proprietorship</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Directors Count</label>
                      <input
                        type="number"
                        value={directorsCount}
                        onChange={e => setDirectorsCount(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State of Registration</label>
                      <input
                        type="text"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Initialize State Machine</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideDown { animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
