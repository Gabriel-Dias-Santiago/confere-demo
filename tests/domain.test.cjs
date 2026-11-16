"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { makeCases, stageOf, recordDecision, accountFields, bankComparison } = require("../assets/data.js");

const timestamp = "2026-11-15T19:00:00.000Z";
const verification = { outcome: "verified", note: "Confirmado pelo contato cadastrado.", registeredContact: true, ownershipChecked: true };
const approval = { outcome: "approved", note: "Contas e conferência revisadas." };

function rejectsWithoutMutation(item, actor, input, message) {
  const before = structuredClone(item);
  assert.throws(() => recordDecision(item, actor, input, timestamp), message);
  assert.deepEqual(item, before);
}

test("demonstration retains its two original records and creates isolated copies", () => {
  const cases = makeCases();
  assert.equal(cases.length, 2);
  assert.equal(cases[0].amountInCents, 1845000);
  assert.equal(stageOf(cases[0]), "pending");
  assert.equal(stageOf(cases[1]), "review");
  cases[0].events[0].note = "Alterado";
  assert.notEqual(makeCases()[0].events[0].note, "Alterado");
});

test("verification requires contact and account ownership before moving to review", () => {
  const item = makeCases()[0];
  rejectsWithoutMutation(item, "livia", { ...verification, registeredContact: false }, /contato cadastrado/);
  rejectsWithoutMutation(item, "livia", { ...verification, ownershipChecked: false }, /titularidade/);
  recordDecision(item, "livia", verification, timestamp);
  assert.equal(stageOf(item), "review");
  assert.equal(item.events.at(-1).registeredContact, true);
  assert.equal(item.events.at(-1).ownershipChecked, true);
  assert.equal(item.events.at(-1).at, timestamp);
});

test("the requester and a distinct verifier are both excluded from independent approval", () => {
  const item = makeCases()[0];
  recordDecision(item, "bruno", verification, timestamp);
  rejectsWithoutMutation(item, "livia", approval, /outro operador/);
  rejectsWithoutMutation(item, "bruno", approval, /outro operador/);
  recordDecision(item, "camila", approval, timestamp);
  assert.equal(stageOf(item), "approved");
  assert.equal(item.events.at(-1).actor, "camila");
  assert.equal(item.events.length, 3);
});

test("independent rejection records its justification and closes the request", () => {
  const item = makeCases()[1];
  const input = { outcome: "rejected", note: "Dados bancários divergentes do cadastro." };
  rejectsWithoutMutation(item, "livia", input, /outro operador/);
  recordDecision(item, "bruno", input, timestamp);
  assert.equal(stageOf(item), "rejected");
  assert.equal(item.events.at(-1).note, input.note);
  rejectsWithoutMutation(item, "camila", approval, /já foi registrada/);
});

test("a supplier denial needs the registered contact but not ownership confirmation", () => {
  const item = makeCases()[0];
  const denial = { outcome: "denied", note: "Fornecedor negou a alteração solicitada.", registeredContact: true, ownershipChecked: false };
  rejectsWithoutMutation(item, "livia", { ...denial, registeredContact: false }, /contato cadastrado/);
  recordDecision(item, "livia", denial, timestamp);
  assert.equal(stageOf(item), "rejected");
  assert.equal(item.events.at(-1).ownershipChecked, false);
});

test("invalid actors, outcomes, and note lengths leave the evidence unchanged", () => {
  const item = makeCases()[0];
  rejectsWithoutMutation(item, "unknown", verification, /operador/);
  rejectsWithoutMutation(item, "livia", { ...verification, outcome: "approved" }, /conferência/);
  rejectsWithoutMutation(item, "livia", { ...verification, note: "  ok  " }, /6 a 240/);
  rejectsWithoutMutation(item, "livia", { ...verification, note: "a".repeat(241) }, /6 a 240/);
  const review = makeCases()[1];
  rejectsWithoutMutation(review, "bruno", { ...approval, outcome: "verified" }, /decisão da revisão/);
});

test("a completed approval cannot be changed or appended to", () => {
  const item = makeCases()[1];
  recordDecision(item, "bruno", { ...approval, note: "  Conferência revisada.  " }, timestamp);
  assert.equal(item.events.at(-1).note, "Conferência revisada.");
  rejectsWithoutMutation(item, "camila", { ...approval, outcome: "rejected" }, /já foi registrada/);
});

test("the bank comparison highlights only changed fields and safely renders text", () => {
  const [first, second] = makeCases();
  assert.deepEqual(accountFields(first, "proposed").filter((field) => field.changed).map((field) => field.label), ["Banco", "Conta"]);
  assert.deepEqual(accountFields(second, "proposed").filter((field) => field.changed).map((field) => field.label), ["Conta"]);
  assert.equal(accountFields(first).some((field) => field.changed), false);
  const markup = bankComparison({ ...first, supplier: '<img src=x onerror="alert(1)">' });
  assert.ok(!markup.includes("<img"));
  assert.ok(markup.includes("&lt;img"));
  assert.equal((markup.match(/account-field changed/g) || []).length, 2);
});


test("missing note or invalid timestamp are rejected without mutating the request", () => {
  const item = makeCases()[0];
  rejectsWithoutMutation(item, "livia", { ...verification, note: null }, /6 a 240/);
  const before = structuredClone(item);
  assert.throws(() => recordDecision(item, "livia", verification, "not-a-date"), /data do registro/);
  assert.deepEqual(item, before);
});
