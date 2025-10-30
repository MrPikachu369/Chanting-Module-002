let count = parseInt(localStorage.getItem("chantCount")) || 0;
let chantWord = localStorage.getItem("chantWord") || "om";
let chantGoal = parseInt(localStorage.getItem("chantGoal")) || 0;

document.getElementById("chantWord").value = chantWord;
document.getElementById("chantGoal").value = chantGoal || "";
document.getElementById("counter").textContent = count;
document.getElementById("goal").textContent = "/ " + (chantGoal || 0);

const beep = document.getElementById("mixkit-truck-reversing-beeps-loop-1077.wav");

// Save user settings
document.getElementById("saveSettings").addEventListener("click", () => {
  chantWord = document.getElementById("chantWord").value.trim().toLowerCase();
  chantGoal = parseInt(document.getElementById("chantGoal").value) || 0;

  localStorage.setItem("chantWord", chantWord);
  localStorage.setItem("chantGoal", chantGoal);

  document.getElementById("goal").textContent = "/ " + chantGoal;
  alert("✅ Settings saved!");
});

// Reset
document.getElementById("resetBtn").addEventListener("click", () => {
  count = 0;
  localStorage.setItem("chantCount", count);
  document.getElementById("counter").textContent = count;
});

// Voice Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Speech Recognition not supported on this device/browser.");
} else {
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-IN";

  recognition.onresult = (event) => {
    const transcript = event.results[event.resultIndex][0].transcript.trim().toLowerCase();
    console.log("Heard:", transcript);

    if (transcript.includes(chantWord)) {
      count++;
      document.getElementById("counter").textContent = count;
      localStorage.setItem("chantCount", count);

      // When completed
      if (chantGoal && count >= chantGoal) {
        beep.play();
        alert(`🎉 You completed ${chantGoal} chants of "${chantWord}"!`);
        recognition.stop();
      }
    }
  };

  document.getElementById("startBtn").addEventListener("click", () => {
    if (!chantWord) return alert("Please enter a chant word!");
    recognition.start();
  });
}