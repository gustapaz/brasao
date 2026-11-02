import { test } from "node:test";
import assert from "node:assert/strict";
import { Duel, CARDS, readSave, record, bindLifecycle } from "../src/game.js";

function take(game, key) {
  for (const zone of ["deck", "discard", "hand"]) {
    const index = game[zone].findIndex((c) => c.key === key);
    if (index >= 0) {
      const [card] = game[zone].splice(index, 1);
      game.hand.push(card);
      return card.id;
    }
  }
  throw new Error("Missing fixture card");
}
function choose(game) {
  const playable = game.hand.filter((c) => game.canPlay(c.id));
  let card = playable.find((c) => c.key === "breath");
  if (card) return card;
  if (game.hp <= Math.max(12, game.intent.value * 1.2)) {
    card = playable.find((c) => c.key === "mend" && game.hp < game.maxHp - 3);
    if (card) return card;
    if (game.intent.type === "attack" && game.guard < game.intent.value) {
      card = playable.find((c) => c.key === "guard");
      if (card) return card;
    }
  }
  const attacks = playable.filter((c) =>
    ["attack", "pierce"].includes(CARDS[c.key].type),
  );
  const value = (c) => {
    const item = CARDS[c.key];
    return (
      Math.max(
        0,
        item.value +
          game.edge -
          (item.type === "pierce" ? 0 : game.enemy.guard),
      ) / item.cost
    );
  };
  attacks.sort((a, b) => value(b) - value(a));
  if (attacks.length) return attacks[0];
  return (
    playable.find(
      (c) =>
        c.key === "guard" &&
        game.intent.type === "attack" &&
        game.guard < game.intent.value,
    ) || playable.find((c) => c.key === "mend" && game.hp < game.maxHp)
  );
}
function campaign(difficulty = "apprentice", seed = 8642) {
  const game = new Duel(difficulty, seed);
  let steps = 0;
  while (!["won", "lost"].includes(game.mode) && steps++ < 500) {
    const all = [...game.deck, ...game.discard, ...game.hand];
    assert.equal(all.length, 12);
    assert.equal(new Set(all.map((c) => c.id)).size, 12);
    if (game.mode === "reward") {
      game.reward("edge");
      continue;
    }
    const card = choose(game);
    if (card) game.play(card.id);
    else game.endTurn();
  }
  return game;
}

