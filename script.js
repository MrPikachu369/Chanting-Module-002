// --- state & load ---
let count = parseInt(localStorage.getItem("chantCount")) || 0;
let chantWord = localStorage.getItem("chantWord") || "om";
let chantGoal = parseInt(localStorage.getItem("chantGoal")) || 0;

const counterEl = document.getElementById("counter");
const goalEl = document.getElementById("goal");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveSettings");
const chantInput = document.getElementById("chantWord");
const goalInput = document.getElementById("chantGoal");

// UI initial
chantInput.value = chantWord;
goalInput.value = chantGoal || "";
counterEl.textContent = count;
goalEl.textContent = "/ " + (chantGoal || 0);

// audio element — make sure this src matches the actual filename in your folder
// Option A: use an <audio id="beep" src="mixkit-truck-reverse-beep-1085.mp3"> in HTML
// Option B: rename your file to beep.mp3 and use that name below
const beep = document.getElementById("beep");

// --- save settings ---
saveBtn.addEventListener("click", () => {
  chantWord = chantInput.value.trim().toLowerCase();
  chantGoal = parseInt(goalInput.value) || 0;

  localStorage.setItem("chantWord", chantWord);
  localStorage.setItem("chantGoal", chantGoal);

  goalEl.textContent = "/ " + chantGoal;
  alert("✅ Settings saved!");
});

// --- reset count ---
resetBtn.addEventListener("click", () => {
  count = 0;
  localStorage.setItem("chantCount", count);
  counterEl.textContent = count;
});

// --- SpeechRecognition setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Speech Recognition not supported on this device/browser.");
} else {
  const recognition = new SpeechRecognition();
  recognition.continuous = true;       // ask for continuous results
  recognition.interimResults = false;
  recognition.lang = "en-IN";

  let listening = false;

  // When result arrives
  recognition.onresult = (event) => {
    const transcript = event.results[event.resultIndex][0].transcript.trim().toLowerCase();
    console.log("Heard:", transcript);

    if (chantWord && transcript.includes(chantWord)) {
      count++;
      counterEl.textContent = count;
      localStorage.setItem("chantCount", count);

      // play beep and show completion if goal met
      if (chantGoal && count >= chantGoal) {
        // reset audio to start then play
        try {
          if (beep) {
            beep.currentTime = 0;
            const playPromise = beep.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => console.warn("Beep play failed:", err));
            }
          }
        } catch (e) {
          console.warn("Audio play error:", e);
        }

        alert(`🎉 You completed ${chantGoal} chants of "${chantWord}"!`);
        // Stop listening after completion
        listening = false;
        recognition.stop();
        startBtn.textContent = "🎤 Start Listening";
      }
    }
  };

  // recognition can stop by browser — restart when we still want to listen
  recognition.onend = () => {
    console.log("Recognition ended");
    if (listening) {
      // small timeout prevents rapid restart loops
      setTimeout(() => {
        try { recognition.start(); }
        catch(e) { console.warn("Restart failed:", e); }
      }, 250);
    }
  };

  recognition.onerror = (e) => {
    console.warn("Speech recognition error:", e);
    // for some recoverable errors, try restart
    if (e.error === "no-speech" || e.error === "network") {
      // do nothing special; onend will restart if listening=true
    } else if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      alert("Microphone permission blocked. Please allow microphone for this site in browser settings.");
      listening = false;
      startBtn.textContent = "🎤 Start Listening";
    }
  };

  // Start/Stop toggle button
  startBtn.addEventListener("click", () => {
    if (!chantWord) return alert("Please enter a chant word!");
    if (!listening) {
      try {
        recognition.start();
        listening = true;
        startBtn.textContent = "⏸️ Stop Listening";
      } catch (e) {
        console.warn("Start error:", e);
      }
    } else {
      listening = false;
      recognition.stop();
      startBtn.textContent = "🎤 Start Listening";
    }
  });
}
