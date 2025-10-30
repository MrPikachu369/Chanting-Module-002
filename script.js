let chantWord = localStorage.getItem("chantWord") || "om";
let chantGoal = parseInt(localStorage.getItem("chantGoal")) || 0;
let chantCount = parseInt(localStorage.getItem("chantCount")) || 0;

const chantWordInput = document.getElementById("chantWord");
const chantGoalInput = document.getElementById("chantGoal");
const counterEl = document.getElementById("counter");
const goalEl = document.getElementById("goal");
const saveBtn = document.getElementById("saveSettings");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const beep = document.getElementById("beep");

chantWordInput.value = chantWord;
chantGoalInput.value = chantGoal;
counterEl.textContent = chantCount;
goalEl.textContent = "/ " + chantGoal;

let listening = false;

function playBeep() {
  beep.currentTime = 0;
  beep.play().catch(() => {});
}

function saveSettings() {
  chantWord = chantWordInput.value.trim().toLowerCase();
  chantGoal = parseInt(chantGoalInput.value) || 0;
  localStorage.setItem("chantWord", chantWord);
  localStorage.setItem("chantGoal", chantGoal);
  goalEl.textContent = "/ " + chantGoal;
  alert("Settings saved!");
}

saveBtn.addEventListener("click", saveSettings);

resetBtn.addEventListener("click", () => {
  chantCount = 0;
  counterEl.textContent = chantCount;
  localStorage.setItem("chantCount", chantCount);
});

startBtn.addEventListener("click", () => {
  if (!annyang) {
    alert("Speech recognition not supported!");
    return;
  }

  if (!listening) {
    chantWord = chantWordInput.value.trim().toLowerCase();
    if (!chantWord) {
      alert("Enter chant word first!");
      return;
    }

    const commands = {};
    commands[chantWord] = () => {
      chantCount++;
      counterEl.textContent = chantCount;
      localStorage.setItem("chantCount", chantCount);

      if (chantGoal && chantCount >= chantGoal) {
        playBeep();
        alert(`🎉 You completed ${chantGoal} chants of "${chantWord}"!`);
        annyang.abort();
        listening = false;
        startBtn.textContent = "🎤 Start Listening";
      }
    };

    annyang.removeCommands();
    annyang.addCommands(commands);
    annyang.start({ continuous: true });
    listening = true;
    startBtn.textContent = "⏸️ Stop Listening";
  } else {
    annyang.abort();
    listening = false;
    startBtn.textContent = "🎤 Start Listening";
  }
});
