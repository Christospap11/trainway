"use client";

import { useEffect, useRef } from "react";

/**
 * Living backdrop — a real-time WebGL shader that renders flowing, domain-warped
 * "liquid light" in the brand spectrum. Not particles, not blurred blobs: an
 * organic aurora that morphs every frame and bends toward the cursor.
 *
 * Robust by design:
 *  - renders at a fraction of native res (the field is smooth, so nobody can
 *    tell) and caps DPR — fullscreen fragment shaders are the cost here;
 *  - pauses when the tab is hidden;
 *  - honors prefers-reduced-motion (draws one still frame, no loop);
 *  - if WebGL is unavailable, it renders nothing and the CSS gradient behind it
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

// hash / value-noise / fbm ----------------------------------------------------
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
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p = rot * p * 2.0 + 11.3;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  // aspect-correct, centered coordinates
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;

  float t = uTime * 0.05;

  // cursor gravity — warp space toward the pointer so the flow leans into it
  vec2 m = uMouse - uv;
  m.x *= uRes.x / uRes.y;
  float md = length(m);
  p += normalize(m + 1e-4) * uMouseAmt * 0.10 * exp(-md * 2.2);

  // domain warping: fbm of an fbm of an fbm → organic, liquid motion
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t),
                fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + 0.4 * t),
                fbm(p + 3.4 * q + vec2(8.3, 2.8) - 0.3 * t));
  float f = fbm(p + 3.6 * r);

  // a slow ripple that radiates from the cursor
  f += uMouseAmt * 0.12 * exp(-md * 5.0) * sin(uTime * 1.6 - md * 18.0);

  // brand palette — deep and saturated so luminous ribbons glow against space,
  // rather than a pale marble that eats white text -------------------------
  vec3 deep    = vec3(0.018, 0.022, 0.055);
  vec3 indigo  = vec3(0.180, 0.200, 0.620);
  vec3 violet  = vec3(0.360, 0.220, 0.640);
  vec3 fuchsia = vec3(0.620, 0.180, 0.620);
  vec3 cyan    = vec3(0.120, 0.640, 0.720);

  vec3 col = deep;
  col = mix(col, indigo,  smoothstep(0.30, 0.66, f) * 0.95);
  col = mix(col, violet,  smoothstep(0.55, 0.86, f) * 0.85);
  col = mix(col, fuchsia, smoothstep(0.74, 0.98, f) * 0.70);

  // luminous cyan filaments where the warp folds on itself (thin, bright)
  float fil = smoothstep(0.72, 0.97, length(r) * 0.9);
  col += cyan * fil * 0.45;

  // soft bloom under the cursor
  col += (indigo + cyan) * 0.5 * uMouseAmt * exp(-md * 5.0) * 0.45;

  // radial vignette so edges stay deep
  float vig = smoothstep(1.45, 0.25, length(p));
  col *= vig;

  // central scrim: darken the middle band where the hero copy lives, so white
  // text always reads while the aurora keeps flowing behind it
  float cx = length(p * vec2(0.62, 1.0));
  col *= mix(0.42, 1.0, smoothstep(0.15, 1.05, cx));

  // drifting luminous motes — stardust rising slowly through the field, added
  // on top so they twinkle over the hero. Dimmed only by the vignette.
  float asp = uRes.x / uRes.y;
  vec2 up = vec2(uv.x * asp, uv.y);
  for (int i = 0; i < 14; i++) {
    float fi = float(i) + 1.0;
    vec2 c;
    c.x = fract(hash(vec2(fi, 9.1)) + 0.05 * sin(uTime * 0.09 + fi)) * asp;
    c.y = fract(hash(vec2(fi, 2.7)) + uTime * (0.006 + 0.004 * hash(vec2(fi, 4.2))));
    float d = length(up - c);
    float tw = 0.45 + 0.55 * sin(uTime * 1.4 + fi * 2.1); // twinkle
    // a few motes lean cyan, the rest cool white — subtle variety
    vec3 tint = mix(vec3(0.72, 0.86, 1.0), vec3(0.55, 0.95, 1.0), hash(vec2(fi, 5.5)));
    float core = exp(-d * d * 5500.0);       // crisp bright center
    float halo = exp(-d * d * 320.0);        // soft glow
    col += tint * (core * 1.1 + halo * 0.22) * tw * vig;
  }

  // subtle animated grain to kill banding and add texture
  col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.022;

  // light theme: a pale, airy daylight version — soft color on off-white
  if (uLight > 0.5) {
    vec3 pale = vec3(0.945, 0.955, 0.985);
    vec3 tint = indigo * 0.5 + violet * 0.3 + fuchsia * 0.2;
    col = mix(pale, pale - 0.35 * (1.0 - col) + tint * f * 0.5, 0.55);
    col = mix(col, pale, 0.25);
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
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7;

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
      smooth.x += (mouse.x - smooth.x) * 0.06;
      smooth.y += (mouse.y - smooth.y) * 0.06;
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
