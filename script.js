// ===============================
// Chant Counter — robust script.js
// ===============================

// ----- IDs used in HTML (make sure your HTML uses these IDs) -----
// chantWord, chantGoal, counter, goal, saveSettings, startBtn, resetBtn, status, beep

// Load saved values
let chantWord = localStorage.getItem("chantWord") || "om";
let chantGoal = parseInt(localStorage.getItem("chantGoal")) || 0;
let chantCount = parseInt(localStorage.getItem("chantCount")) || 0;

// UI references
const chantWordInput = document.getElementById("chantWord");
const chantGoalInput = document.getElementById("chantGoal");
const counterEl = document.getElementById("counter"); // large number
const goalEl = document.getElementById("goal");       // "/ X"
const saveBtn = document.getElementById("saveSettings");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");   // optional <p id="status"></p>
const beep = document.getElementById("beep");         // <audio id="beep" src="beep.mp3">

// Initialize UI
chantWordInput.value = chantWord;
chantGoalInput.value = chantGoal || "";
counterEl.textContent = chantCount;
goalEl.textContent = "/ " + (chantGoal || 0);
statusEl && (statusEl.textContent = "Mic off");

// State
let listening = false;
let activeRecognition = null;
let restartTimer = null;

// ----- Helpers -----
function showToast(text, time = 3500) {
  const t = document.createElement("div");
  t.textContent = text;
  Object.assign(t.style, {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: "24px",
    background: "rgba(0,0,0,0.85)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "20px",
    zIndex: 99999,
    fontSize: "15px",
    textAlign: "center",
    maxWidth: "90%",
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), time);
}

function playBeep() {
  if (!beep) return;
  try {
    beep.currentTime = 0;
    const p = beep.play();
    if (p !== undefined) p.catch(e => console.warn("Beep play blocked:", e));
  } catch (e) {
    console.warn("Beep error:", e);
  }
}

function saveCount() {
  localStorage.setItem("chantCount", chantCount);
  counterEl.textContent = chantCount;
}

function saveSettingsToStorage() {
  localStorage.setItem("chantWord", chantWord);
  localStorage.setItem("chantGoal", chantGoal);
}

// ----- Settings UI -----
saveBtn.addEventListener("click", () => {
  chantWord = (chantWordInput.value || "").trim().toLowerCase();
  chantGoal = parseInt(chantGoalInput.value) || 0;
  goalEl.textContent = "/ " + chantGoal;
  saveSettingsToStorage();
  showToast("✅ Settings saved");
});

resetBtn.addEventListener("click", () => {
  chantCount = 0;
  saveCount();
  showToast("Counter reset");
});

// ----- Recognition Factory -----
// create a new recognition object each time we (re)start
function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech Recognition not supported on this browser.");
    return null;
  }

  const r = new SpeechRecognition();
  r.continuous = true;       // request continuous—Chrome may still stop, we handle restart
  r.interimResults = false;
  r.lang = "en-IN"; // you can change to en-US or auto-detect

  r.onstart = () => {
    statusEl && (statusEl.textContent = "🎙️ Listening...");
    console.log("Recognition started");
  };

  r.onresult = (evt) => {
    // get last result transcript
    const res = evt.results[evt.resultIndex];
    const transcript = (res[0].transcript || "").trim().toLowerCase();
    console.log("Heard:", transcript);

    if (chantWord && transcript.includes(chantWord)) {
      chantCount++;
      saveCount();

      // goal check
      if (chantGoal && chantCount >= chantGoal) {
        playBeep();
        showToast(`🎉 Completed ${chantGoal} chants of "${chantWord}"!`, 5000);
        stopListening(); // stop after finishing
      }
    }
  };

  r.onerror = (e) => {
    console.warn("Recognition error:", e && e.error);
    // not-allowed => permission denied
    if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) {
      showToast("Microphone blocked. Allow microphone in Site settings.", 5000);
      stopListening();
    }
  };

  r.onend = () => {
    console.log("Recognition ended event");
    statusEl && (statusEl.textContent = "Mic off");
    activeRecognition = null;

    // If user still intends to listen, restart after short delay
    if (listening) {
      // small delay avoids rapid restart loops
      restartTimer = setTimeout(() => {
        console.log("Restarting recognition (re-create) ...");
        // If still supposed to listen, start a fresh recognition
        if (listening) startListening();
      }, 700);
    }
  };

  return r;
}

// ----- Start / Stop control -----
function startListening() {
  if (listening) return;
  // clear previous restart timer if any
  if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }

  // create new recognition and start it
  activeRecognition = createRecognition();
  if (!activeRecognition) return;

  try {
    activeRecognition.start();
    listening = true;
    startBtn.textContent = "⏸️ Stop Listening";
    statusEl && (statusEl.textContent = "🎙️ Listening...");
  } catch (e) {
    console.warn("Start error:", e);
    showToast("Could not start microphone. Check permission.", 4000);
    listening = false;
    startBtn.textContent = "🎤 Start Listening";
  }
}

function stopListening() {
  listening = false;
  startBtn.textContent = "🎤 Start Listening";
  statusEl && (statusEl.textContent = "Mic off");
  // clear any planned restart
  if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
  // stop and clear active recognition
  try {
    if (activeRecognition) {
      activeRecognition.onend = null; // avoid auto-restart inside onend
      activeRecognition.stop();
      activeRecognition = null;
    }
  } catch (e) {
    console.warn("Stop error:", e);
    activeRecognition = null;
  }
}

// toggle button
startBtn.addEventListener("click", () => {
  chantWord = (chantWordInput.value || "").trim().toLowerCase();
  if (!chantWord) return showToast("Enter a chant word first", 2000);

  if (!listening) startListening();
  else stopListening();
});

// unlock audio on user interaction (helps some autoplay blockers)
startBtn.addEventListener("mousedown", () => {
  try { beep && (beep.muted = false); } catch (e) {}
});

// ----- Ensure UI shows correct values at load -----
counterEl.textContent = chantCount;
goalEl.textContent = "/ " + (chantGoal || 0);
