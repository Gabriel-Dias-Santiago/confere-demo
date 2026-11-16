/* The commercial preview and the workspace share these demonstration records and rules. */
(function (root) {
  "use strict";

  const actors = { livia: "Lívia Mendes", bruno: "Bruno Reis", camila: "Camila Torres" };
  const stages = {
    pending: "Aguardando conferência",
    review: "Aguardando aprovação",
    approved: "Alteração aprovada",
    rejected: "Alteração rejeitada"
  };
  const eventTitles = {
    intake: "Solicitação registrada",
    verified: "Fornecedor e titularidade conferidos",
    denied: "Alteração contestada na conferência",
    approved: "Alteração aprovada por segundo operador",
    rejected: "Alteração rejeitada pelo segundo operador"
  };
  const verificationChoices = {
    verified: "Fornecedor confirmou a solicitação",
    denied: "Fornecedor negou ou houve divergência"
  };
  const reviewChoices = {
    approved: "Aprovar alteração cadastral",
    rejected: "Rejeitar alteração cadastral"
  };

  function makeCases() {
    const startedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    return [
      {
        id: "SOL-014",
        supplier: "Papelaria Horizonte",
        client: "Mercado Parque",
        amountInCents: 1845000,
        previousAccount: "Banco A · final 4827",
        proposedAccount: "Banco B · final 9013",
        contact: "Cadastro financeiro do fornecedor · ramal fictício 105",
        events: [{ type: "intake", actor: "livia", at: startedAt, note: "Pedido de atualização recebido por e-mail." }]
      },
      {
        id: "SOL-015",
        supplier: "Oficina Campo Norte",
        client: "Clínica Vila Serena",
        amountInCents: 620000,
        previousAccount: "Banco C · final 1012",
        proposedAccount: "Banco C · final 7004",
        contact: "Cadastro financeiro do fornecedor · ramal fictício 207",
        events: [
          { type: "intake", actor: "livia", at: startedAt, note: "Pedido de atualização recebido pelo portal do cliente." },
          {
            type: "verified", actor: "livia", at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            note: "Fornecedor confirmou a solicitação e a titularidade foi conferida no cenário fictício.",
            registeredContact: true, ownershipChecked: true
          }
        ]
      }
    ];
  }

  function stageOf(item) {
    const last = item.events.at(-1).type;
    if (last === "intake") return "pending";
    if (last === "verified") return "review";
    if (last === "approved") return "approved";
    return "rejected";
  }

  function recordDecision(item, actor, input, timestamp) {
    const stage = stageOf(item);
    const note = typeof input?.note === 'string' ? input.note.trim() : '';
    if (!Object.hasOwn(actors, actor)) throw new Error("Selecione um operador da demonstração.");
    if (!Number.isFinite(Date.parse(timestamp))) throw new Error('A data do registro é inválida.');
    if (note.length < 6 || note.length > 240) {
      throw new Error("Registre o resultado da conferência ou revisão em 6 a 240 caracteres.");
    }
    if (stage === "pending") {
      if (!Object.hasOwn(verificationChoices, input.outcome) || !input.registeredContact) {
        throw new Error("Registre o resultado da conferência feita pelo contato cadastrado.");
      }
      if (input.outcome === "verified" && !input.ownershipChecked) {
        throw new Error("Confirme que a titularidade foi conferida antes de encaminhar.");
      }
      item.events.push({
        type: input.outcome, actor, at: timestamp, note,
        registeredContact: true, ownershipChecked: input.outcome === "verified"
      });
      return;
    }
    if (stage === "review") {
      const verifier = item.events.at(-1).actor;
      const requester = item.events[0].actor;
      if (actor === verifier || actor === requester) {
        throw new Error("A decisão precisa ser registrada por outro operador.");
      }
      if (!Object.hasOwn(reviewChoices, input.outcome)) throw new Error("Selecione a decisão da revisão.");
      item.events.push({ type: input.outcome, actor, at: timestamp, note });
      return;
    }
    throw new Error("A decisão desta solicitação já foi registrada.");
  }

  const formatCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const formatTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo"
  });

  function escapeHTML(value) {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value).replace(/[&<>"']/g, (character) => entities[character]);
  }

  function accountFields(item, kind = "previous") {
    const current = item.previousAccount.split(" · ");
    const proposed = item.proposedAccount.split(" · ");
    const isProposed = kind === "proposed";
    const values = isProposed ? proposed : current;
    return [
      { label: "Banco", value: values[0], changed: isProposed && current[0] !== proposed[0] },
      { label: "Conta", value: values[1], changed: isProposed && current[1] !== proposed[1] },
      { label: "Titular", value: item.supplier, changed: false }
    ];
  }

  function bankComparison(item) {
    return '<div class="comparison-grid">' + ["previous", "proposed"].map((kind) => {
      const fields = accountFields(item, kind);
      const proposed = kind === "proposed";
      const changes = fields.filter((field) => field.changed).length;
      const hint = proposed ? `${changes} ${changes === 1 ? "campo alterado" : "campos alterados"}` : "Cadastro atual";
      return `<section class="account-card ${proposed ? "proposed" : "current"}">
        <div class="account-card-heading"><h3>${proposed ? "Conta proposta" : "Conta cadastrada"}</h3><span class="account-hint">${hint}</span></div>
        <dl class="account-fields">${fields.map((field) => `<div class="account-field${field.changed ? " changed" : ""}"><dt>${field.label}${field.changed ? '<span class="sr-only"> — alterado</span>' : ""}</dt><dd>${escapeHTML(field.value)}${field.changed ? '<span class="change-mark" aria-hidden="true">↗</span>' : ""}</dd></div>`).join("")}</dl>
      </section>`;
    }).join("") + "</div>";
  }

  const iconPaths = {
    "arrow-right": '<path d="M4 12h16M13 5l7 7-7 7"/>',
    "arrow-up-right": '<path d="M6 18 18 6M6 6h12v12"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    inbox: '<path d="M4 4h16l2 11v5H2v-5L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/>',
    file: '<path d="M14 2H5v20h14V7l-5-5Z"/><path d="M14 2v6h5M8 12h8M8 16h8"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "arrow-left": '<path d="M20 12H4m7-7-7 7 7 7"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    phone: '<path d="M8 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-4l-5-2-2 2c-3-1.3-4.7-3-6-6l2-2-2-5Z"/>',
    building: '<path d="M4 21V3h12v18M16 10h4v11M2 21h20M8 7h4M8 11h4M8 15h4M9 21v-3h2v3"/>',
    reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
    users: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 5v1"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    printer: '<path d="M6 9V3h12v6M6 18H3v-9h18v9h-3M6 14h12v7H6zM17 12h1"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  };

  function icon(name) {
    return `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconPaths[name] || iconPaths.file}</svg>`;
  }

  const api = { actors, stages, eventTitles, verificationChoices, reviewChoices, makeCases, stageOf, recordDecision, formatCurrency, formatTime, escapeHTML, accountFields, bankComparison, icon };
  root.Confere = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
