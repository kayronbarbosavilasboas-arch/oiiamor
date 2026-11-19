const STORAGE_KEY = "meuCoelhinhoVirtual_v1";

const defaultState = {
  name: "Bam",
  hunger: 80,
  happiness: 80,
  energy: 80,
  coins: 20,
  xp: 0,
  level: 1,
  accessory: "none",
  owned: ["none"],
  sleeping: false,
  lastUpdate: Date.now()
};

let state = loadState();
let toastTimer;

const $ = (id) => document.getElementById(id);
const els = {
  nameHeading: $("petNameHeading"), level: $("level"), coins: $("coins"),
  hungerBar: $("hungerBar"), happyBar: $("happyBar"), energyBar: $("energyBar"),
  hungerValue: $("hungerValue"), happyValue: $("happyValue"), energyValue: $("energyValue"),
  xpBar: $("xpBar"), xpText: $("xpText"), speech: $("speech"),
  petWrap: $("petWrap"), accessory: $("accessory"), statusDot: $("statusDot"),
  hint: $("hint"), sleepLabel: $("sleepLabel"), toast: $("toast"),
  scene: $("scene"), toyBall: $("toyBall"), carrotSnack: $("carrotSnack"),
  playButton: $("playBtn"), carrotGameButton: $("carrotGameBtn"), starGameButton: $("starGameBtn")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    const restored = { ...structuredClone(defaultState), ...saved };
    // Atualiza o nome padrão da versão anterior sem apagar os dados salvos.
    if (restored.name === "Pipoca") restored.name = "Bam";
    return restored;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  state.lastUpdate = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function applyOfflineTime() {
  const elapsedMinutes = Math.max(0, (Date.now() - (state.lastUpdate || Date.now())) / 60000);
  // As necessidades diminuem devagar enquanto a pessoa está fora do site.
  const steps = Math.min(elapsedMinutes, 60 * 24 * 7);
  state.hunger = clamp(state.hunger - steps * 0.12);
  state.happiness = clamp(state.happiness - steps * 0.06);
  if (!state.sleeping) state.energy = clamp(state.energy - steps * 0.08);
  else state.energy = clamp(state.energy + steps * 0.22);
  state.sleeping = false;
  saveState();
}

function render() {
  els.nameHeading.textContent = state.name;
  els.level.textContent = state.level;
  els.coins.textContent = state.coins;

  setStat("hunger", state.hunger);
  setStat("happy", state.happiness);
  setStat("energy", state.energy);

  const xpNeeded = state.level * 100;
  els.xpText.textContent = `${state.xp} / ${xpNeeded} XP`;
  els.xpBar.style.width = `${Math.min(100, state.xp / xpNeeded * 100)}%`;

  els.sleepLabel.textContent = state.sleeping ? "Acordar" : "Dormir";
  els.scene.classList.toggle("night", state.sleeping);
  els.accessory.textContent = accessoryEmoji(state.accessory);
  els.accessory.style.display = state.accessory === "none" ? "none" : "block";
  els.accessory.classList.toggle("flower-on-ear", state.accessory === "flower");

  const needsCare = state.hunger < 25 || state.happiness < 25 || state.energy < 20;
  els.statusDot.style.background = needsCare ? "#e9a35e" : "#8dc9a2";
  els.hint.textContent = needsCare
    ? "Seu coelhinho precisa de um pouquinho de atenção."
    : "Dica: volte para cuidar dele e ganhar mais experiência!";
  updateShopButtons();
}

function setStat(name, value) {
  const rounded = Math.round(value);
  els[`${name}Bar`].style.width = `${rounded}%`;
  els[`${name}Value`].textContent = `${rounded}%`;
}

function accessoryEmoji(item) {
  return ({ bow: "🎀", crown: "👑", flower: "🌼", none: "" })[item] || "";
}

function say(message) {
  els.speech.textContent = message;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function animate(type = "hopping") {
  els.petWrap.classList.remove("hopping", "happy", "bouncing", "love", "blinking");
  void els.petWrap.offsetWidth;
  els.petWrap.classList.add(type);
  setTimeout(() => els.petWrap.classList.remove(type), 1400);
}

let playSession = null;
let idleAnimationTimer = null;

function feedAnimation() {
  els.petWrap.classList.remove("eating", "happy", "hopping");
  void els.petWrap.offsetWidth;
  els.petWrap.classList.add("eating");
  say("Bam pegou a cenoura com as patinhas! 🥕");
  setTimeout(() => {
    if (!state.sleeping) say("Nhac... nhac... que delícia!");
  }, 1050);
  setTimeout(() => {
    els.petWrap.classList.remove("eating");
    if (!state.sleeping) say("Prontinho! Bam comeu tudinho! ♥");
  }, 3500);
}

let gameTarget = null;

function clearGame() {
  if (gameTarget) gameTarget.remove();
  gameTarget = null;
  playSession = null;
  els.scene.classList.remove("playing", "ball-caught", "game-carrot", "game-stars");
  els.toyBall.style.display = "";
  els.toyBall.style.left = "17%";
  els.toyBall.style.bottom = "42px";
  els.playButton.querySelector("b").textContent = "Buscar bolinha";
  els.carrotGameButton.querySelector("b").textContent = "Caça à cenoura";
  els.starGameButton.querySelector("b").textContent = "Caça às estrelas";
}

function endGame(success = false) {
  const game = playSession?.type;
  clearGame();
  if (success) {
    state.happiness = clamp(state.happiness + 18);
    state.energy = clamp(state.energy - 12);
    state.hunger = clamp(state.hunger - 4);
    gainXP(20);
    say("Você conseguiu! Bam adorou brincar com você! ✨");
    showToast("Desafio completo! +20 XP");
    saveState();
    render();
  } else {
    say("Que diversão! Podemos brincar de novo quando quiser. ♥");
  }
}

function spawnTarget() {
  if (!playSession) return;
  const isBall = playSession.type === "ball";
  if (isBall) {
    els.toyBall.style.display = "block";
    moveBall();
    return;
  }
  if (gameTarget) gameTarget.remove();
  gameTarget = document.createElement("button");
  gameTarget.type = "button";
  gameTarget.className = "game-target";
  gameTarget.setAttribute("aria-label", "Capturar o alvo do jogo");
  gameTarget.textContent = playSession.type === "carrot" ? "🥕" : "⭐";
  const x = 9 + Math.random() * 78;
  const y = 66 + Math.random() * 112;
  gameTarget.style.left = `${x}%`;
  gameTarget.style.top = `${y}px`;
  gameTarget.addEventListener("click", () => captureTarget());
  els.scene.appendChild(gameTarget);
}

function startGame(type) {
  if (playSession) {
    endGame(false);
    return;
  }
  if (state.sleeping) {
    showToast("Acorde Bam antes de brincar!");
    return;
  }
  if (state.energy < 15) {
    showToast("Bam está cansado. Deixe-o descansar um pouco.");
    return;
  }
  playSession = { type, catches: 0, max: type === "stars" ? 7 : 5, lastPosition: -1 };
  els.scene.classList.add("playing");
  if (type === "carrot") els.scene.classList.add("game-carrot");
  if (type === "stars") els.scene.classList.add("game-stars");
  els.playButton.querySelector("b").textContent = type === "ball" ? "Encerrar jogo" : "Buscar bolinha";
  if (type === "carrot") els.carrotGameButton.querySelector("b").textContent = "Encerrar jogo";
  if (type === "stars") els.starGameButton.querySelector("b").textContent = "Encerrar jogo";
  say(type === "ball" ? "Clique na bolinha para Bam buscar! 🎾" :
      type === "carrot" ? "A cenoura está fugindo! Pegue cinco cenouras! 🥕" :
      "Vamos pegar sete estrelinhas brilhantes! ⭐");
  spawnTarget();
}

function captureTarget() {
  if (!playSession) return;
  playSession.catches++;
  animate("hopping");
  if (playSession.catches >= playSession.max) {
    endGame(true);
    return;
  }
  const left = playSession.max - playSession.catches;
  say(`Boa! Faltam ${left} ${left === 1 ? "alvo" : "alvos"}!`);
  setTimeout(() => { if (playSession) spawnTarget(); }, 420);
}

function moveBall() {
  const positions = [12, 30, 50, 70, 82, 40, 22];
  let next = positions[Math.floor(Math.random() * positions.length)];
  if (playSession && next === playSession.lastPosition) next = positions[(positions.indexOf(next) + 2) % positions.length];
  if (playSession) playSession.lastPosition = next;
  els.toyBall.style.left = `${next}%`;
  els.toyBall.style.bottom = `${34 + Math.floor(Math.random() * 60)}px`;
  els.scene.classList.remove("ball-caught");
}

function startFetchGame() { startGame("ball"); }
function catchBall() {
  if (!playSession || playSession.type !== "ball") return;
  els.scene.classList.add("ball-caught");
  captureTarget();
}

function startIdleAnimations() {
  if (idleAnimationTimer) clearInterval(idleAnimationTimer);
  idleAnimationTimer = setInterval(() => {
    if (state.sleeping || playSession || els.petWrap.classList.contains("eating") || els.petWrap.classList.contains("laying") || els.petWrap.classList.contains("waking")) return;
    const reactions = ["blinking", "bouncing", "love"];
    const chosen = reactions[Math.floor(Math.random() * reactions.length)];
    animate(chosen);
  }, 9000);
}

function gainXP(amount) {
  state.xp += amount;
  let needed = state.level * 100;
  while (state.xp >= needed) {
    state.xp -= needed;
    state.level += 1;
    state.coins += 15;
    needed = state.level * 100;
    say(`Oba! ${state.name} subiu para o nível ${state.level}!`);
    showToast("Nível novo! Você ganhou 15 moedas ✦");
  }
}

function act(action) {
  if (state.sleeping && action !== "sleep") {
    showToast("Bam está dormindo. Acorde-o primeiro!");
    return;
  }

  if (action === "feed") {
    if (state.hunger >= 100) return showToast("Ele já está de barriguinha cheia!");
    state.hunger = clamp(state.hunger + 25);
    state.happiness = clamp(state.happiness + 4);
    gainXP(10);
    feedAnimation();
    showToast(`${state.name} ganhou 10 XP!`);
  }

  if (action === "play") { startFetchGame(); return; }
  if (action === "carrotGame") { startGame("carrot"); return; }
  if (action === "starGame") { startGame("stars"); return; }

  if (action === "pet") {
    state.happiness = clamp(state.happiness + 12);
    gainXP(5);
    say("Awn... adoro receber carinho! ♥");
    animate("happy");
    showToast("Que carinho gostoso! +5 XP");
  }

  if (action === "sleep") {
    if (!state.sleeping) {
      if (playSession) clearGame();
      state.sleeping = true;
      els.petWrap.classList.remove("eating", "hopping", "happy");
      els.petWrap.classList.add("laying");
      els.scene.classList.add("night");
      say("O céu está escurecendo... boa noite, Bam. 🌙");
      showToast("Bam está se ajeitando para dormir...");
      setTimeout(() => {
        if (!state.sleeping) return;
        els.petWrap.classList.remove("laying");
        els.petWrap.classList.add("sleeping");
        say("Zzz... Bam está dormindo tranquilamente. 💤");
      }, 1150);
    } else {
      state.sleeping = false;
      els.petWrap.classList.remove("sleeping", "laying");
      els.petWrap.classList.add("waking");
      say("O céu está clareando... Bam está acordando! ☀️");
      showToast("Bom dia! Bam está levantando...");
      setTimeout(() => {
        els.petWrap.classList.remove("waking");
        state.energy = clamp(state.energy + 25);
        gainXP(5);
        say("Bom dia! Bam acordou e está pronto para brincar! ♥");
        saveState();
        render();
      }, 1300);
    }
  }

  saveState();
  render();
}

function updateShopButtons() {
  document.querySelectorAll(".buy-btn").forEach((button) => {
    const item = button.dataset.item;
    const price = Number(button.dataset.price);
    if (item === "none") {
      button.textContent = state.accessory === "none" ? "Em uso" : "Usar";
      button.classList.toggle("owned", state.accessory === "none");
    } else if (state.owned.includes(item)) {
      button.textContent = state.accessory === item ? "Em uso" : "Usar";
      button.classList.add("owned");
    } else {
      button.textContent = `✦ ${price} moedas`;
      button.classList.remove("owned");
    }
  });
}

function buyOrEquip(item, price) {
  if (item === "none") {
    state.accessory = "none";
    say("Meu visual original também é fofo! ♥");
    saveState(); render(); return;
  }
  if (state.owned.includes(item)) {
    state.accessory = item;
    say("Olha só meu novo visual! Ficou bonito?");
    showToast("Acessório equipado!");
  } else if (state.coins >= price) {
    state.coins -= price;
    state.owned.push(item);
    state.accessory = item;
    say("Ganhei um acessório novinho! ✨");
    showToast("Compra realizada! Acessório desbloqueado.");
  } else {
    showToast("Você ainda não tem moedas suficientes.");
    return;
  }
  saveState(); render();
}

function openRenameDialog() {
  $("nameInput").value = state.name;
  $("nameDialog").showModal();
  $("nameInput").focus();
}

$("nameForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const newName = $("nameInput").value.trim();
  if (!newName) return;
  state.name = newName.slice(0, 16);
  $("nameDialog").close();
  say(`Oi! Eu sou ${state.name}! ♥`);
  saveState(); render();
  showToast("Nome atualizado!");
});

$("renameBtn").addEventListener("click", openRenameDialog);
$("feedBtn").addEventListener("click", () => act("feed"));
$("playBtn").addEventListener("click", () => act("play"));
$("carrotGameBtn").addEventListener("click", () => act("carrotGame"));
$("starGameBtn").addEventListener("click", () => act("starGame"));
els.toyBall.addEventListener("click", catchBall);
$("petBtn").addEventListener("click", () => act("pet"));
$("sleepBtn").addEventListener("click", () => act("sleep"));

document.querySelectorAll(".buy-btn").forEach((button) => {
  button.addEventListener("click", () => buyOrEquip(button.dataset.item, Number(button.dataset.price)));
});

// Pequena redução gradual das necessidades enquanto a página está aberta.
setInterval(() => {
  if (state.sleeping) {
    state.energy = clamp(state.energy + 1.2);
  } else {
    state.hunger = clamp(state.hunger - 0.35);
    state.happiness = clamp(state.happiness - 0.15);
    state.energy = clamp(state.energy - 0.12);
  }
  saveState();
  render();
}, 60000);

$("soundToggle").addEventListener("click", () => {
  showToast("Os sons podem ser adicionados nesta versão futuramente!");
});

applyOfflineTime();
render();
startIdleAnimations();
if (!localStorage.getItem(STORAGE_KEY)) {
  setTimeout(() => {
    $("nameDialog").showModal();
  }, 500);
}
