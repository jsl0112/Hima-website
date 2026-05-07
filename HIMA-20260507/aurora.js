/**
 * Aurora — 顶部流动渐变光影
 * 基于参考 Aurora 组件的 WebGL2 shader，纯原生实现（无 React / OGL 依赖）
 */
(function () {
  'use strict';

  const container = document.getElementById('aurora-wrap');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true
  });
  if (!gl) {
    // fallback: 如果不支持 WebGL2 则静默退出
    console.warn('Aurora: WebGL2 not supported');
    return;
  }

  // --- 配置 ---
  const CONFIG = {
    colorStops: ['#000000', '#0a0833', '#0136E6'],  // 黑→深紫→蓝
    speed: 0.5,
    blend: 0.5,
    amplitude: 1.0
  };

  // --- Shaders ---
  const VERT = `#version 300 es
    in vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const FRAG = `#version 300 es
    precision highp float;

    uniform float uTime;
    uniform float uAmplitude;
    uniform vec3 uColorStops[3];
    uniform vec2 uResolution;
    uniform float uBlend;

    out vec4 fragColor;

    vec3 permute(vec3 x) {
      return mod(((x * 34.0) + 1.0) * x, 289.0);
    }

    float snoise(vec2 v){
      const vec4 C = vec4(
          0.211324865405187, 0.366025403784439,
          -0.577350269189626, 0.024390243902439
      );
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);

      vec3 p = permute(
          permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0)
      );

      vec3 m = max(
          0.5 - vec3(
              dot(x0, x0),
              dot(x12.xy, x12.xy),
              dot(x12.zw, x12.zw)
          ),
          0.0
      );
      m = m * m;
      m = m * m;

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    struct ColorStop {
      vec3 color;
      float position;
    };

    #define COLOR_RAMP(colors, factor, finalColor) {              \\
      int index = 0;                                            \\
      for (int i = 0; i < 2; i++) {                               \\
         ColorStop currentColor = colors[i];                    \\
         bool isInBetween = currentColor.position <= factor;    \\
         index = int(mix(float(index), float(i), float(isInBetween))); \\
      }                                                         \\
      ColorStop currentColor = colors[index];                   \\
      ColorStop nextColor = colors[index + 1];                  \\
      float range = nextColor.position - currentColor.position; \\
      float lerpFactor = (factor - currentColor.position) / range; \\
      finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;

      ColorStop colors[3];
      colors[0] = ColorStop(uColorStops[0], 0.0);
      colors[1] = ColorStop(uColorStops[1], 0.5);
      colors[2] = ColorStop(uColorStops[2], 1.0);

      vec3 rampColor;
      COLOR_RAMP(colors, uv.x, rampColor);

      float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
      height = exp(height);
      height = (uv.y * 2.0 - height + 0.2);
      float intensity = 0.6 * height;

      float midPoint = 0.20;
      float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

      vec3 auroraColor = intensity * rampColor;

      fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
    }
  `;

  // --- 工具函数 ---
  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.substring(0, 2), 16) / 255,
      parseInt(hex.substring(2, 4), 16) / 255,
      parseInt(hex.substring(4, 6), 16) / 255
    ];
  }

  function createShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Aurora shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  // --- 编译 & 链接 ---
  const vs = createShader(gl.VERTEX_SHADER, VERT);
  const fs = createShader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Aurora program error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // --- 全屏三角形 ---
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  3, -1,  -1, 3
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'aPosition');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // --- Uniforms ---
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uAmplitude = gl.getUniformLocation(prog, 'uAmplitude');
  const uBlend = gl.getUniformLocation(prog, 'uBlend');
  const uResolution = gl.getUniformLocation(prog, 'uResolution');
  const uColorStops = gl.getUniformLocation(prog, 'uColorStops');

  // 设置颜色
  const colorData = CONFIG.colorStops.flatMap(hexToRGB);
  gl.uniform3fv(uColorStops, new Float32Array(colorData));
  gl.uniform1f(uAmplitude, CONFIG.amplitude);
  gl.uniform1f(uBlend, CONFIG.blend);

  // --- Resize ---
  function resize() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Blend ---
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  // --- Animation ---
  let rafId;
  function render(t) {
    rafId = requestAnimationFrame(render);
    // t in ms → slow time
    const time = t * 0.01 * CONFIG.speed * 0.1;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  rafId = requestAnimationFrame(render);
})();
