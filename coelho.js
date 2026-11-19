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
  hint: $("hint"), sleepLabel: $("sleepLabel"), toast: $("toast")
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
  els.petWrap.classList.toggle("sleeping", state.sleeping);
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
  els.petWrap.classList.remove("hopping", "happy");
  void els.petWrap.offsetWidth;
  els.petWrap.classList.add(type);
  setTimeout(() => els.petWrap.classList.remove(type), 1100);
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
    showToast("Seu coelhinho está dormindo. Acorde-o primeiro!");
    return;
  }

  if (action === "feed") {
    if (state.hunger >= 100) return showToast("Ele já está de barriguinha cheia!");
    state.hunger = clamp(state.hunger + 25);
    state.happiness = clamp(state.happiness + 4);
    gainXP(10);
    say("Nhac nhac! Que cenourinha deliciosa! 🥕");
    animate("happy");
    showToast(`${state.name} comeu e ganhou 10 XP!`);
  }

  if (action === "play") {
    if (state.energy < 15) return showToast("Ele está cansado. Deixe-o descansar um pouco.");
    state.happiness = clamp(state.happiness + 18);
    state.energy = clamp(state.energy - 15);
    state.hunger = clamp(state.hunger - 5);
    gainXP(15);
    say("Ebaaa! Brincar é muito divertido! ✨");
    animate("hopping");
    showToast("Vocês brincaram! +15 XP");
  }

  if (action === "pet") {
    state.happiness = clamp(state.happiness + 12);
    gainXP(5);
    say("Awn... adoro receber carinho! ♥");
    animate("happy");
    showToast("Que carinho gostoso! +5 XP");
  }

  if (action === "sleep") {
    state.sleeping = !state.sleeping;
    if (state.sleeping) {
      say("Boa noite... vou tirar uma sonequinha. Zzz");
      showToast(`${state.name} foi dormir. Volte para acordá-lo!`);
    } else {
      state.energy = clamp(state.energy + 25);
      say("Bom dia! Dormi muito bem! ☀️");
      gainXP(5);
      showToast(`${state.name} acordou cheio de energia!`);
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
if (!localStorage.getItem(STORAGE_KEY)) {
  setTimeout(() => {
    $("nameDialog").showModal();
  }, 500);
}
