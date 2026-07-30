"use client";

import { useEffect, useRef } from "react";

/**
 * Living backdrop — "signal field".
 *
 * A real-time WebGL lattice: a fine grid of luminous nodes floating in deep
 * space, breathing with an organic density field, swept every few seconds by a
 * band of light, with data pulses racing along the rows and the whole thing
 * lighting up under the cursor. Precise and technical rather than soft and
 * gaseous — it reads as a machine thinking, not as a lava lamp.
 *
 * Robust by design:
 *  - renders below native res (the field is smooth, so it's invisible) + caps DPR;
 *  - pauses when the tab is hidden;
 *  - honors prefers-reduced-motion (one still frame, no loop);
 *  - if WebGL is unavailable it renders nothing and the CSS gradient behind it
 *    (`.backdrop-base`) shows through, so the page is never blank.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;     // 0..1, y already flipped to shader space
uniform float uMouseAmt;  // 0..1 how present the cursor is
uniform float uLight;     // 0 dark, 1 light

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = rot * p * 2.0 + 11.3;
    amp *= 0.5;
  }
  return v;
}

void main() {
  float asp = uRes.x / uRes.y;
  // centered, aspect-correct coordinates: y spans -0.5 .. 0.5
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;

  float t = uTime;

  // cursor in p-space
  vec2  mp     = (uMouse - 0.5) * vec2(asp, 1.0);
  float mdist  = length(p - mp);
  float cursor = uMouseAmt * exp(-mdist * mdist * 11.0);

  // ── brand palette
  vec3 indigo  = vec3(0.34, 0.35, 0.98);
  vec3 violet  = vec3(0.58, 0.38, 0.98);
  vec3 fuchsia = vec3(0.88, 0.30, 0.96);
  vec3 cyan    = vec3(0.16, 0.86, 0.95);

  // ── deep space + slowly drifting light wells
  vec3 col = vec3(0.009, 0.011, 0.030);

  vec2 w1 = vec2(-0.74 + 0.07 * sin(t * 0.10),  0.28 + 0.05 * cos(t * 0.08));
  vec2 w2 = vec2( 0.80 + 0.06 * cos(t * 0.07),  0.40 + 0.06 * sin(t * 0.11));
  vec2 w3 = vec2( 0.10 + 0.10 * sin(t * 0.06), -0.60 + 0.05 * cos(t * 0.09));

  col += indigo  * 0.40 * exp(-dot(p - w1, p - w1) * 1.9);
  col += fuchsia * 0.24 * exp(-dot(p - w2, p - w2) * 2.4);
  col += cyan    * 0.18 * exp(-dot(p - w3, p - w3) * 2.6);

  // organic density so the lattice breathes instead of reading mechanical
  float dens = smoothstep(0.24, 0.86, fbm(p * 1.5 + vec2(t * 0.025, -t * 0.018)));

  // ── scanning signal wave (a band of light sweeping diagonally)
  float axis  = dot(p, normalize(vec2(0.82, 0.57)));
  float sweep = fract(t * 0.075) * 3.4 - 1.7;
  float band  = exp(-pow((axis - sweep) * 4.0, 2.0));

  // ── the lattice
  float cell = 0.042;
  vec2  gf   = fract(p / cell) - 0.5;

  // faint grid lines
  float lineD = min(abs(gf.x), abs(gf.y)) * cell;
  float line  = smoothstep(0.0013, 0.0, lineD);
  col += mix(indigo, cyan, 0.45) * line
       * (0.028 + 0.13 * dens + 0.26 * band + 0.42 * cursor);

  // nodes at the intersections. Kept deliberately restrained: this field sits
  // behind body copy on every section below the hero, so it has to read as
  // atmosphere rather than compete with the text.
  float dn   = length(gf) * cell;
  float node = smoothstep(0.0034, 0.0, dn);
  col += mix(vec3(0.78, 0.87, 1.0), cyan, 0.35) * node
       * (0.11 + 0.40 * dens + 1.20 * band + 1.90 * cursor);

  // node halo — gives the field air and depth
  col += cyan * exp(-dn * dn * 9000.0)
       * (0.04 + 0.22 * band + 0.45 * cursor);

  // ── data pulses racing along lattice rows
  float pulse = 0.0;  // kept separate so the light theme can use it too
  for (int i = 0; i < 5; i++) {
    float fi    = float(i);
    float row   = floor(((hash(vec2(fi, 3.7)) - 0.5) * 1.05) / cell) * cell;
    float speed = 0.18 + 0.14 * hash(vec2(fi, 8.2));
    float x     = fract(hash(vec2(fi, 1.9)) + t * speed) * (2.6 * asp) - 1.3 * asp;

    float dy    = p.y - row;
    float yfall = exp(-dy * dy * 90000.0);

    // trailing streak behind the head
    float dx    = x - p.x;
    float trail = smoothstep(0.13, 0.0, dx) * step(0.0, dx);

    // the bright head itself
    float d = length(p - vec2(x, row));

    pulse += trail * yfall * 0.35 + exp(-d * d * 4000.0);
  }
  col += mix(cyan, vec3(1.0), 0.35) * pulse * 0.70;

  // ── depth: radial vignette so the edges fall away
  col *= smoothstep(1.55, 0.20, length(p));

  // kill banding
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) * 0.02;

  // ── light theme: the same machine, drawn as coloured ink on warm paper.
  // It has to carry real presence here or the page reads as blank graph paper,
  // so the lattice bites harder and the wells are tinted rather than washed.
  if (uLight > 0.5) {
    vec3 paper = vec3(0.960, 0.966, 0.988);
    vec3 tint  = mix(indigo, violet, 0.5);

    // Lines stay faint and nodes carry the structure, so this reads as a
    // constellation of points rather than a sheet of graph paper.
    float ink = line * (0.20 + 0.38 * band + 0.70 * cursor)
              + node * (1.00 + 1.35 * band + 1.85 * cursor);

    vec3 lcol = paper;
    // Wells first, so the ink sits on top of the colour rather than under it.
    // Light mode gets its presence from COLOUR rather than from grid contrast —
    // a high-contrast lattice on white just reads as busy graph paper.
    lcol = mix(lcol, tint,    0.44 * exp(-dot(p - w1, p - w1) * 1.9));
    lcol = mix(lcol, fuchsia, 0.30 * exp(-dot(p - w2, p - w2) * 2.4));
    lcol = mix(lcol, cyan,    0.26 * exp(-dot(p - w3, p - w3) * 2.6));

    lcol = mix(lcol, vec3(0.30, 0.33, 0.56), clamp(ink, 0.0, 1.0) * 0.72);
    lcol = mix(lcol, mix(tint, cyan, 0.4), clamp(pulse, 0.0, 1.0) * 0.60);
    lcol = mix(lcol, tint, 0.08 * band);

    // keep the corners airy
    lcol = mix(paper, lcol, smoothstep(1.60, 0.30, length(p)));
    col = lcol;
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function LivingBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: true }) as WebGLRenderingContext | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return; // .backdrop-base gradient shows through
    // non-null locals so the render/resize closures below narrow cleanly
    const g = gl;
    const cv = canvas;

    const vs = compile(g, g.VERTEX_SHADER, VERT);
    const fs = compile(g, g.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = g.createProgram();
    if (!prog) return;
    g.attachShader(prog, vs);
    g.attachShader(prog, fs);
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) return;
    g.useProgram(prog);

    // fullscreen triangle
    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const aPos = g.getAttribLocation(prog, "aPos");
    g.enableVertexAttribArray(aPos);
    g.vertexAttribPointer(aPos, 2, g.FLOAT, false, 0, 0);

    const uRes = g.getUniformLocation(prog, "uRes");
    const uTime = g.getUniformLocation(prog, "uTime");
    const uMouse = g.getUniformLocation(prog, "uMouse");
    const uMouseAmt = g.getUniformLocation(prog, "uMouseAmt");
    const uLight = g.getUniformLocation(prog, "uLight");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // render below native res — the field is smooth, so it's invisible + cheap
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;

    let width = 0;
    let height = 0;
    const mouse = { x: 0.5, y: 0.5, amt: 0 };
    const smooth = { x: 0.5, y: 0.5, amt: 0 };
    let raf = 0;
    let start = 0;

    function resize() {
      width = Math.max(1, Math.floor(window.innerWidth * scale));
      height = Math.max(1, Math.floor(window.innerHeight * scale));
      cv.width = width;
      cv.height = height;
      cv.style.width = "100%";
      cv.style.height = "100%";
      g.viewport(0, 0, width, height);
    }

    function isLight() {
      return document.documentElement.classList.contains("light") ? 1 : 0;
    }

    function render(ms: number) {
      if (!start) start = ms;
      const time = (ms - start) / 1000;

      // ease cursor + presence for silky motion
      smooth.x += (mouse.x - smooth.x) * 0.07;
      smooth.y += (mouse.y - smooth.y) * 0.07;
      smooth.amt += (mouse.amt - smooth.amt) * 0.05;

      g.uniform2f(uRes, width, height);
      g.uniform1f(uTime, time);
      g.uniform2f(uMouse, smooth.x, smooth.y);
      g.uniform1f(uMouseAmt, smooth.amt);
      g.uniform1f(uLight, isLight());
      g.drawArrays(g.TRIANGLES, 0, 3);
    }

    function loop(ms: number) {
      render(ms);
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1 - e.clientY / window.innerHeight; // flip to shader space
      mouse.amt = 1;
    }
    function onLeave() {
      mouse.amt = 0;
    }
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && !reduceMotion) {
        raf = requestAnimationFrame(loop);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      render(0); // single still frame
    } else {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseout", onLeave);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      g.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="backdrop-base ambient-layer pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {/* deepen the very bottom so the footer has something to sit against */}
      <div className="absolute inset-x-0 bottom-0 h-[35vh] bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
