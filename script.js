// ========== CHANT COUNTER SCRIPT ==========

// ---- Load saved data ----
let chantWord = localStorage.getItem("chantWord") || "om";
let chantGoal = parseInt(localStorage.getItem("chantGoal")) || 0;
let chantCount = parseInt(localStorage.getItem("chantCount")) || 0;

// ---- Select UI elements ----
const chantInput = document.getElementById("chantWord");
const goalInput = document.getElementById("chantGoal");
const counterEl = document.getElementById("counter");
const goalEl = document.getElementById("goal");
const saveBtn = document.getElementById("saveSettings");
const resetBtn = document.getElementById("resetBtn");
const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status"); // optional: <p id="status"></p>
const beep = document.getElementById("beep");

// ---- Initialize UI ----
chantInput.value = chantWord;
goalInput.value = chantGoal || "";
counterEl.textContent = chantCount;
goalEl.textContent = "/ " + chantGoal;

// ---- Save user settings ----
saveBtn.addEventListener("click", () => {
  chantWord = chantInput.value.trim().toLowerCase();
  chantGoal = parseInt(goalInput.value) || 0;

  localStorage.setItem("chantWord", chantWord);
  localStorage.setItem("chantGoal", chantGoal);

  goalEl.textContent = "/ " + chantGoal;
  alert("✅ Settings saved!");
});

// ---- Reset chant count ----
resetBtn.addEventListener("click", () => {
  chantCount = 0;
  localStorage.setItem("chantCount", chantCount);
  counterEl.textContent = chantCount;
});

// ---- Setup Speech Recognition ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  alert("Speech recognition not supported on this device/browser.");
}

const recognition = new SpeechRecognition();
recognition.lang = "en-IN";
recognition.continuous = true;
recognition.interimResults = false;

let listening = false;
let restartTimeout = null;

// ---- Start/Stop Listening ----
startBtn.addEventListener("click", () => {
  if (!chantWord) return alert("Please enter a chant word!");

  if (!listening) {
    startRecognition();
  } else {
    stopRecognition();
  }
});

function startRecognition() {
  try {
    recognition.start();
    listening = true;
    startBtn.textContent = "⏸️ Stop Listening";
    statusEl.textContent = "🎙️ Listening...";
  } catch (err) {
    console.warn("Start failed:", err);
  }
}

function stopRecognition() {
  listening = false;
  recognition.stop();
  startBtn.textContent = "🎤 Start Listening";
  statusEl.textContent = "Mic off";
  if (restartTimeout) clearTimeout(restartTimeout);
}

// ---- Handle speech results ----
recognition.onresult = (event) => {
  const transcript = event.results[event.resultIndex][0].transcript.trim().toLowerCase();
  console.log("Heard:", transcript);

  if (transcript.includes(chantWord)) {
    chantCount++;
    counterEl.textContent = chantCount;
    localStorage.setItem("chantCount", chantCount);

    if (chantGoal && chantCount >= chantGoal) {
      playBeep();
      alert(`🎉 You completed ${chantGoal} chants of "${chantWord}"!`);
      stopRecognition();
    }
  }
};

// ---- Auto restart recognition (Android fix) ----
recognition.onend = () => {
  console.log("Recognition ended");
  if (listening) {
    statusEl.textContent = "Reconnecting mic...";
    restartTimeout = setTimeout(() => {
      console.log("Restarting recognition...");
      try {
        recognition.start();
        statusEl.textContent = "🎙️ Listening...";
      } catch (e) {
        console.warn("Restart error:", e);
      }
    }, 800); // restart after short delay
  }
};

// ---- Error handling ----
recognition.onerror = (e) => {
  console.warn("Speech recognition error:", e.error);
  if (e.error === "not-allowed" || e.error === "service-not-allowed") {
    alert("Microphone permission denied. Please allow mic in site settings.");
    stopRecognition();
  }
};

// ---- Play beep sound ----
function playBeep() {
  if (!beep) return;
  try {
    beep.currentTime = 0;
    const playPromise = beep.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => console.warn("Beep play failed:", err));
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// ==========================================
