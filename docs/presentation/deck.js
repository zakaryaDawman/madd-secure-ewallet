/* MADD viva deck: navigation, counter, progress bar, full screen (F) and speaker notes (N).
   Each file in parts/ calls addPart() with its slides; this file shows them one at a time. */

const PARTS = [];

/** Called by each parts/*.js file to register its slides (HTML strings, in order). */
function addPart(slidesHtml) {
  PARTS.push(...slidesHtml);
}

/** Draws the madda wave on any canvas with class "wave". */
function drawWaves() {
  document.querySelectorAll("canvas.wave").forEach((canvas) => {
    const g = canvas.getContext("2d");
    for (let k = 0; k < 9; k++) {
      g.beginPath();
      for (let x = 0; x <= canvas.width; x += 6) {
        const y = 280 + k * 46 + Math.sin(x / 120 + k * 0.5) * (40 + k * 6);
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.strokeStyle = `rgba(185,204,255,${0.08 + k * 0.025})`;
      g.lineWidth = 3;
      g.stroke();
    }
  });
}

/** Puts every registered slide into the stage and numbers the running headers. */
function buildSlides() {
  const stage = document.getElementById("stage");
  stage.innerHTML = PARTS.join("");
  stage.querySelectorAll(".slide").forEach((slide, i) => {
    const num = slide.querySelector(".run .num");
    if (num) num.textContent = String(i + 1).padStart(2, "0");
  });
  return [...stage.querySelectorAll(".slide")];
}

const deck = { slides: [], current: 0, notesOpen: false };

/** Shows slide i (at its first step, or its last when going back) and updates the counter, progress bar and notes. */
function show(i, atEnd = false) {
  deck.current = Math.max(0, Math.min(deck.slides.length - 1, i));
  const slide = deck.slides[deck.current];
  if (slide.dataset.steps) setStep(slide, atEnd ? Number(slide.dataset.steps) : 1);
  deck.slides.forEach((s, k) => s.classList.toggle("on", k === deck.current));
  document.getElementById("count").textContent = `${deck.current + 1} / ${deck.slides.length}`;
  document.getElementById("progress").style.width = `${((deck.current + 1) / deck.slides.length) * 100}%`;
  renderNotes();
}

/** Shows step n of a step-by-step slide: CSS reveals everything marked for steps up to n. */
function setStep(slide, n) {
  slide.dataset.step = String(n);
}

/** Moves forward: the next step on a step-by-step slide, else the next slide. */
function forward() {
  const slide = deck.slides[deck.current];
  const step = Number(slide.dataset.step || 0);
  if (step && step < Number(slide.dataset.steps)) setStep(slide, step + 1);
  else show(deck.current + 1);
}

/** Moves back: the previous step on a step-by-step slide, else the previous slide at its last step. */
function backward() {
  const slide = deck.slides[deck.current];
  const step = Number(slide.dataset.step || 0);
  if (step > 1) setStep(slide, step - 1);
  else show(deck.current - 1, true);
}

/** Fills the notes panel, if open: the simple English and Arabic notes from parts/notes-*.js, else the slide's own notes. */
function renderNotes() {
  const panel = document.getElementById("notes");
  panel.hidden = !deck.notesOpen;
  if (!deck.notesOpen) return;
  const slide = deck.slides[deck.current];
  const simple = typeof NOTES === "object" ? NOTES[slide.getAttribute("aria-label")] : undefined;
  const notes = slide.querySelector(".notes");
  const body = simple
    ? `${simple.en.map((p) => `<p>${p}</p>`).join("")}<div class="ar" lang="ar" dir="rtl">${simple.ar.map((p) => `<p>${p}</p>`).join("")}</div>`
    : notes ? notes.innerHTML : "<p>No notes for this slide.</p>";
  panel.innerHTML = `<h5>Speaker notes · slide ${deck.current + 1}</h5>${body}`;
}

/** Scales the 1920×1080 stage to fit the window without cropping. */
function fit() {
  const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.getElementById("stage").style.transform = `translate(-50%, -50%) scale(${scale})`;
}

/** Toggles browser full screen; ignored where it is not allowed. */
function toggleFull() {
  const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  request?.catch?.(() => {});
}

/** Opens or closes the speaker notes. */
function toggleNotes() {
  deck.notesOpen = !deck.notesOpen;
  renderNotes();
}

/** Handles the presenter's keys: arrows, space, Home/End, F and N. */
function onKey(e) {
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); forward(); }
  if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); backward(); }
  if (e.key === "Home") show(0);
  if (e.key === "End") show(deck.slides.length - 1);
  if (e.key === "f" || e.key === "F") toggleFull();
  if (e.key === "n" || e.key === "N") toggleNotes();
}

/** Starts the deck once every part has loaded. */
function start() {
  deck.slides = buildSlides();
  drawWaves();
  fit();
  show(0);
  addEventListener("resize", fit);
  addEventListener("keydown", onKey);
  document.getElementById("prev").onclick = backward;
  document.getElementById("next").onclick = forward;
  document.getElementById("full").onclick = toggleFull;
  document.getElementById("notes-btn").onclick = toggleNotes;
  document.getElementById("stage").addEventListener("click", (e) => (e.clientX < innerWidth / 3 ? backward() : forward()));
}

addEventListener("DOMContentLoaded", start);
