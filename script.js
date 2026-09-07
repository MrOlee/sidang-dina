const EVENT_DATE = new Date("2026-09-10T16:00:00+07:00");

// Isi ID video YouTube apabila ingin menggunakan musik latar.
// Contoh URL: youtube.com/watch?v=ABC123 -> ID-nya adalah ABC123.
const YOUTUBE_VIDEO_ID = "";

const $ = (selector) => document.querySelector(selector);
const pad = (value) => String(value).padStart(2, "0");
let countdownInterval;
let player;

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
  if (player?.playVideo) player.playVideo();
}

window.bukaUndangan = bukaUndangan;

function onYouTubeIframeAPIReady() {
  if (!YOUTUBE_VIDEO_ID || typeof YT === "undefined") return;

  $("#music-toggle").hidden = false;
  player = new YT.Player("player", {
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: YOUTUBE_VIDEO_ID },
    events: {
      onReady: (event) => event.target.setVolume(45),
      onStateChange: (event) => $("#music-toggle").classList.toggle("playing", event.data === YT.PlayerState.PLAYING)
    }
  });
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

$("#btn-buka").addEventListener("click", bukaUndangan);
$("#music-toggle").addEventListener("click", () => {
  if (!player?.getPlayerState) return;
  player.getPlayerState() === YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
});

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
