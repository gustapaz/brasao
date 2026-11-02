<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from "vue";
import {
  Duel,
  CARDS,
  ENEMIES,
  REWARDS,
  readSave,
  record,
  bindLifecycle,
} from "./game.js";
import Sigil from "./Sigil.vue";
const game = ref(new Duel()),
  panel = ref("intro"),
  started = ref(false),
  difficulty = ref("apprentice"),
  seed = ref(8642),
  message = ref(""),
  busy = ref(false),
  impact = ref("");
let stored;
try {
  stored = readSave(localStorage.getItem("brasao.save"));
} catch {
  stored = readSave(null);
}
const save = ref(stored),
  recorded = ref(false);
let audio, timer, clearLifecycle, lastFocus;
const intentLabel = computed(() =>
  game.value.intent.type === "attack"
    ? `Atacará por ${game.value.intent.value}`
    : `Ganhará ${game.value.intent.value} de guarda`,
);
const won = computed(() => game.value.mode === "won");
function persist() {
  try {
    localStorage.setItem("brasao.save", JSON.stringify(save.value));
  } catch {}
}
function sound(frequency = 330) {
  if (save.value.muted) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain(),
      now = audio.currentTime;
    o.type = "triangle";
    o.frequency.setValueAtTime(frequency, now);
    o.frequency.exponentialRampToValueAtTime(frequency * 0.65, now + 0.12);
    g.gain.setValueAtTime(0.045, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(now + 0.16);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  } catch {}
}
function announce(text) {
  message.value = text;
}
function lock() {
  clearTimeout(timer);
  busy.value = true;
  timer = setTimeout(() => {
    busy.value = false;
    impact.value = "";
    if (
      !panel.value &&
      (document.activeElement === document.body ||
        document.activeElement?.closest(".hand"))
    )
      focusHand();
  }, 180);
}
async function focusHand() {
  await nextTick();
  if (!panel.value)
    (
      document.querySelector(".hand .card:not(:disabled)") ||
      document.querySelector(".end-turn:not(:disabled)")
    )?.focus({ preventScroll: true });
}
function start() {
  clearTimeout(timer);
  busy.value = false;
  game.value = new Duel(difficulty.value, Number(seed.value));
  seed.value = game.value.seed;
  started.value = true;
  recorded.value = false;
  panel.value = null;
  announce("Campanha iniciada. Leia a intenção inimiga e escolha suas cartas.");
  sound(220);
  focusHand();
}
function inspectResult() {
  if (game.value.mode === "reward") panel.value = "reward";
  if (game.value.mode === "won" || game.value.mode === "lost") {
    panel.value = "result";
    if (won.value && !recorded.value) {
      save.value = record(save.value, game.value);
      recorded.value = true;
      persist();
    }
    announce(
      won.value
        ? "Os três guardiões foram vencidos. Campanha concluída."
        : "Seu estandarte caiu. Você pode tentar novamente.",
    );
  }
}
function play(instance) {
  if (panel.value || busy.value) return;
  const card = CARDS[instance.key];
  if (game.value.play(instance.id)) {
    impact.value =
      card.type === "attack" || card.type === "pierce" ? "strike" : "ward";
    lock();
    sound(card.type === "attack" ? 280 : 430);
    announce(game.value.log[0]);
    inspectResult();
    focusHand();
  }
}
function endTurn() {
  if (panel.value || busy.value) return;
  if (game.value.endTurn()) {
    impact.value = "enemy";
    lock();
    sound(140);
    announce(`${game.value.log[0]} Turno ${game.value.turn}.`);
    inspectResult();
    focusHand();
  }
}
function reward(id) {
  if (game.value.reward(id)) {
    clearTimeout(timer);
    panel.value = null;
    busy.value = false;
    impact.value = "";
    announce(
      `Legado escolhido. Duelo ${game.value.stage + 1}: ${game.value.enemy.name}.`,
    );
    sound(520);
    focusHand();
  }
}
function pause() {
  if (started.value && !panel.value && game.value.mode === "playing") {
    game.value.pause();
    panel.value = "pause";
    announce("Campanha em pausa.");
  }
}
function help() {
  lastFocus = document.activeElement;
  game.value.pause();
  panel.value = "help";
}
async function resume() {
  panel.value = started.value ? null : "intro";
  game.value.resume();
  announce(started.value ? "Seu turno continua." : "");
  await nextTick();
  if (!panel.value && lastFocus?.isConnected && !lastFocus.disabled)
    lastFocus.focus({ preventScroll: true });
  else if (!panel.value) focusHand();
  lastFocus = null;
}
function home() {
  started.value = false;
  panel.value = "intro";
  busy.value = false;
  clearTimeout(timer);
  game.value = new Duel(difficulty.value, Number(seed.value));
}
function randomSeed() {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  seed.value = (n[0] % 999999) + 1;
}
function cardText(instance) {
  const c = CARDS[instance.key];
  if (c.type === "attack") return `Cause ${c.value + game.value.edge} de dano.`;
  if (c.type === "pierce")
    return `Cause ${c.value + game.value.edge} de dano. Ignore a guarda.`;
  return c.text;
}
function cardLabel(instance) {
  return `Jogar ${CARDS[instance.key].name}. Custo ${CARDS[instance.key].cost}. ${cardText(instance)}`;
}
function keys(event) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.target instanceof HTMLInputElement
  )
    return;
  if (
    event.key === "Escape" &&
    (panel.value === "help" || panel.value === "pause")
  ) {
    event.preventDefault();
    resume();
  } else if (event.key.toLowerCase() === "p" && !event.repeat && !panel.value) {
    event.preventDefault();
    pause();
  }
  if (panel.value && event.key === "Tab") {
    const items = [
        ...document.querySelectorAll(
          ".dialog button:not(:disabled),.dialog input,.dialog a",
        ),
      ],
      first = items[0],
      last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
watch(panel, async (value) => {
  if (value) {
    await nextTick();
    document
      .querySelector(".dialog button:not(:disabled),.dialog input")
      ?.focus({ preventScroll: true });
  }
});
onMounted(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches)
    save.value.reduced = true;
  clearLifecycle = bindLifecycle(window, document, pause);
  document.addEventListener("keydown", keys);
  nextTick(() =>
    document.querySelector(".dialog button")?.focus({ preventScroll: true }),
  );
});
onUnmounted(() => {
  clearTimeout(timer);
  clearLifecycle?.();
  document.removeEventListener("keydown", keys);
  void audio?.close();
});
</script>

