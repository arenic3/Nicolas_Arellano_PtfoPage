(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var CELL = 2;
  var FPS = 18;
  var MAX_PATCHES = 3;
  var SPAWN_CHANCE = 0.02;

  var column = document.querySelector(".terminal");
  if (!column) return;

  function makeCanvas(id) {
    var c = document.createElement("canvas");
    c.id = id;
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    return { el: c, ctx: c.getContext("2d") };
  }

  // Margins: crisp and strong. Column: faint and blurred so text stays readable.
  var margin = makeCanvas("glitch-margin");
  var inner = makeCanvas("glitch-column");

  var W = 0;
  var H = 0;
  var patches = [];
  var last = 0;

  function resize() {
    W = Math.ceil(window.innerWidth / CELL);
    H = Math.ceil(window.innerHeight / CELL);
    [margin, inner].forEach(function (layer) {
      layer.el.width = W;
      layer.el.height = H;
    });
  }

  function spawn(colL, colR) {
    var rx = 18 + Math.random() * 40;
    var ry = 1.5 + Math.random() * 3.5;
    var hasMargin = Math.min(colL, W - colR) > 10;
    var cx;
    if (!hasMargin) {
      cx = colL + Math.random() * (colR - colL);
    } else {
      var left = Math.random() < 0.5;
      var edge = left ? colL : colR;
      var dir = left ? -1 : 1;
      if (Math.random() < 0.7) {
        // Straddles the column edge so part of it bleeds in, blurred
        cx = edge + dir * (Math.random() * rx * 0.6 - rx * 0.1);
      } else {
        var room = left ? colL : W - colR;
        cx = edge + dir * Math.random() * Math.max(1, room - rx);
      }
    }
    patches.push({
      cx: cx,
      cy: ry + Math.random() * Math.max(1, H - 2 * ry),
      rx: rx,
      ry: ry,
      born: performance.now(),
      life: 250 + Math.random() * 500,
    });
  }

  function drawPatch(ctx, p, gain) {
    var rows = Math.ceil(p.ry);
    for (var j = -rows; j <= rows; j++) {
      var rowGain = 0.5 + Math.random() * 0.5;
      var tear = Math.random() < 0.2 ? Math.round((Math.random() - 0.5) * 6) : 0;
      var cols = Math.ceil(p.rx);
      for (var i = -cols; i <= cols; i++) {
        var d = (i * i) / (p.rx * p.rx) + (j * j) / (p.ry * p.ry);
        if (d > 1) continue;
        var density = 1 - d;
        if (Math.random() > density * 1.1) continue;
        var v = 110 + Math.floor(Math.random() * 145);
        var a = gain * rowGain * (0.3 + 0.7 * density);
        ctx.fillStyle = "rgba(" + v + "," + v + "," + v + "," + a.toFixed(3) + ")";
        ctx.fillRect(Math.round(p.cx + i + tear), Math.round(p.cy + j), 1, 1);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || now - last < 1000 / FPS) return;
    last = now;

    var rect = column.getBoundingClientRect();
    var colL = rect.left / CELL;
    var colR = rect.right / CELL;

    patches = patches.filter(function (p) {
      return now - p.born < p.life;
    });
    if (patches.length < MAX_PATCHES && Math.random() < SPAWN_CHANCE) spawn(colL, colR);

    margin.ctx.clearRect(0, 0, W, H);
    inner.ctx.clearRect(0, 0, W, H);

    margin.ctx.save();
    margin.ctx.beginPath();
    margin.ctx.rect(0, 0, W, H);
    margin.ctx.rect(colL, 0, colR - colL, H);
    margin.ctx.clip("evenodd");

    inner.ctx.save();
    inner.ctx.beginPath();
    inner.ctx.rect(colL, 0, colR - colL, H);
    inner.ctx.clip();

    patches.forEach(function (p) {
      var t = (now - p.born) / p.life;
      var fade = Math.sin(Math.PI * t);
      p.cx += Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
      drawPatch(margin.ctx, p, 0.85 * fade);
      drawPatch(inner.ctx, p, 0.9 * fade);
    });

    margin.ctx.restore();
    inner.ctx.restore();
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);
})();
