export const CARDS = {
  cut: {
    name: "Corte",
    cost: 1,
    type: "attack",
    value: 6,
    text: "Cause 6 de dano.",
    symbol: "sword",
  },
  guard: {
    name: "Aparo",
    cost: 1,
    type: "guard",
    value: 5,
    text: "Ganhe 5 de guarda.",
    symbol: "shield",
  },
  pierce: {
    name: "Ruptura",
    cost: 2,
    type: "pierce",
    value: 11,
    text: "Cause 11 de dano. Ignore a guarda.",
    symbol: "spear",
  },
  mend: {
    name: "Remendo",
    cost: 1,
    type: "heal",
    value: 4,
    text: "Recupere 4 de vida.",
    symbol: "heart",
  },
  breath: {
    name: "Fôlego",
    cost: 0,
    type: "energy",
    value: 1,
    text: "Ganhe 1 de fôlego e compre 1 carta.",
    symbol: "spark",
  },
};
export const ENEMIES = [
  {
    name: "A Sentinela",
    title: "O primeiro juramento",
    hp: 34,
    pattern: [
      { type: "attack", value: 7 },
      { type: "guard", value: 6 },
      { type: "attack", value: 11 },
    ],
  },
  {
    name: "O Ferreiro",
    title: "A força tem um preço",
    hp: 46,
    pattern: [
      { type: "attack", value: 9 },
      { type: "attack", value: 14 },
      { type: "guard", value: 10 },
    ],
  },
  {
    name: "A Soberana",
    title: "O último estandarte",
    hp: 62,
    pattern: [
      { type: "guard", value: 10 },
      { type: "attack", value: 16 },
      { type: "attack", value: 10 },
      { type: "attack", value: 18 },
    ],
  },
];
export const REWARDS = [
  { id: "edge", name: "Fio de aço", text: "+2 de dano em cada ataque." },
  {
    id: "vigor",
    name: "Coração firme",
    text: "+8 de vida máxima. Cure 8 agora.",
  },
  {
    id: "tempo",
    name: "Primeiro impulso",
    text: "+1 fôlego nos dois primeiros turnos de cada duelo.",
  },
];
export class Duel {
  constructor(difficulty = "apprentice", seed = 8642) {
    this.difficulty = difficulty === "veteran" ? "veteran" : "apprentice";
    this.seed =
      Number.isInteger(seed) && seed > 0 && seed < 1000000 ? seed : 8642;
    this.rng = this.seed;
    this.maxHp = this.difficulty === "apprentice" ? 40 : 32;
    this.hp = this.maxHp;
    this.guard = 0;
    this.energy = 3;
    this.edge = 0;
    this.tempo = 0;
    this.stage = 0;
    this.turn = 1;
    this.totalTurns = 0;
    this.played = 0;
    this.mode = "playing";
    this.log = [];
    this.rewards = [];
    this.startDuel();
  }
  random() {
    this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }
  shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  startDuel() {
    this.turn = 1;
    this.guard = 0;
    this.energy = Math.min(6, 3 + this.tempo);
    this.enemy = {
      ...ENEMIES[this.stage],
      guard: 0,
      maxHp: ENEMIES[this.stage].hp,
    };
    const keys = [
      "cut",
      "cut",
      "cut",
      "cut",
      "cut",
      "guard",
      "guard",
      "guard",
      "guard",
      "pierce",
      "mend",
      "breath",
    ];
    this.deck = this.shuffle(
      keys.map((key, index) => ({ id: `${this.stage}-${index}`, key })),
    );
    this.discard = [];
    this.hand = [];
    this.draw(5);
    this.say(`${this.enemy.name} entrou no duelo.`);
  }
  get intent() {
    const action =
      ENEMIES[this.stage].pattern[
        (this.turn - 1) % ENEMIES[this.stage].pattern.length
      ];
    return {
      ...action,
      value:
        action.type === "attack"
          ? Math.max(
              1,
              Math.round(
                (action.value + Math.max(0, this.turn - 20)) *
                  (this.difficulty === "apprentice" ? 0.8 : 1),
              ),
            )
          : action.value,
    };
  }
  get score() {
    return (
      this.stage * 500 +
      (this.mode === "won" ? 700 : 0) +
      this.hp * 10 +
      Math.max(0, 150 - this.totalTurns * 5)
    );
  }
  say(message) {
    this.log.unshift(message);
    if (this.log.length > 7) this.log.length = 7;
  }
  draw(amount) {
    for (let i = 0; i < amount && this.hand.length < 7; i++) {
      if (!this.deck.length) {
        if (!this.discard.length) break;
        this.deck = this.shuffle(this.discard);
        this.discard = [];
      }
      this.hand.push(this.deck.pop());
    }
  }
  canPlay(id) {
    const c = this.hand.find((c) => c.id === id);
    return this.mode === "playing" && !!c && this.energy >= CARDS[c.key].cost;
  }
  play(id) {
    if (!this.canPlay(id)) return false;
    const index = this.hand.findIndex((c) => c.id === id),
      instance = this.hand.splice(index, 1)[0],
      card = CARDS[instance.key];
    this.energy -= card.cost;
    this.played++;
    if (card.type === "attack" || card.type === "pierce") {
      let damage = card.value + this.edge;
      const blocked =
        card.type === "pierce" ? 0 : Math.min(this.enemy.guard, damage);
      this.enemy.guard -= blocked;
      damage -= blocked;
      this.enemy.hp = Math.max(0, this.enemy.hp - damage);
      this.say(
        `${card.name}: ${damage} dano${blocked ? `, ${blocked} bloqueado` : ""}.`,
      );
    } else if (card.type === "guard") {
      this.guard = Math.min(99, this.guard + card.value);
      this.say(`Aparo: +${card.value} de guarda.`);
    } else if (card.type === "heal") {
      const heal = Math.min(card.value, this.maxHp - this.hp);
      this.hp += heal;
      this.say(`Remendo: +${heal} de vida.`);
    } else {
      this.energy = Math.min(6, this.energy + 1);
      this.draw(1);
      this.say("Fôlego: +1 fôlego e 1 carta comprada.");
    }
    this.discard.push(instance);
    if (this.enemy.hp === 0) {
      this.totalTurns += this.turn;
      this.mode = this.stage === 2 ? "won" : "reward";
      this.say(
        this.mode === "won"
          ? "Os três guardiões foram vencidos."
          : "Duelo vencido. Escolha seu legado.",
      );
    }
    return true;
  }
  endTurn() {
    if (this.mode !== "playing") return false;
    const intention = this.intent;
    this.enemy.guard = 0;
    if (intention.type === "attack") {
      const blocked = Math.min(this.guard, intention.value);
      const damage = intention.value - blocked;
      this.hp = Math.max(0, this.hp - damage);
      this.say(`${this.enemy.name}: ${damage} dano, ${blocked} bloqueado.`);
    } else {
      this.enemy.guard = intention.value;
      this.say(`${this.enemy.name} ganhou ${intention.value} de guarda.`);
    }
    if (this.hp === 0 || this.turn >= 40) {
      this.mode = "lost";
      this.totalTurns += this.turn;
      this.say(
        this.hp === 0
          ? "Seu estandarte caiu."
          : "Exaustão: 40 turnos no mesmo duelo.",
      );
      return true;
    }
    this.discard.push(...this.hand);
    this.hand = [];
    this.turn++;
    this.guard = 0;
    this.energy = Math.min(6, 3 + (this.turn <= 2 ? this.tempo : 0));
    this.draw(5);
    return true;
  }
  reward(id) {
    if (this.mode !== "reward" || !REWARDS.some((r) => r.id === id))
      return false;
    if (id === "edge") this.edge += 2;
    if (id === "vigor") {
      this.maxHp += 8;
      this.hp = Math.min(this.maxHp, this.hp + 8);
    }
    if (id === "tempo") this.tempo++;
    this.rewards.push(id);
    this.hp = Math.min(this.maxHp, this.hp + 8);
    this.stage++;
    this.mode = "playing";
    this.startDuel();
    return true;
  }
  pause() {
    if (this.mode === "playing") this.mode = "paused";
  }
  resume() {
    if (this.mode === "paused") this.mode = "playing";
  }
}
export function readSave(raw) {
  const base = {
    version: 1,
    muted: true,
    reduced: false,
    wins: { apprentice: 0, veteran: 0 },
    best: { apprentice: 0, veteran: 0 },
  };
  try {
    const v = JSON.parse(raw || "null");
    if (v?.version !== 1) return base;
    const value = (n) =>
      Number.isSafeInteger(n) && n >= 0 && n <= 10000000 ? n : 0;
    return {
      ...base,
      muted: typeof v.muted === "boolean" ? v.muted : true,
      reduced: typeof v.reduced === "boolean" ? v.reduced : false,
      wins: {
        apprentice: value(v.wins?.apprentice),
        veteran: value(v.wins?.veteran),
      },
      best: {
        apprentice: value(v.best?.apprentice),
        veteran: value(v.best?.veteran),
      },
    };
  } catch {
    return base;
  }
}
export function record(save, game) {
  if (game.mode !== "won") return save;
  return {
    ...save,
    wins: {
      ...save.wins,
      [game.difficulty]: Math.min(10000000, save.wins[game.difficulty] + 1),
    },
    best: {
      ...save.best,
      [game.difficulty]: Math.max(save.best[game.difficulty], game.score),
    },
  };
}
export function bindLifecycle(win, doc, pause) {
  const blur = () => pause(),
    hidden = () => {
      if (doc.hidden) pause();
    };
  win.addEventListener("blur", blur);
  doc.addEventListener("visibilitychange", hidden);
  return () => {
    win.removeEventListener("blur", blur);
    doc.removeEventListener("visibilitychange", hidden);
  };
}