test("seed validation, deterministic shuffle and exactly twelve unique cards", () => {
  const a = new Duel(),
    b = new Duel();
  assert.deepEqual(a.hand, b.hand);
  assert.deepEqual(a.deck, b.deck);
  assert.equal(a.hand.length, 5);
  assert.equal(a.deck.length, 7);
  assert.equal(a.energy, 3);
  const keys = [...a.hand, ...a.deck].map((c) => c.key);
  assert.equal(keys.filter((k) => k === "cut").length, 5);
  assert.equal(keys.filter((k) => k === "guard").length, 4);
  assert.equal(new Duel("unknown", NaN).seed, 8642);
  assert.equal(new Duel("veteran").hp, 32);
  assert.equal(a.hp, 40);
});
test("invalid and unaffordable plays cannot alter resources", () => {
  const game = new Duel();
  const id = take(game, "pierce");
  game.energy = 1;
  const hp = game.enemy.hp;
  assert.equal(game.play(id), false);
  assert.equal(game.play("missing"), false);
  assert.equal(game.energy, 1);
  assert.equal(game.enemy.hp, hp);
  assert.ok(game.hand.some((c) => c.id === id));
});
test("Corte consumes guard before HP and charges cost once", () => {
  const game = new Duel();
  const id = take(game, "cut");
  game.enemy.guard = 4;
  game.play(id);
  assert.equal(game.enemy.guard, 0);
  assert.equal(game.enemy.hp, 32);
  assert.equal(game.energy, 2);
  assert.equal(game.play(id), false);
  assert.equal(game.energy, 2);
});
test("Ruptura bypasses guard and includes attack upgrades", () => {
  const game = new Duel();
  const id = take(game, "pierce");
  game.enemy.guard = 10;
  game.edge = 2;
  game.play(id);
  assert.equal(game.enemy.guard, 10);
  assert.equal(game.enemy.hp, 21);
  assert.equal(game.energy, 1);
});
test("guard reduces the announced attack and expires on the next player turn", () => {
  const game = new Duel();
  game.play(take(game, "guard"));
  const attack = game.intent.value;
  assert.equal(attack, 6);
  game.endTurn();
  assert.equal(game.hp, 40 - Math.max(0, attack - 5));
  assert.equal(game.guard, 0);
  assert.equal(game.turn, 2);
  assert.equal(game.energy, 3);
  assert.equal(game.hand.length, 5);
});
test("healing is capped and cannot consume a card twice", () => {
  const game = new Duel();
  game.hp = 39;
  const id = take(game, "mend");
  game.play(id);
  assert.equal(game.hp, 40);
  assert.equal(game.play(id), false);
  assert.equal(game.hp, 40);
});
test("Fôlego draws a real other card, conserves cards and caps energy", () => {
  const game = new Duel();
  const id = take(game, "breath");
  const size = game.hand.length;
  game.energy = 6;
  game.play(id);
  assert.equal(game.energy, 6);
  assert.equal(game.hand.length, size);
  assert.ok(!game.hand.some((c) => c.id === id));
  assert.equal([...game.deck, ...game.discard, ...game.hand].length, 12);
});
test("empty draw pile shuffles discard without duplicating IDs and hand cap is seven", () => {
  const game = new Duel();
  game.discard.push(...game.deck);
  game.deck = [];
  game.draw(20);
  assert.equal(game.hand.length, 7);
  const all = [...game.hand, ...game.deck, ...game.discard];
  assert.equal(all.length, 12);
  assert.equal(new Set(all.map((c) => c.id)).size, 12);
});
test("enemy guard intent is exact and lasts through the following player turn", () => {
  const game = new Duel();
  game.endTurn();
  assert.deepEqual(game.intent, { type: "guard", value: 6 });
  game.endTurn();
  assert.equal(game.enemy.guard, 6);
  game.play(take(game, "cut"));
  assert.equal(game.enemy.guard, 0);
  assert.equal(game.enemy.hp, 34);
});
test("defeating an enemy blocks play/end-turn until exactly one valid reward", () => {
  const game = new Duel();
  game.enemy.hp = 1;
  game.play(take(game, "cut"));
  assert.equal(game.mode, "reward");
  assert.equal(game.endTurn(), false);
  assert.equal(game.play(game.hand[0]?.id), false);
  assert.equal(game.reward("bad"), false);
  assert.equal(game.stage, 0);
  assert.equal(game.reward("edge"), true);
  assert.equal(game.stage, 1);
  assert.equal(game.edge, 2);
  assert.equal(game.reward("vigor"), false);
});
test("vigor adds maximum HP and heals both reward and between-duel recovery", () => {
  const game = new Duel();
  game.mode = "reward";
  game.hp = 20;
  game.reward("vigor");
  assert.equal(game.maxHp, 48);
  assert.equal(game.hp, 36);
  assert.equal(game.enemy.hp, 46);
  assert.equal(game.guard, 0);
  assert.equal(game.turn, 1);
});
test("tempo adds energy only in the first two turns and bonuses can stack", () => {
  const game = new Duel();
  game.mode = "reward";
  game.reward("tempo");
  assert.equal(game.energy, 4);
  game.endTurn();
  assert.equal(game.energy, 4);
  game.endTurn();
  assert.equal(game.energy, 3);
  game.mode = "reward";
  game.reward("tempo");
  assert.equal(game.energy, 5);
});
test("both difficulties have a complete winning path through normal card actions", () => {
  for (const difficulty of ["apprentice", "veteran"]) {
    const game = campaign(difficulty);
    assert.equal(game.mode, "won");
    assert.equal(game.stage, 2);
    assert.ok(game.hp > 0);
    assert.equal(game.rewards.length, 2);
    assert.ok(game.totalTurns > 0);
    assert.ok(game.played > 12);
    const score = game.score;
    assert.equal(game.endTurn(), false);
    assert.equal(game.score, score);
  }
});
test("passing without defense loses and result cannot be changed by further actions", () => {
  const game = new Duel();
  for (let i = 0; i < 30 && game.mode === "playing"; i++) game.endTurn();
  assert.equal(game.mode, "lost");
  assert.equal(game.hp, 0);
  const turn = game.turn;
  assert.equal(game.endTurn(), false);
  assert.equal(game.turn, turn);
});
test("escalation after turn 20 and exhaustion at turn 40 bound a duel", () => {
  const game = new Duel("veteran");
  game.turn = 22;
  assert.ok(game.intent.value >= 9);
  game.turn = 40;
  game.hp = game.maxHp = 10000;
  game.endTurn();
  assert.equal(game.mode, "lost");
  assert.match(game.log[0], /Exaustão/);
});
test("pause blocks all actions and fresh attempts reset seed, bonuses and piles", () => {
  const game = new Duel();
  game.pause();
  assert.equal(game.play(game.hand[0].id), false);
  assert.equal(game.endTurn(), false);
  assert.equal(game.reward("edge"), false);
  game.resume();
  assert.equal(game.mode, "playing");
  const fresh = new Duel(game.difficulty, game.seed);
  assert.equal(fresh.played, 0);
  assert.equal(fresh.edge, 0);
  assert.deepEqual(fresh.hand, new Duel().hand);
});
test("save rejects corrupt values; winning records separate difficulties and retain best", () => {
  for (const raw of [null, "{", "null", '{"version":5}'])
    assert.equal(readSave(raw).best.apprentice, 0);
  const invalid = readSave(
    '{"version":1,"muted":"yes","wins":{"apprentice":-1},"best":{"veteran":1e30}}',
  );
  assert.equal(invalid.muted, true);
  assert.equal(invalid.wins.apprentice, 0);
  assert.equal(invalid.best.veteran, 0);
  const save = readSave(null),
    game = campaign();
  assert.equal(record(save, new Duel()), save);
  const updated = record(save, game);
  assert.equal(updated.wins.apprentice, 1);
  assert.equal(updated.wins.veteran, 0);
  assert.equal(updated.best.apprentice, game.score);
});
test("lifecycle pauses on blur/hidden, never auto-resumes and detaches listeners", () => {
  const win = new EventTarget(),
    doc = Object.assign(new EventTarget(), { hidden: false }),
    game = new Duel();
  const cleanup = bindLifecycle(win, doc, () => game.pause());
  win.dispatchEvent(new Event("blur"));
  assert.equal(game.mode, "paused");
  game.resume();
  doc.hidden = true;
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(game.mode, "paused");
  doc.hidden = false;
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(game.mode, "paused");
  cleanup();
  game.resume();
  win.dispatchEvent(new Event("blur"));
  assert.equal(game.mode, "playing");
});