<template>
  <div class="app" :class="{ reduced: save.reduced }">
    <div class="table-grain" aria-hidden="true"></div>
    <div class="game-shell" :inert="panel !== null">
      <header>
        <a class="brand" href="./" aria-label="Brasão, início"
          ><Sigil kind="shield" /><span
            >BRASÃO<small>TRÊS DUELOS. UMA SÓ MÃO.</small></span
          ></a
        >
        <nav aria-label="Preferências e ajuda">
          <button
            :aria-pressed="!save.muted"
            @click="
              save.muted = !save.muted;
              persist();
              sound();
            "
          >
            {{ save.muted ? "Som desligado" : "Som ligado" }}</button
          ><button
            :aria-pressed="save.reduced"
            @click="
              save.reduced = !save.reduced;
              persist();
            "
          >
            {{
              save.reduced ? "Movimento reduzido" : "Reduzir movimento"
            }}</button
          ><button @click="help">Regras ↗</button
          ><button @click="pause" :disabled="game.mode !== 'playing'">
            Pausa Ⅱ
          </button>
        </nav>
      </header>
      <main>
        <section class="battle" aria-label="Arena do duelo">
          <div class="ritual-ring" aria-hidden="true"></div>
          <span class="battle-caption">{{ ENEMIES[game.stage].title }}</span>
          <div class="opponent" :class="impact" :key="game.stage">
            <span class="duel-index">GUARDIÃO {{ game.stage + 1 }} DE 3</span>
            <h1>{{ game.enemy.name }}</h1>
            <div class="health enemy-health" aria-label="Vida inimiga">
              <span data-testid="enemy-hp">{{ game.enemy.hp }}</span
              ><small>/ {{ game.enemy.maxHp }} VIDA</small
              ><b v-if="game.enemy.guard">◇ {{ game.enemy.guard }} guarda</b>
              <div class="health-line">
                <i
                  :style="{
                    width: `${(game.enemy.hp / game.enemy.maxHp) * 100}%`,
                  }"
                ></i>
              </div>
            </div>
            <div class="portrait">
              <svg viewBox="0 0 220 230" aria-hidden="true" class="armor">
                <path
                  class="shoulders"
                  d="M21 212L42 156 77 139 143 139 178 156 199 212 155 223H65Z"
                />
                <path
                  class="plate"
                  d="M62 139L73 74 109 42 147 74 158 139 135 180H85Z"
                />
                <path
                  d="M73 89L109 104 147 89M86 112L102 116M118 116L135 112M110 104V151M89 163H132M48 164L71 206M172 164L149 206M77 184L110 212 143 184"
                />
                <path v-if="game.stage === 0" d="M109 41V20M99 25H120" />
                <path
                  v-else-if="game.stage === 1"
                  d="M81 54L64 29 80 20 109 43 138 20 154 29 138 54M91 74H129"
                />
                <path
                  v-else
                  d="M76 63L62 20 93 40 110 10 127 40 157 20 143 63Z"
                /></svg
              ><span class="portrait-number">{{
                ["I", "II", "III"][game.stage]
              }}</span>
            </div>
          </div>
          <div
            class="intent"
            :class="game.intent.type"
            aria-label="Intenção adversária"
          >
            <Sigil :kind="game.intent.type === 'attack' ? 'sword' : 'shield'" />
            <div>
              <small>NO PRÓXIMO TURNO</small
              ><strong data-testid="intent">{{ intentLabel }}</strong
              ><span>Sua guarda: {{ game.guard }}</span>
            </div>
          </div>
          <div
            class="player-seal"
            role="group"
            aria-label="Seu estandarte: vida e guarda"
          >
            <Sigil kind="crown" />
            <div>
              <small>SEU ESTANDARTE</small
              ><strong
                ><span data-testid="player-hp">{{ game.hp }}</span
                ><em>/ {{ game.maxHp }}</em></strong
              ><span>◇ {{ game.guard }} guarda</span>
            </div>
          </div>
          <details class="chronicle">
            <summary>
              <span>CRÔNICA DO DUELO ↗</span>
              <p>{{ game.log[0] }}</p>
            </summary>
            <ol>
              <li v-for="(entry, index) in game.log" :key="index">
                {{ entry }}
              </li>
            </ol>
          </details>
        </section>
        <section class="hand-zone" aria-label="Sua mão de cartas">
          <div class="turn-bar">
            <span class="turn-number"
              >TURNO {{ String(game.turn).padStart(2, "0")
              }}<small
                >{{ difficulty === "apprentice" ? "APRENDIZ" : "VETERANO" }} ·
                SEED {{ game.seed }}</small
              ></span
            >
            <div class="energy" aria-label="Fôlego disponível">
              <b data-testid="energy">{{ game.energy }}</b
              ><span>FÔLEGO<small>RENOVA A CADA TURNO</small></span
              ><i
                v-for="n in 3"
                :key="n"
                :class="{ filled: n <= game.energy }"
              ></i>
            </div>
            <button
              class="end-turn"
              @click="endTurn"
              :disabled="busy || game.mode !== 'playing'"
            >
              Encerrar turno <span>→</span>
            </button>
          </div>
          <TransitionGroup
            tag="div"
            name="cards"
            class="hand"
            @before-leave="
              (element) => {
                element.inert = true;
              }
            "
            @before-enter="
              (element) => {
                element.inert = false;
              }
            "
            @after-enter="
              (element) => {
                element.inert = false;
              }
            "
            @leave-cancelled="
              (element) => {
                element.inert = false;
              }
            "
          >
            <button
              v-for="(instance, index) in game.hand"
              :key="instance.id"
              class="card"
              :class="`type-${CARDS[instance.key].type}`"
              :style="{
                '--tilt': `${(index - (game.hand.length - 1) / 2) * 4}deg`,
                '--distance': Math.abs(index - (game.hand.length - 1) / 2),
                '--order': index,
              }"
              :disabled="busy || !game.canPlay(instance.id)"
              :aria-label="cardLabel(instance)"
              :data-kind="instance.key"
              @click="play(instance)"
            >
              <span class="card-top"
                ><b>{{ CARDS[instance.key].cost }}</b
                ><small>{{
                  ["attack", "pierce"].includes(CARDS[instance.key].type)
                    ? "OFENSIVA"
                    : CARDS[instance.key].type === "guard"
                      ? "PROTEÇÃO"
                      : "RECURSO"
                }}</small
                ><span>✦</span></span
              >
              <div class="card-art">
                <Sigil :kind="CARDS[instance.key].symbol" />
              </div>
              <h2>{{ CARDS[instance.key].name }}</h2>
              <p>{{ cardText(instance) }}</p>
              <span class="card-bottom"
                >BRASÃO <i>✦</i> {{ String(index + 1).padStart(2, "0") }}</span
              >
            </button>
          </TransitionGroup>
          <div class="deck-notes">
            <span>COMPRA {{ game.deck.length }} <b>▱</b></span>
            <p>ESCOLHA UMA CARTA · LEIA A INTENÇÃO · PROTEJA SEU ESTANDARTE</p>
            <span>DESCARTE {{ game.discard.length }} <b>▱</b></span>
          </div>
        </section>
      </main>
      <footer>
        <span>UMA MÃO. MUITAS ESCOLHAS.</span
        ><a
          href="https://github.com/gustapaz/brasao"
          target="_blank"
          rel="noopener noreferrer"
          >Abrir o grimório do código ↗</a
        ><span
          >{{ save.wins[difficulty] }} vitórias locais · melhor
          {{ save.best[difficulty] }}</span
        >
      </footer>
    </div>
    <div v-if="panel" class="veil" :class="`veil-${panel}`">
      <section
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabindex="-1"
      >
        <div class="dialog-ornament" aria-hidden="true">
          <span></span
          ><Sigil
            :kind="
              panel === 'intro'
                ? 'crown'
                : panel === 'reward'
                  ? 'spark'
                  : won
                    ? 'shield'
                    : 'sword'
            "
          /><span></span>
        </div>
        <p class="eyebrow">
          {{
            panel === "intro"
              ? "UM JOGO TÁTICO DE CARTAS"
              : panel === "help"
                ? "AS REGRAS DO JURAMENTO"
                : panel === "pause"
                  ? "A MESA PODE ESPERAR"
                  : panel === "reward"
                    ? "ESCOLHA SEU LEGADO"
                    : won
                      ? "TRÊS JURAMENTOS CUMPRIDOS"
                      : "UM NOVO CAPÍTULO ESPERA"
          }}
        </p>
        <h1 id="dialog-title">
          {{
            panel === "intro"
              ? "Cartas na mesa. Coragem na mão."
              : panel === "help"
                ? "Antes da próxima carta."
                : panel === "pause"
                  ? "Seu turno continua depois."
                  : panel === "reward"
                    ? "A vitória deixa marcas."
                    : won
                      ? "Seu brasão permanece."
                      : "Até o aço pode ceder."
          }}
        </h1>
        <template v-if="panel === 'intro'"
          ><p>
            Três guardiões. Um baralho. Leia seus planos, escolha seus golpes e
            faça cada ponto de fôlego valer.
          </p>
          <fieldset class="difficulty">
            <legend>ESCOLHA SEU JURAMENTO</legend>
            <button
              :aria-pressed="difficulty === 'apprentice'"
              @click="difficulty = 'apprentice'"
            >
              Aprendiz<small>40 de vida · dano reduzido</small></button
            ><button
              :aria-pressed="difficulty === 'veteran'"
              @click="difficulty = 'veteran'"
            >
              Veterano<small>32 de vida · dano integral</small>
            </button>
          </fieldset>
          <div class="seed-row">
            <label
              >DESTINO
              <input
                type="number"
                min="1"
                max="999999"
                v-model.number="seed"
                aria-label="Seed da campanha" /></label
            ><button @click="randomSeed">Outro destino ↻</button>
          </div>
          <button class="primary" @click="start">
            Assumir o estandarte <span>→</span></button
          ><button class="text-button" @click="help">
            Aprender as regras
          </button></template
        >
        <template v-else-if="panel === 'help'"
          ><ol>
            <li>
              Você compra cinco cartas e recebe 3 de fôlego por turno.
              Clique/toque numa carta, ou use Tab + Enter/Espaço. O custo fica
              no canto.
            </li>
            <li>
              Leia a intenção adversária. Encerrar turno executa aquela ação e
              renova sua mão. Guarda do jogador zera no turno seguinte.
            </li>
            <li>
              Corte causa dano contra a guarda; Ruptura a ignora. Aparo protege,
              Remendo cura e Fôlego dá energia e compra uma carta.
            </li>
            <li>
              Vença três duelos e escolha uma melhoria entre eles. Recupera 8 de
              vida ao avançar; Coração firme cura 8 adicionais e aumenta o
              máximo.
            </li>
            <li>
              A compra vazia reembaralha o descarte. Após 20 turnos o dano
              cresce; 40 no mesmo duelo causa exaustão.
            </li>
          </ol>
          <p class="fine">
            Seed repete a distribuição. O modo Aprendiz reduz o dano recebido. A
            tentativa não é salva ao recarregar, apenas vitórias, recordes e
            preferências.
          </p>
          <button class="primary" @click="resume">
            Voltar à mesa →
          </button></template
        >
        <template v-else-if="panel === 'pause'"
          ><p>
            O baralho, sua mão e a intenção inimiga estão preservados. Não há
            relógio correndo.
          </p>
          <button class="primary" @click="resume">Continuar o duelo →</button
          ><button class="text-button" @click="home">
            Voltar ao início
          </button></template
        >
        <template v-else-if="panel === 'reward'"
          ><p>
            {{ game.enemy.name }} caiu. Você recuperará 8 de vida ao avançar.
            Escolha uma melhoria permanente para esta campanha.
          </p>
          <div class="rewards">
            <button
              v-for="item in REWARDS"
              :key="item.id"
              :aria-label="`Escolher ${item.name}. ${item.text}`"
              @click="reward(item.id)"
            >
              <Sigil
                :kind="
                  item.id === 'edge'
                    ? 'sword'
                    : item.id === 'vigor'
                      ? 'heart'
                      : 'spark'
                "
              /><strong>{{ item.name }}</strong
              ><span>{{ item.text }}</span>
            </button>
          </div>
          <span class="fine"
            >VIDA ATUAL {{ game.hp }} / {{ game.maxHp }} · DUELO
            {{ game.stage + 1 }} CONCLUÍDO</span
          ></template
        >
        <template v-else
          ><p>
            {{
              won
                ? "Você leu os golpes, encontrou suas brechas e venceu os três guardiões."
                : game.log[0]
            }}
          </p>
          <div class="result-stats">
            <strong>{{ game.score }}<small>PONTOS</small></strong
            ><strong>{{ game.totalTurns }}<small>TURNOS</small></strong
            ><strong>{{ game.played }}<small>CARTAS JOGADAS</small></strong>
          </div>
          <p class="fine">
            {{ difficulty === "apprentice" ? "APRENDIZ" : "VETERANO" }} · SEED
            {{ game.seed }}
          </p>
          <button class="primary" @click="start">
            Repetir este destino <span>↻</span></button
          ><button class="text-button" @click="home">
            Escolher outro juramento
          </button></template
        >
      </section>
    </div>
    <p class="sr-only" role="status">{{ message }}</p>
  </div>
</template>
