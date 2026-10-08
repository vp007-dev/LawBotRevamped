(() => {
  const views = {
    overview: { title: "Good morning, Ramesh.", template: "overview-template" },
    chat: { title: "Legal AI chat", template: "chat-template" },
    voice: { title: "Gemini Live voice", template: "voice-template" },
    contract: { title: "Contract analysis", template: "contract-template" },
    draft: { title: "Document drafting", template: "draft-template" },
    vault: { title: "Your document vault", template: "overview-template" },
    calendar: { title: "Compliance calendar", template: "overview-template" }
  };
  const workspace = document.querySelector("[data-workspace-view]");
  const pageTitle = document.querySelector("[data-page-title]");
  const navItems = [...document.querySelectorAll(".nav-item")];
  let currentView = "overview";
  let callInterval;

  function render(viewName) {
    const view = views[viewName] || views.overview;
    currentView = viewName;
    pageTitle.textContent = view.title;
    workspace.replaceChildren(document.getElementById(view.template).content.cloneNode(true));
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
    if (["vault", "calendar"].includes(viewName)) {
      workspace.querySelector(".welcome-card h2").innerHTML = viewName === "vault" ? "Your important<br>documents, together." : "Keep the next<br>important date visible.";
      workspace.querySelector(".welcome-card>div:first-child>p:last-child").textContent = viewName === "vault" ? "Your document vault connects important files to the work and dates they support." : "The calendar keeps upcoming filing tasks and workflows in a simpler view.";
    }
    bindView(viewName);
  }

  function bindView(viewName) {
    workspace.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => render(button.dataset.openView)));
    if (viewName === "chat") bindChat();
    if (viewName === "voice") bindVoice();
    if (viewName === "contract") bindContract();
    if (viewName === "draft") bindDraft();
  }

  function bindChat() {
    const form = workspace.querySelector("[data-chat-form]");
    const input = form.querySelector("input");
    const log = workspace.querySelector("[data-chat-log]");
    const ask = (question) => {
      if (!question.trim()) return;
      const user = document.createElement("div");
      user.className = "chat-message user";
      user.textContent = question;
      log.append(user);
      const response = document.createElement("div");
      response.className = "chat-message bot";
      response.textContent = "A useful first step is to write down the key facts, dates, and documents involved. I can help you organize those details and understand the options you may want to explore.";
      window.setTimeout(() => log.append(response), 240);
      input.value = "";
    };
    form.addEventListener("submit", (event) => { event.preventDefault(); ask(input.value); });
    workspace.querySelectorAll("[data-prompt]").forEach((button) => button.addEventListener("click", () => ask(button.dataset.prompt)));
  }

  function bindVoice() {
    const start = workspace.querySelector("[data-start-call]");
    const status = workspace.querySelector("[data-call-status]");
    const title = workspace.querySelector("[data-call-title]");
    const copy = workspace.querySelector("[data-call-copy]");
    const timer = workspace.querySelector("[data-call-timer]");
    start.addEventListener("click", () => {
      const active = start.dataset.active === "true";
      window.clearInterval(callInterval);
      if (active) {
        start.dataset.active = "false"; start.innerHTML = "<span>◉</span> Start voice conversation"; status.textContent = "READY TO START"; title.textContent = "Ready when you are."; copy.textContent = "Start a voice conversation and tell us what’s happening."; timer.textContent = "00:00"; return;
      }
      start.dataset.active = "true"; start.innerHTML = "<span>■</span> End voice conversation"; status.textContent = "LIVE · LISTENING"; title.textContent = "I’m listening."; copy.textContent = "Tell me what’s happening, in your own words.";
      let seconds = 0;
      callInterval = window.setInterval(() => { seconds += 1; timer.textContent = `00:${String(seconds).padStart(2, "0")}`; }, 1000);
    });
  }

  function bindContract() {
    const zone = workspace.querySelector("[data-upload-zone]");
    const input = workspace.querySelector("[data-contract-file]");
    const result = workspace.querySelector("[data-analysis-result]");
    const analyze = (name = "Vendor agreement") => {
      zone.innerHTML = `<span class="upload-icon">✓</span><h3>${name}</h3><p>Document ready for a structured review</p><button type="button" data-show-result>See analysis preview</button><small>Analysis is illustrative in this landing-page workspace.</small>`;
      zone.querySelector("[data-show-result]").addEventListener("click", () => {
        result.hidden = false;
        result.innerHTML = `<div class="result-head"><h3>Review summary</h3><span>2 points to review</span></div><div class="result-grid"><div><b>Notice period</b><small>Check whether the timing is workable for you.</small></div><div><b>Liability clause</b><small>Clarify limits and responsibilities before signing.</small></div><div><b>Termination</b><small>Confirm what happens if either side needs to exit.</small></div></div>`;
      });
    };
    workspace.querySelector("[data-select-contract]").addEventListener("click", () => input.click());
    input.addEventListener("change", () => { if (input.files[0]) analyze(input.files[0].name); });
    zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.style.borderColor = "#527d82"; });
    zone.addEventListener("dragleave", () => { zone.style.borderColor = ""; });
    zone.addEventListener("drop", (event) => { event.preventDefault(); analyze(event.dataTransfer.files[0]?.name || "Uploaded document"); });
  }

  const templates = {
    "FIR application": (details) => `To,\nThe Station House Officer\n[Police Station Name]\n\nSubject: Request to register an FIR\n\nRespected Sir/Madam,\n\nI, ${details.name}, residing at ${details.address}, wish to report the following incident / concern:\n\n${details.concern}\n\nI request that this information be recorded and that appropriate action be taken in accordance with law. I can be contacted at ${details.phone}.\n\nSincerely,\n${details.name}\nDate: ${new Date().toLocaleDateString("en-IN")}`,
    "Consumer complaint": (details) => `To,\nThe Consumer Disputes Redressal Commission\n[District / State]\n\nSubject: Consumer complaint\n\nRespected Sir/Madam,\n\nI, ${details.name}, residing at ${details.address}, submit this complaint regarding the following concern:\n\n${details.concern}\n\nI request appropriate redressal and any relief available under applicable consumer law. I can be contacted at ${details.phone}.\n\nSincerely,\n${details.name}\nDate: ${new Date().toLocaleDateString("en-IN")}`,
    "Rental deed request": (details) => `To,\n[Landlord / Property Manager]\n\nSubject: Request to prepare / review rental deed terms\n\nRespected Sir/Madam,\n\nI, ${details.name}, residing at ${details.address}, request that the rental deed terms be prepared or reviewed for the following matter:\n\n${details.concern}\n\nPlease include clear terms for rent, security deposit, duration, notice period, maintenance, and responsibilities of both parties. I can be contacted at ${details.phone}.\n\nSincerely,\n${details.name}\nDate: ${new Date().toLocaleDateString("en-IN")}`
  };

  function bindDraft() {
    let selected = "FIR application";
    const form = workspace.querySelector("[data-personal-form]");
    const paper = workspace.querySelector("[data-draft-content]");
    const getDetails = () => Object.fromEntries(new FormData(form).entries());
    const updateDraft = () => { paper.textContent = templates[selected](getDetails()); };
    workspace.querySelectorAll(".doc-type").forEach((type) => type.addEventListener("click", () => { selected = type.dataset.docType; workspace.querySelectorAll(".doc-type").forEach((item) => item.classList.toggle("active", item === type)); updateDraft(); }));
    form.addEventListener("submit", (event) => { event.preventDefault(); updateDraft(); });
    workspace.querySelector("[data-download-pdf]").addEventListener("click", () => downloadPdf(paper.innerText, `${selected.toLowerCase().replaceAll(" ", "-")}.pdf`));
    updateDraft();
  }

  function downloadPdf(text, filename) {
    const escapePdf = (value) => value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
    const lines = text.split(/\r?\n/).flatMap((line) => {
      const wrapped = []; let rest = line || " ";
      while (rest.length > 88) { wrapped.push(rest.slice(0, 88)); rest = rest.slice(88); }
      wrapped.push(rest); return wrapped;
    });
    const pages = [];
    for (let start = 0; start < lines.length; start += 42) pages.push(lines.slice(start, start + 42));
    const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>"];
    const pageRefs = pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ");
    objects[1] = `<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`;
    pages.forEach((page, index) => {
      const pageId = 4 + index * 2, contentId = pageId + 1;
      const stream = `BT\n/F1 11 Tf\n50 790 Td\n${page.map((line, lineIndex) => `${lineIndex ? "0 -17 Td\n" : ""}(${escapePdf(line)}) Tj`).join("\n")}\nET`;
      objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
      objects[contentId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    let pdf = "%PDF-1.4\n"; const offsets = [0];
    objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  navItems.forEach((item) => item.addEventListener("click", () => render(item.dataset.view)));
  document.querySelector("[data-action='notifications']").addEventListener("click", () => render("calendar"));
  render("overview");
})();
