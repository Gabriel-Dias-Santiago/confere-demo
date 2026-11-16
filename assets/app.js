(function () {
  'use strict';
  const { actors, stages, eventTitles, verificationChoices, reviewChoices, makeCases, stageOf, recordDecision, formatCurrency, formatTime, escapeHTML: esc, bankComparison, icon } = window.Confere;
  const $ = id => document.getElementById(id);
  let cases = makeCases();
  let selectedId = cases[0].id;
  const drafts = new Map();
  let toastTimer;
  let evidenceTrigger;
  const mobile = () => matchMedia('(max-width: 700px)').matches;
  const selectedCase = () => cases.find(item => item.id === selectedId);
  const draftKey = () => selectedId + ':' + $('actor').value;
  const isClosed = stage => ['approved', 'rejected'].includes(stage);

  document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
  document.querySelectorAll('.nav-item').forEach(node => {
    const label = node.querySelector('.nav-label')?.textContent;
    if (label) { node.setAttribute('aria-label', label); node.title = label; }
  });

  function announce(message) {
    $('announcement').textContent = message;
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
  }
  function setPill(node, stage) {
    node.textContent = stages[stage];
    node.className = 'pill ' + stage;
  }
  function filteredCases() {
    const query = $('search').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return cases.filter(item => {
      const haystack = (item.supplier + ' ' + item.client + ' ' + item.id).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return haystack.includes(query) && ($('status-filter').value === 'all' || stageOf(item) === $('status-filter').value) && ($('company').value === 'all' || item.client === $('company').value);
    });
  }
  function saveDraft() {
    if ($('action').hidden) return;
    drafts.set(draftKey(), { stage: stageOf(selectedCase()), outcome: $('outcome').value, note: $('notes').value, registeredContact: $('contact-check').checked, ownershipChecked: $('ownership-check').checked });
  }
  function renderQueue() {
    const items = filteredCases();
    const scroll = $('queue-scroll').scrollTop;
    $('queue').innerHTML = items.map(item => `<li><button class="queue-button" type="button" data-case-id="${item.id}" aria-pressed="${item.id === selectedId}" aria-label="${esc(item.supplier)}, ${esc(item.client)}, ${esc(formatCurrency.format(item.amountInCents / 100))}, ${stages[stageOf(item)]}"><span class="queue-row-head"><span class="queue-name">${esc(item.supplier)}</span><span class="queue-id">${item.id}</span></span><span class="queue-client">${esc(item.client)}</span><span class="queue-row-foot"><span class="queue-amount">${formatCurrency.format(item.amountInCents / 100)}</span><span class="pill ${stageOf(item)}">${stages[stageOf(item)].replace('Aguardando ', '').replace('Alteração ', '')}</span></span></button></li>`).join('');
    $('queue-scroll').scrollTop = scroll;
    $('queue-count').textContent = items.length;
    $('queue-empty').hidden = items.length > 0;
    $('detail').hidden = !items.length;
    $('empty-detail').hidden = !!items.length;
    $('nav-evidence').disabled = !items.length;
  }
  function timelineHTML(item, documentary = false) {
    return item.events.map(event => `<li class="event"><time class="event-time" datetime="${esc(event.at)}">${formatTime.format(new Date(event.at))}</time><p class="event-title">${eventTitles[event.type]}</p><p class="event-actor">${actors[event.actor]}</p><p class="event-note">${esc(event.note)}</p>${documentary && event.registeredContact ? `<p class="document-checks">Contato cadastrado: conferido${event.ownershipChecked ? ' · Titularidade: conferida' : ''}</p>` : ''}</li>`).join('');
  }
  function syncChecks() {
    const mustCheckOwnership = stageOf(selectedCase()) === 'pending' && $('outcome').value === 'verified';
    $('ownership-check-row').hidden = !mustCheckOwnership;
    $('ownership-check').required = mustCheckOwnership;
    if (!mustCheckOwnership) $('ownership-check').checked = false;
    if (stageOf(selectedCase()) === 'review') {
      const decision = $('outcome').value;
      document.querySelectorAll('[data-decision]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.decision === decision)));
      $('submit').className = 'button ' + (decision === 'rejected' ? 'danger' : decision === 'approved' ? 'success' : 'primary');
      $('submit').innerHTML = (decision === 'rejected' ? 'Registrar rejeição' : decision === 'approved' ? 'Registrar aprovação' : 'Registrar decisão') + icon('arrow-right');
    }
  }
  function clearError() {
    $('form-error').hidden = true;
    $('action').querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
    $('action').querySelectorAll('.invalid').forEach(node => node.classList.remove('invalid'));
  }
  function renderAction(item, stage) {
    $('action').reset();
    $('action').hidden = true;
    $('review-block').hidden = true;
    $('closed-state').hidden = true;
    $('contact-card').hidden = stage !== 'pending';
    clearError();
    $('notes-count').textContent = '0 / 240';
    const verifying = stage === 'pending';
    $('step-caption').textContent = verifying ? 'ETAPA 01' : stage === 'review' ? 'ETAPA 02' : 'CONCLUÍDO';
    if (isClosed(stage)) {
      $('step-title').textContent = 'Decisão registrada';
      $('step-help').textContent = 'A evidência reúne a comparação, os operadores e as justificativas.';
      $('closed-state').className = 'closed-state ' + stage;
      $('closed-state').innerHTML = icon(stage === 'approved' ? 'check-circle' : 'x-circle') + `<div><h4>${stages[stage]}</h4><p>${stage === 'approved' ? 'A alteração foi aprovada apenas nesta demonstração.' : 'A conta proposta continua bloqueada nesta simulação.'}</p></div>`;
      $('closed-state').hidden = false;
      return;
    }
    $('step-title').textContent = verifying ? 'Conferir a alteração' : 'Revisão independente';
    $('step-help').textContent = verifying ? 'Fale com o fornecedor pelo contato já cadastrado e registre o resultado.' : 'Revise a comparação e a conferência antes de registrar sua decisão.';
    const actor = $('actor').value;
    if (!verifying && [item.events[0].actor, item.events.at(-1).actor].includes(actor)) {
      $('review-block').hidden = false;
      return;
    }
    const choices = verifying ? verificationChoices : reviewChoices;
    $('outcome').replaceChildren(new Option('Selecione o resultado', ''), ...Object.entries(choices).map(([value, label]) => new Option(label, value)));
    $('outcome-field').hidden = !verifying;
    $('decision-field').hidden = verifying;
    $('notes-label').textContent = verifying ? 'Registro da conferência' : 'Justificativa da decisão';
    $('notes').placeholder = verifying ? 'Como a alteração foi confirmada com o fornecedor?' : 'O que fundamenta sua aprovação ou rejeição?';
    $('contact-check-row').hidden = !verifying;
    $('contact-check').required = verifying;
    $('submit').className = 'button primary';
    $('submit').innerHTML = (verifying ? 'Registrar conferência' : 'Registrar decisão') + icon('arrow-right');
    $('action-note').textContent = verifying ? 'A próxima etapa exige outro operador.' : 'A decisão encerra esta solicitação.';
    const draft = drafts.get(draftKey());
    if (draft && draft.stage === stage) {
      $('outcome').value = draft.outcome;
      $('notes').value = draft.note;
      $('contact-check').checked = draft.registeredContact;
      $('ownership-check').checked = draft.ownershipChecked;
      $('notes-count').textContent = draft.note.length + ' / 240';
    }
    syncChecks();
    $('action').hidden = false;
  }
  function renderSteps(stage) {
    const index = stage === 'pending' ? 0 : stage === 'review' ? 1 : 2;
    [...$('progress-steps').children].forEach((step, i) => {
      const deniedDuringVerification = selectedCase().events.at(-1).type === 'denied';
      step.className = deniedDuringVerification && i === 0 ? 'failed' : i < index ? 'complete' : i === index ? (stage === 'rejected' ? 'failed' : 'current') : '';
      if (i === index) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
      step.querySelector('.step-number').innerHTML = deniedDuringVerification && i === 0 ? icon('close') : i < index ? icon('check') : i === index && isClosed(stage) ? icon(stage === 'approved' ? 'check' : 'close') : i + 1;
    });
    // A denied verification ends the request without an independent approval.
    if (selectedCase().events.at(-1).type === 'denied') {
      const review = $('progress-steps').children[1];
      review.className = 'skipped';
      review.querySelector('.step-number').textContent = '–';
      review.title = 'Etapa não realizada: alteração contestada na conferência.';
    } else $('progress-steps').children[1].removeAttribute('title');
  }
  function documentHTML(item) {
    return `<div class="document-top"><span class="brand-link">Confere<span class="brand-dot">.</span></span><span>EXEMPLO SIMULADO</span></div><h2 class="document-title">Registro de alteração bancária</h2><p class="document-reference">${esc(item.id)} · ${esc(item.client)}</p><span class="pill ${stageOf(item)}">${stages[stageOf(item)]}</span><dl class="document-metadata"><div><dt>Fornecedor</dt><dd>${esc(item.supplier)}</dd></div><div><dt>Empresa</dt><dd>${esc(item.client)}</dd></div><div><dt>Próximo pagamento</dt><dd class="document-value">${formatCurrency.format(item.amountInCents / 100)}</dd></div><div><dt>Solicitação registrada em</dt><dd>${formatTime.format(new Date(item.events[0].at))}</dd></div></dl><h3 class="document-section-title">01 / Comparação bancária</h3>${bankComparison(item)}<h3 class="document-section-title">02 / Contato de referência</h3><p class="document-contact">${esc(item.contact)}</p><h3 class="document-section-title">03 / Histórico da solicitação</h3><ol class="timeline document-timeline">${timelineHTML(item, true)}</ol><footer class="document-footer">Demonstração com dados fictícios. Este documento registra apenas as decisões simuladas nesta sessão; não autoriza um pagamento real.<br>Horários de Brasília · ${esc(item.id)} · Confere.</footer>`;
  }
  function renderDetail() {
    const item = selectedCase();
    const stage = stageOf(item);
    $('case-reference').textContent = item.id + ' / Alteração de conta';
    $('case-company').textContent = item.client;
    $('case-title').textContent = item.supplier;
    setPill($('case-status'), stage);
    $('payment-value').textContent = formatCurrency.format(item.amountInCents / 100);
    $('payment-gate').textContent = stage === 'approved' ? 'Conta autorizada na simulação' : 'Conta proposta bloqueada na simulação';
    document.querySelector('.payment-control').classList.toggle('is-approved', stage === 'approved');
    $('bank-comparison').innerHTML = bankComparison(item);
    $('registered-contact').textContent = item.contact;
    $('timeline').innerHTML = timelineHTML(item);
    $('event-count').textContent = item.events.length + (item.events.length === 1 ? ' evento' : ' eventos');
    $('detail-id').textContent = item.id;
    renderSteps(stage);
    renderAction(item, stage);
    $('print-document').innerHTML = documentHTML(item);
    document.title = item.supplier + ' — Confere.';
  }
  function render() { renderQueue(); renderDetail(); }
  function applyFilters() {
    saveDraft();
    const visible = filteredCases();
    if (visible.length && !visible.some(item => item.id === selectedId)) selectedId = visible[0].id;
    render();
    announce(visible.length + (visible.length === 1 ? ' solicitação encontrada.' : ' solicitações encontradas.'));
  }
  function showQueue() {
    saveDraft();
    $('app-shell').classList.remove('show-detail');
    if (mobile()) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const button = $('queue').querySelector(`[data-case-id="${selectedId}"]`);
      (button || $('search')).focus({ preventScroll: true });
    } else $('search').focus();
  }
  $('queue').addEventListener('click', event => {
    const button = event.target.closest('[data-case-id]');
    if (!button) return;
    saveDraft();
    const changed = selectedId !== button.dataset.caseId;
    selectedId = button.dataset.caseId;
    if (changed) render();
    $('app-shell').classList.add('show-detail');
    if (mobile()) window.scrollTo({ top: 0, behavior: 'instant' }); else if (changed) $('detail').scrollTop = 0;
    $('case-title').focus({ preventScroll: true });
  });
  $('search').addEventListener('input', applyFilters);
  $('status-filter').addEventListener('change', applyFilters);
  $('company').addEventListener('change', () => { $('company-compact').value = $('company').value; applyFilters(); });
  $('company-compact').addEventListener('change', () => { $('company').value = $('company-compact').value; applyFilters(); });
  $('clear-filters').addEventListener('click', () => {
    $('search').value = '';
    $('status-filter').value = 'all';
    $('company').value = 'all';
    $('company-compact').value = 'all';
    applyFilters();
    $('search').focus();
  });
  $('nav-queue').addEventListener('click', showQueue);
  $('back-to-queue').addEventListener('click', showQueue);
  $('actor').addEventListener('change', () => {
    const name = actors[$('actor').value];
    $('actor-avatar').textContent = name.split(' ').map(word => word[0]).join('');
    renderAction(selectedCase(), stageOf(selectedCase()));
    announce('Operador alterado para ' + name + '.');
  });
  $('switch-actor').addEventListener('click', () => { $('actor').focus(); });
  $('outcome').addEventListener('change', () => { syncChecks(); clearError(); saveDraft(); });
  document.querySelectorAll('[data-decision]').forEach(button => button.addEventListener('click', () => {
    $('outcome').value = button.dataset.decision;
    syncChecks(); clearError(); saveDraft();
  }));
  $('notes').addEventListener('input', () => {
    $('notes-count').textContent = $('notes').value.length + ' / 240';
    clearError(); saveDraft();
  });
  ['contact-check', 'ownership-check'].forEach(id => $(id).addEventListener('change', () => { clearError(); saveDraft(); }));
  $('action').addEventListener('submit', event => {
    event.preventDefault();
    clearError();
    const item = selectedCase();
    let invalid;
    let message;
    if (!$('outcome').value) {
      invalid = stageOf(item) === 'pending' ? $('outcome') : document.querySelector('[data-decision]');
      message = stageOf(item) === 'pending' ? 'Selecione o resultado da conferência.' : 'Escolha aprovar ou rejeitar a alteração.';
    } else if ($('notes').value.trim().length < 6) { invalid = $('notes'); message = 'Registre uma justificativa com pelo menos 6 caracteres.'; }
    else if (stageOf(item) === 'pending' && !$('contact-check').checked) { invalid = $('contact-check'); message = 'Confirme a conferência pelo contato já cadastrado.'; }
    else if (stageOf(item) === 'pending' && $('outcome').value === 'verified' && !$('ownership-check').checked) { invalid = $('ownership-check'); message = 'Confirme a titularidade da conta proposta.'; }
    try {
      if (message) throw new Error(message);
      recordDecision(item, $('actor').value, { outcome: $('outcome').value, note: $('notes').value, registeredContact: $('contact-check').checked, ownershipChecked: $('ownership-check').checked }, new Date().toISOString());
    } catch (error) {
      $('form-error').textContent = error.message;
      $('form-error').hidden = false;
      if (invalid) { invalid.setAttribute('aria-invalid', 'true'); invalid.classList.add('invalid'); invalid.focus(); }
      return;
    }
    drafts.delete(draftKey());
    // Keep the just-decided request visible even when its previous status was filtered.
    if ($('status-filter').value !== 'all' && $('status-filter').value !== stageOf(item)) $('status-filter').value = 'all';
    render();
    const messageDone = stageOf(item) === 'review' ? 'Conferência registrada. Aguardando outro operador.' : stages[stageOf(item)] + '.';
    toast(messageDone);
    $('step-title').setAttribute('tabindex', '-1');
    $('step-title').focus({ preventScroll: true });
  });
  function openEvidence(event) {
    evidenceTrigger = event.currentTarget;
    $('evidence-content').innerHTML = documentHTML(selectedCase());
    $('evidence-dialog').showModal();
    $('evidence-content').scrollTop = 0;
    $('close-evidence').focus();
  }
  ['nav-evidence', 'open-evidence', 'history-evidence'].forEach(id => $(id).addEventListener('click', openEvidence));
  $('close-evidence').addEventListener('click', () => $('evidence-dialog').close());
  $('evidence-dialog').addEventListener('close', () => evidenceTrigger?.focus({ preventScroll: true }));
  $('evidence-dialog').addEventListener('click', event => { if (event.target === $('evidence-dialog') && event.clientX < $('evidence-dialog').getBoundingClientRect().left) $('evidence-dialog').close(); });
  $('export').addEventListener('click', () => {
    const item = selectedCase();
    const evidence = { simulated: true, requestId: item.id, company: item.client, supplier: item.supplier, status: stages[stageOf(item)], previousAccount: item.previousAccount, proposedAccount: item.proposedAccount, nextPaymentAmountInCents: item.amountInCents, currency: 'BRL', events: item.events.map(event => ({ ...event, actorName: actors[event.actor] })) };
    const file = new Blob([JSON.stringify(evidence, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = Object.assign(document.createElement('a'), { href: url, download: item.id + '-evidencia.json' });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Evidência JSON preparada para download.');
  });
  $('print-evidence').addEventListener('click', () => {
    $('print-document').innerHTML = documentHTML(selectedCase());
    window.print();
  });
  $('reset').addEventListener('click', () => $('reset-dialog').showModal());
  $('cancel-reset').addEventListener('click', () => $('reset-dialog').close());
  $('confirm-reset').addEventListener('click', () => {
    cases = makeCases(); selectedId = cases[0].id; drafts.clear();
    $('actor').value = 'livia'; $('actor-avatar').textContent = 'LM';
    $('search').value = ''; $('status-filter').value = 'all'; $('company').value = 'all'; $('company-compact').value = 'all';
    $('reset-dialog').close(); $('app-shell').classList.remove('show-detail');
    render(); toast('Demonstração reiniciada.');
    if (mobile()) window.scrollTo({ top: 0, behavior: 'instant' });
  });
  render();
})();
