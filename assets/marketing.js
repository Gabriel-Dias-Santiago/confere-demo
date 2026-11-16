"use strict";
(() => {
  const C = window.Confere;
  const cases = C.makeCases();
  const item = cases[0];
  const esc = C.escapeHTML;
  const icon = C.icon;
  const pill = (stage, shortLabel) => `<span class="pill ${stage}">${esc(shortLabel || C.stages[stage])}</span>`;
  const preview = document.getElementById("product-preview");
  preview.innerHTML = `
    <div class="preview-nav" aria-hidden="true">
      <div class="preview-brand">Confere<span class="brand-dot">.</span></div>
      <div class="preview-company">${icon("building")}<span>Todas as empresas</span>${icon("chevron-down")}</div>
      <div class="preview-nav-label">Área de trabalho</div>
      <div class="preview-nav-item active">${icon("inbox")}<span>Solicitações</span></div>
      <div class="preview-nav-foot"><span class="caption-dot"></span><span>Ambiente de demonstração</span></div>
    </div>
    <div class="preview-queue">
      <div class="preview-queue-title">Solicitações <span>02</span></div>
      <div class="preview-search">${icon("search")}Buscar fornecedor</div>
      ${cases.map((entry, i) => `<div class="preview-row ${i === 0 ? "active" : ""}"><strong>${esc(entry.supplier)}</strong><span>${esc(entry.client)}</span><div class="preview-row-bottom">${pill(C.stageOf(entry), i === 0 ? "Em conferência" : "Em aprovação")}<b>${esc(C.formatCurrency.format(entry.amountInCents / 100))}</b></div></div>`).join("")}
    </div>
    <div class="preview-detail">
      <div class="preview-detail-topline"><span>Solicitações <span aria-hidden="true">/</span> ${esc(item.id)}</span><span>${icon("shield")} Dados simulados</span></div>
      <h2>${esc(item.supplier)}</h2><p class="preview-supplier-meta">${esc(item.client)} · Alteração de conta bancária</p>
      <div class="preview-amount-row"><div><span>Próximo pagamento</span><strong>${esc(C.formatCurrency.format(item.amountInCents / 100))}</strong></div>${pill("pending", "Aguardando conferência")}</div>
      ${C.bankComparison(item)}
      <div class="preview-next"><div><span>PRÓXIMA ETAPA</span><strong>Conferir com o fornecedor</strong></div><a class="button primary" href="validacao-de-fornecedores.html">Conferir alteração ${icon("arrow-right")}</a></div>
    </div>`;

  document.getElementById("flow-panel-0").innerHTML = `
    <div class="flow-panel-label">${esc(item.id)} · Conferência <span>Exemplo simulado</span></div>
    <h4>Confirme com quem você conhece.</h4><p class="flow-panel-intro">Use o contato do cadastro para conferir a origem do pedido.</p>
    <div class="flow-contact">${icon("phone")}<div><small>Contato já cadastrado</small><p>Financeiro · ${esc(item.supplier)}<br>Ramal fictício 105</p></div></div>
    <div class="flow-sample-field"><span>Evidência da conferência</span><p>Fornecedor confirmou a alteração pelo contato cadastrado.</p></div>
    <p class="flow-sample-check">${icon("check-circle")} Contato e titularidade conferidos</p>`;
  document.getElementById("flow-panel-1").innerHTML = `
    <div class="flow-panel-label">${esc(item.id)} · Revisão independente <span>Exemplo simulado</span></div>
    <h4>Uma segunda pessoa decide.</h4><p class="flow-panel-intro">Quem solicitou ou conferiu não pode aprovar a alteração.</p>
    <div class="flow-reviewer"><span class="flow-avatar">BR</span><div><strong>Bruno Reis</strong><small>Operador da revisão independente</small></div></div>
    <div class="flow-sample-field"><span>Justificativa da decisão</span><p>Contas e conferência revisadas. Alteração autorizada neste exemplo.</p></div>
    <div class="flow-buttons" aria-label="Exemplo de decisões disponíveis"><span class="flow-faux-button">${icon("check")} Aprovar alteração</span><span class="flow-faux-button reject">${icon("close")} Rejeitar</span></div>`;
  document.getElementById("flow-panel-2").innerHTML = `
    <div class="flow-panel-label">${esc(item.id)} · Evidência <span>Exemplo simulado</span></div>
    <h4>O caminho da decisão, registrado.</h4>
    <ol class="flow-event-list"><li class="flow-event"><strong>Solicitação registrada</strong><p>Lívia Mendes · 09:00<br>Pedido de atualização recebido por e-mail.</p></li><li class="flow-event"><strong>Fornecedor e titularidade conferidos</strong><p>Lívia Mendes · 09:12<br>Solicitação confirmada pelo contato cadastrado.</p></li><li class="flow-event"><strong>Alteração aprovada</strong><p>Bruno Reis · 09:20<br>Contas e conferência revisadas.</p></li></ol>
    <a class="flow-download" href="validacao-de-fornecedores.html">${icon("file")} Consultar e exportar na demonstração ${icon("arrow-up-right")}</a>`;

  document.querySelectorAll("[data-icon]").forEach(node => { node.innerHTML = icon(node.dataset.icon); });
  const steps = [...document.querySelectorAll(".flow-item")];
  function selectStep(index) {
    steps.forEach((step, i) => {
      const active = i === index;
      step.classList.toggle("active", active);
      step.querySelector(".flow-trigger").setAttribute("aria-expanded", String(active));
      step.querySelector(".flow-description").hidden = !active;
      step.querySelector(".flow-panel").hidden = !active;
    });
  }
  steps.forEach((step, index) => {
    const trigger = step.querySelector(".flow-trigger");
    trigger.addEventListener("click", () => selectStep(index));
    trigger.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowDown") next = (index + 1) % steps.length;
      else if (event.key === "ArrowUp") next = (index + steps.length - 1) % steps.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = steps.length - 1;
      else return;
      event.preventDefault();
      steps[next].querySelector(".flow-trigger").focus();
    });
  });
})();
