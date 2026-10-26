// Inline all icon <img> tags as <svg> so CSS (fill/stroke: currentColor) can theme them.
(function () {
  function inlineIcon(img) {
    var src = img.getAttribute("src");
    return fetch(src)
      .then(function (res) {
        if (!res.ok) throw new Error(src + ": " + res.status);
        return res.text();
      })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, "image/svg+xml");
        var svg = doc.querySelector("svg");
        if (!svg) return;
        svg.classList.add("icon");
        img.classList.forEach(function (c) {
          if (c !== "icon") svg.classList.add(c);
        });
        var label = img.getAttribute("alt");
        if (label) {
          var title = doc.createElementNS("http://www.w3.org/2000/svg", "title");
          title.textContent = label;
          svg.insertBefore(title, svg.firstChild);
          svg.setAttribute("role", "img");
        } else {
          svg.setAttribute("aria-hidden", "true");
        }
        img.replaceWith(svg);
      })
      .catch(function (err) {
        // Fetch/parse failed (e.g. opened over file://, or a renamed icon) — img.icon
        // stays in the DOM as a plain <img>, uncolored by the dark theme.
        console.error("icon inline failed:", err);
      });
  }

  document.querySelectorAll("img.icon").forEach(inlineIcon);

  var links = document.querySelectorAll("nav.main-nav a");
  var here = location.pathname.replace(/\/$/, "") || "/";
  links.forEach(function (link) {
    var href = link.getAttribute("href").replace(/\/$/, "") || "/";
    if (href === here) link.classList.add("active");
  });

  // ASCII portrait: characters appear in random order while a greeting types
  // and vanish while it deletes. The typewriter drives it, so both stay in step.
  // Hidden characters become spaces, so every row keeps its length and the
  // portrait never shifts or resizes.
  var portraitEl = document.getElementById("portrait");
  var portraitChars = portraitEl ? portraitEl.textContent.split("") : [];
  var portraitInk = []; // indexes of visible characters, in reveal order
  var portraitRank = []; // portraitRank[charIndex] = position in reveal order
  portraitChars.forEach(function (ch, i) {
    if (ch !== " " && ch !== "\n") portraitInk.push(i);
  });

  function shufflePortrait() {
    for (var i = portraitInk.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = portraitInk[i];
      portraitInk[i] = portraitInk[j];
      portraitInk[j] = tmp;
    }
    portraitInk.forEach(function (charIndex, rank) {
      portraitRank[charIndex] = rank;
    });
  }

  function drawPortrait(fraction) {
    if (!portraitEl) return;
    var shown = Math.round(fraction * portraitInk.length);
    portraitEl.textContent = portraitChars
      .map(function (ch, i) {
        var rank = portraitRank[i];
        return rank === undefined || rank < shown ? ch : " ";
      })
      .join("");
  }

  // Typewriter greeting: cycles the name through several languages,
  // typing and backspacing in a loop. Skipped entirely for
  // prefers-reduced-motion — shows the plain English greeting instead.
  var typewriterEl = document.getElementById("typewriter-text");
  if (typewriterEl) {
    var greetings = [
      { text: "Hi! I'm Mazine", dir: "ltr" },
      { text: "مرحبًا! أنا مازن", dir: "rtl" },
      { text: "¡Hola! Soy Mazine", dir: "ltr" },
      { text: "Olá! Sou Mazine", dir: "ltr" },
      { text: "Salut ! Je suis Mazine", dir: "ltr" },
    ];
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      typewriterEl.textContent = greetings[0].text;
    } else {
      var nameHeading = document.getElementById("typewriter-name");
      var index = 0;
      var TYPE_MS = 55;
      var DELETE_MS = 28;
      var HOLD_MS = 1800;

      function typePhrase(phrase, onDone) {
        var i = 0;
        nameHeading.dir = phrase.dir;
        shufflePortrait(); // new reveal order for each greeting
        (function step() {
          typewriterEl.textContent = phrase.text.slice(0, i);
          drawPortrait(i / phrase.text.length);
          i++;
          if (i <= phrase.text.length) {
            setTimeout(step, TYPE_MS);
          } else {
            onDone();
          }
        })();
      }

      function deletePhrase(phrase, onDone) {
        var i = phrase.text.length;
        (function step() {
          typewriterEl.textContent = phrase.text.slice(0, i);
          drawPortrait(i / phrase.text.length);
          i--;
          if (i >= 0) {
            setTimeout(step, DELETE_MS);
          } else {
            onDone();
          }
        })();
      }

      function cycle() {
        var phrase = greetings[index];
        typePhrase(phrase, function () {
          setTimeout(function () {
            deletePhrase(phrase, function () {
              index = (index + 1) % greetings.length;
              cycle();
            });
          }, HOLD_MS);
        });
      }

      cycle();
    }
  }
})();
