// Red, the brick who helps you plan the wall. Red offers a tip when tapped,
// grins when the wall adds up cleanly, and looks careful when the openings
// take out more than the wall can give. Everything Red says goes through the
// bubble's live region so a screen reader hears it too. Moods come from the
// app, never a timer.
(function () {
  "use strict";
  var btn = document.getElementById("red");
  var bubble = document.getElementById("red-bubble");
  var dock = document.getElementById("red-dock");
  var hide = document.getElementById("red-hide");
  if (!btn) { window.Red = { react: function () {}, context: function () {}, say: function () {} }; return; }

  var baseMood = "calm", tipKey = "start", bubbleTimer = null, flashTimer = null, taps = [], tipAt = {};

  var TIPS = {
    start: [
      "Hi, I'm Red! Give me the wall length and height and how it's built, and I'll work out the bricks and the mortar.",
      "A half-brick wall is one brick thick, the usual garden or single-skin wall. A one-brick wall is two skins, far stronger.",
      "Not sure on the height? A course of bricks is 75 mm, so ten courses is about 750 mm. Blocks are 225 mm a course."
    ],
    result: [
      "Order a few spare on top of the count. Bricks chip, and a later batch can be a slightly different shade.",
      "The mortar is mostly sand with cement mixed in. 1:5 suits most bricklaying; use 1:4 for a stronger, more exposed wall.",
      "Lay off a line and keep the joints even at 10 mm. Strike them before the mortar sets so rain runs off the face."
    ],
    openings: [
      "I've taken the doors and windows off the wall area, so the brick count is for the solid part only.",
      "Add up every opening into one square-metre figure. Over the wall's whole area and I'll count nothing to build.",
      "Leave a bit more spare on a wall full of openings, there are more cut bricks around every reveal."
    ]
  };

  function setMood(m) { btn.setAttribute("data-mood", m); }
  function say(text, ms) {
    if (dock.classList.contains("tucked")) return;
    bubble.textContent = text;
    bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.textContent = ""; }, ms || 7000);
  }
  function flash(m, ms) {
    setMood(m);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { setMood(baseMood); }, ms || 1600);
  }
  function tip() {
    var list = TIPS[tipKey] || TIPS.start;
    var i = (tipAt[tipKey] || 0) % list.length;
    tipAt[tipKey] = i + 1;
    say(list[i]);
  }

  btn.addEventListener("click", function () {
    tip();
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t < 1200; });
    taps.push(now);
    if (taps.length >= 5) { taps = []; flash("happy", 1200); say("Steady! One wall at a time.", 2500); }
  });
  hide.addEventListener("click", function () { dock.classList.add("tucked"); bubble.textContent = ""; });

  window.Red = {
    react: function (m) { flash(m); },
    context: function (k) { tipKey = k; },
    say: say
  };
})();
