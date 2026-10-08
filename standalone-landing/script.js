(() => {
  const workspacePath = window.location.protocol === "file:" ? "http://127.0.0.1:5173/workspace" : "/workspace";
  document.querySelectorAll("[data-workspace-link]").forEach((link) => { link.href = workspacePath; });

  const featureContent = {
    guidance: {
      kicker: "01 / Legal guidance",
      title: "Good answers begin with understanding.",
      body: "Ask questions in everyday language. Get a thoughtful starting point, relevant legal context, and a clearer sense of what you can do next.",
      tags: ["Conversational guidance", "Relevant legal context", "Multilingual voice & text"],
      visual: "visual-guidance",
      visualLabel: "A legal guidance chat preview",
      preview: `<div class="orbit-grid"></div><div class="chat-window feature-enter"><div class="chat-heading"><span class="bot-dot">L</span><span><b>Legal guide</b><small>Here to help you find a starting point</small></span><span class="chat-menu">···</span></div><div class="chat-bubble user-bubble">My landlord is keeping my deposit. What can I do?</div><div class="chat-bubble bot-bubble">Let’s make sense of this together. A useful first step is to check your rental agreement and document the condition of the property.</div><div class="source-pill">▤ &nbsp; Rental agreement checklist <span>↗</span></div><div class="chat-input">Ask in your own words <span>➤</span></div></div><span class="panel-stamp">PLAIN LANGUAGE<br>FIRST</span>`
    },
    documents: {
      kicker: "02 / Documents",
      title: "Turn dense paperwork into clear next steps.",
      body: "Review contracts and notices in plain language. Surface key terms, possible risks, and questions to consider, then prepare practical drafts such as RTIs and consumer complaints.",
      tags: ["Contract review", "Plain-language summaries", "Document drafting"],
      visual: "visual-documents",
      visualLabel: "A contract review preview",
      preview: `<div class="doc-rays"></div><div class="review-sheet feature-enter"><div class="review-head"><span><i></i> VENDOR AGREEMENT.pdf</span><b>78% reviewed</b></div><div class="review-title">SERVICE AGREEMENT</div><div class="document-lines"><i></i><i></i><i class="risk-line"></i><i></i><i></i><i class="risk-line short"></i><i></i></div><div class="risk-pin pin-one"><span>!</span><b>Notice period</b><small>Needs your attention</small></div><div class="risk-pin pin-two"><span>!</span><b>Unlimited liability</b><small>Potential risk found</small></div><div class="review-bottom"><span>3 points to consider</span><b>View summary ↗</b></div></div><span class="panel-stamp">READ BETWEEN<br>THE LINES</span>`
    },
    business: {
      kicker: "03 / Business tools",
      title: "Keep important work moving.",
      body: "Bring compliance dates, business setup tasks, regulatory updates, and active workflows into one workspace that helps you see what needs attention.",
      tags: ["Compliance calendar", "Regulatory updates", "Business workflows"],
      visual: "visual-business",
      visualLabel: "A business compliance dashboard preview",
      preview: `<div class="dashboard-glow"></div><div class="compliance-board feature-enter"><div class="compliance-head"><span><i class="board-logo">L</i><b>Compliance compass</b></span><small>OCTOBER 2026</small></div><div class="compliance-score"><div class="score-ring"><b>84</b><small>HEALTH</small></div><div><b>Looking steady.</b><small>2 actions will keep you on track.</small></div></div><div class="task-stack"><div class="task due"><span class="task-date">12<small>OCT</small></span><span><b>GST return</b><small>Due in 4 days</small></span><i>→</i></div><div class="task"><span class="task-date">18<small>OCT</small></span><span><b>Vendor agreement</b><small>Review in progress</small></span><i>→</i></div></div></div><span class="panel-stamp">KEEP THE GOOD<br>WORK MOVING</span>`
    },
    people: {
      kicker: "04 / Human support",
      title: "Know when it’s time to bring in a person.",
      body: "Organize case milestones and evidence, explore lawyer connections, and keep human support part of the journey when a matter needs professional advice or representation.",
      tags: ["Case timelines", "Lawyer network", "Voice consultations"],
      visual: "visual-people",
      visualLabel: "A lawyer support and case timeline preview",
      preview: `<div class="people-sun"></div><div class="support-card feature-enter"><div class="support-head"><span class="case-label">YOUR SUPPORT CIRCLE</span><span class="online-badge"><i></i> AVAILABLE</span></div><div class="match-row"><div class="counsel-avatar">AS</div><div><b>Ananya Shah</b><small>Consumer & property law</small><span class="match-pill">Strong match for your matter</span></div><button aria-label="Start a consultation">↗</button></div><div class="case-track"><span class="track-title">YOUR CASE PATH</span><div class="track-line"><i class="done">✓</i><span></span><i class="current">02</i><span></span><i>03</i></div><div class="track-labels"><b>Details shared</b><b>Reviewing</b><b>Next step</b></div></div></div><span class="panel-stamp">THE RIGHT HELP,<br>AT THE RIGHT TIME</span>`
    }
  };

  const tabs = [...document.querySelectorAll(".feature-tab")];
  const panel = document.querySelector(".feature-panel");
  const panelKicker = document.querySelector("[data-panel-kicker]");
  const panelTitle = document.querySelector("[data-panel-title]");
  const panelBody = document.querySelector("[data-panel-body]");
  const panelTags = document.querySelector("[data-panel-tags]");

  function activateTab(tab, moveFocus = false) {
    const item = featureContent[tab.dataset.feature];
    if (!item) return;
    tabs.forEach((candidate) => {
      const active = candidate === tab;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-selected", String(active));
      candidate.tabIndex = active ? 0 : -1;
    });
    panelKicker.textContent = item.kicker;
    panelTitle.textContent = item.title;
    panelBody.textContent = item.body;
    panelTags.replaceChildren(...item.tags.map((label) => {
      const tag = document.createElement("span");
      tag.textContent = label;
      return tag;
    }));
    const visual = panel.querySelector(".panel-visual");
    visual.className = `panel-visual ${item.visual}`;
    visual.setAttribute("aria-label", item.visualLabel);
    visual.innerHTML = item.preview;
    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else if (["ArrowDown", "ArrowRight"].includes(event.key)) nextIndex = (index + 1) % tabs.length;
      else nextIndex = (index - 1 + tabs.length) % tabs.length;
      activateTab(tabs[nextIndex], true);
    });
  });

  const featureDetails = [
    { kicker: "01 / Legal research chat", title: "Ask a question. Leave with a starting point.", summary: "A conversational legal guide that helps people put a situation into words, understand the useful context, and see practical actions without beginning with legal jargon.", does: ["Explains everyday legal questions in plain language", "Brings relevant Indian legal context into the conversation", "Supports voice and multilingual interaction"], how: ["Describe the situation naturally", "The guide asks clarifying questions", "Review a clear response and next actions"], outcome: "A confusing situation becomes a more informed, manageable next step.", theme: "chat" },
    { kicker: "02 / Document review & drafting", title: "See what a document is really asking of you.", summary: "Turn a dense contract, notice, or scanned document into a practical review: important terms, possible risks, and useful questions appear in one easy-to-read view.", does: ["Extracts important clauses and key obligations", "Highlights potential risks and negotiation points", "Helps prepare drafts such as RTIs and consumer complaints"], how: ["Upload a document or scan", "Review the plain-language summary", "Use the suggested actions or create a draft"], outcome: "You can approach a document with clearer questions and better preparation.", theme: "review" },
    { kicker: "03 / Compliance, made manageable", title: "Know what needs attention before it becomes urgent.", summary: "A focused workspace for deadlines, filing tasks, regulatory changes, and structured business workflows—tailored to the way a business operates.", does: ["Tracks important filing and compliance deadlines", "Organizes business setup and compliance workflows", "Turns relevant regulatory updates into a clear action list"], how: ["Set up the business profile", "See dates and tasks in one place", "Work through actions and monitor progress"], outcome: "The important operational work stays visible and easier to act on.", theme: "compliance" },
    { kicker: "04 / Your documents, in one place", title: "A calmer home for the paperwork that matters.", summary: "Store and organize important legal and business files with useful categories and context, so documents are ready when a case, deadline, or conversation calls for them.", does: ["Organizes documents by purpose and category", "Connects files to related work and deadlines", "Supports searchable document knowledge and relationships"], how: ["Add or import a document", "Review its category and extracted information", "Find it later from the connected workspace"], outcome: "Less time searching through folders when the right document matters most.", theme: "vault" },
    { kicker: "05 / Cases and people", title: "Keep the human side of a legal matter connected.", summary: "Bring timelines, evidence, milestones, and lawyer connections into a single view so a complex matter has a visible path forward.", does: ["Tracks case milestones and supporting evidence", "Helps surface appropriate lawyer connections", "Keeps the next action clear across a case timeline"], how: ["Add the matter and its key details", "Organize documents and milestones", "Explore support when professional advice is needed"], outcome: "A case becomes easier to follow, prepare for, and discuss with the right person.", theme: "cases" },
    { kicker: "06 / Rights and resources", title: "Find support that fits the situation you’re in.", summary: "Discover government schemes, timely regulatory updates, and clear resource summaries that make public support and legal changes easier to understand.", does: ["Matches relevant government schemes and benefits", "Summarizes regulatory changes in plain language", "Turns updates into concise actions and checklists"], how: ["Share business or situation details", "Review matched resources and updates", "Follow the relevant eligibility or action steps"], outcome: "Useful public resources become easier to discover and put to use.", theme: "resources" }
  ];
  const modal = document.querySelector("[data-feature-modal]");
  const dialog = modal?.querySelector(".feature-dialog");
  const modalVisual = modal?.querySelector("[data-modal-visual]");
  let modalTrigger;
  let modalCloseTimer;

  function fillList(element, values, ordered = false) {
    element.replaceChildren(...values.map((value, index) => {
      const item = document.createElement("li");
      item.textContent = value;
      if (ordered) item.dataset.step = String(index + 1).padStart(2, "0");
      return item;
    }));
  }

  function openFeatureDetail(index, trigger) {
    const detail = featureDetails[index];
    if (!detail || !modal) return;
    modalTrigger = trigger;
    modal.querySelector("[data-modal-kicker]").textContent = detail.kicker;
    modal.querySelector("[data-modal-title]").textContent = detail.title;
    modal.querySelector("[data-modal-summary]").textContent = detail.summary;
    modal.querySelector("[data-modal-outcome]").textContent = detail.outcome;
    fillList(modal.querySelector("[data-modal-does]"), detail.does);
    fillList(modal.querySelector("[data-modal-how]"), detail.how, true);
    modalVisual.className = `modal-visual modal-visual-${detail.theme}`;
    modalVisual.innerHTML = `<span class="modal-orbit orbit-1"></span><span class="modal-orbit orbit-2"></span><span class="modal-symbol">${String(index + 1).padStart(2, "0")}</span><span class="modal-visual-label">${detail.kicker.split(" / ")[1]}</span>`;
    window.clearTimeout(modalCloseTimer);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.querySelector(".modal-close").focus();
  }

  function closeFeatureDetail() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalCloseTimer = window.setTimeout(() => { modal.hidden = true; }, 220);
    modalTrigger?.focus();
  }

  document.querySelectorAll(".feature-card").forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `Learn more about ${featureDetails[index].title}`);
    card.addEventListener("click", () => openFeatureDetail(index, card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFeatureDetail(index, card); }
    });
  });
  modal?.querySelectorAll("[data-close-modal]").forEach((control) => control.addEventListener("click", closeFeatureDetail));
  document.addEventListener("keydown", (event) => {
    if (!modal || modal.hidden) return;
    if (event.key === "Escape") closeFeatureDetail();
    if (event.key === "Tab") {
      const focusable = [...dialog.querySelectorAll("button,[href],[tabindex]:not([tabindex='-1'])")];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("open", open);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("open");
  }));

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("in-view"));
  }

  if (window.Lenis && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.25 });
    const raf = (time) => {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    };
    window.requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -12 });
      });
    });
  }
})();
