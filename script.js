const EVENT_DATE = new Date("2026-09-10T16:00:00+07:00");

const $ = (selector) => document.querySelector(selector);
const pad = (value) => String(value).padStart(2, "0");
let countdownInterval;
let audioContext;
let masterGain;
let noteTimer;
let noteIndex = 0;
let musicPlaying = false;

// Melodi pentatonik lembut yang dibuat langsung dengan Web Audio API.
// Tidak memakai file atau lagu milik pihak lain.
const melody = [
  261.63, 329.63, 392.00, 523.25,
  440.00, 392.00, 329.63, null,
  293.66, 349.23, 440.00, 523.25,
  440.00, 349.23, 329.63, null
];

function playSoftNote(frequency) {
  if (!frequency || !audioContext || audioContext.state !== "running") return;

  const now = audioContext.currentTime;
  const noteGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const primary = audioContext.createOscillator();
  const shimmer = audioContext.createOscillator();

  primary.type = "sine";
  shimmer.type = "triangle";
  primary.frequency.setValueAtTime(frequency, now);
  shimmer.frequency.setValueAtTime(frequency * 2, now);
  shimmer.detune.setValueAtTime(5, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1300, now);

  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.exponentialRampToValueAtTime(0.42, now + 0.08);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);

  primary.connect(filter);
  shimmer.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(masterGain);
  primary.start(now);
  shimmer.start(now);
  primary.stop(now + 1.7);
  shimmer.stop(now + 1.7);
}

function playNextNote() {
  playSoftNote(melody[noteIndex]);
  noteIndex = (noteIndex + 1) % melody.length;
}

async function startMusic() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.075, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
  }

  await audioContext.resume();
  if (musicPlaying) return;
  musicPlaying = true;
  $("#music-toggle").classList.add("playing");
  $("#music-toggle").setAttribute("aria-label", "Jeda musik");
  playNextNote();
  noteTimer = window.setInterval(playNextNote, 900);
}

async function pauseMusic() {
  if (!audioContext) return;
  window.clearInterval(noteTimer);
  musicPlaying = false;
  await audioContext.suspend();
  $("#music-toggle").classList.remove("playing");
  $("#music-toggle").setAttribute("aria-label", "Putar musik");
}

function updateCountdown() {
  const distance = EVENT_DATE.getTime() - Date.now();
  const status = $("#event-status");

  if (distance <= 0) {
    ["#days", "#hours", "#mins", "#secs"].forEach((id) => $(id).textContent = "00");
    status.textContent = "Hari yang dinantikan telah tiba";
    clearInterval(countdownInterval);
    return;
  }

  $("#days").textContent = pad(Math.floor(distance / 86400000));
  $("#hours").textContent = pad(Math.floor((distance % 86400000) / 3600000));
  $("#mins").textContent = pad(Math.floor((distance % 3600000) / 60000));
  $("#secs").textContent = pad(Math.floor((distance % 60000) / 1000));
}

function bukaUndangan() {
  $("#overlay").classList.add("opened");
  document.body.classList.remove("locked");
  sessionStorage.setItem("invitationOpened", "true");
  startMusic();
}

window.bukaUndangan = bukaUndangan;

$("#btn-buka").addEventListener("click", bukaUndangan);
$("#music-toggle").addEventListener("click", () => musicPlaying ? pauseMusic() : startMusic());

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

updateCountdown();
countdownInterval = setInterval(updateCountdown, 1000);
