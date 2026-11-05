// Modo Premium: shaders de modelos, marcas no chão, partículas e pós-processamento.

// ---------- Modelos (unidades, prédios, destroços) ----------

const MODEL_VS = `
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec4 aCol;
layout(location=3) in vec4 aMat;
layout(location=4) in vec4 iM0;
layout(location=5) in vec4 iM1;
layout(location=6) in vec4 iM2;
layout(location=7) in vec4 iTeam;
layout(location=8) in vec4 iExtra;
uniform mat4 uVP;
uniform float uTime;
out vec3 vP;
out vec3 vN;
out vec3 vL;
out vec4 vCol;
out vec4 vMat;
out vec4 vTeam;
out vec4 vExtra;
out float vH;
void main() {
  vec3 p = aPos;
  vec3 n = aNrm;
  float fx = floor(aMat.a * 255.0 + 0.5);
  if (fx == 11.0 || fx == 12.0) {
    // Vento nas folhas e no capim
    float sw = sin(uTime * 1.7 + iM0.w * 0.031 + iM1.w * 0.027) + 0.5 * sin(uTime * 2.9 + iM1.w * 0.05 + iExtra.w);
    float amp = fx == 12.0 ? 0.14 : 0.03;
    p.x += sw * amp * p.z;
    p.y += sw * amp * 0.45 * p.z;
  }
  if (fx == 5.0) {
    // Pano da bandeira tremulando (mais solto na ponta)
    float k = clamp(p.x / 12.0, 0.0, 1.0);
    float ph = uTime * 7.0 - p.x * 0.55 + iExtra.w;
    float w = (sin(ph) * 1.3 + sin(ph * 1.7 + p.z * 0.4) * 0.5) * k;
    p.y += w;
    p.z += sin(ph * 0.8) * 0.4 * k;
    n = normalize(vec3(-cos(ph) * 0.7 * k, 1.0, 0.0));
  }
  vec4 P4 = vec4(p, 1.0);
  vP = vec3(dot(iM0, P4), dot(iM1, P4), dot(iM2, P4));
  vN = normalize(vec3(dot(iM0.xyz, n), dot(iM1.xyz, n), dot(iM2.xyz, n)));
  vL = p;
  vCol = aCol;
  vMat = aMat;
  vTeam = iTeam;
  vExtra = iExtra;
  vH = vP.z - iM2.w;
  gl_Position = uVP * vec4(vP, 1.0);
}
`;

const MODEL_FS = GLSL_NOISE + GLSL_LIGHT + `
in vec3 vP;
in vec3 vN;
in vec3 vL;
in vec4 vCol;
in vec4 vMat;
in vec4 vTeam;
in vec4 vExtra;
in float vH;
out vec4 oCol;
uniform float uGroundAO;
void main() {
  if (vL.z > vExtra.x) discard;
  float fx = floor(vMat.a * 255.0 + 0.5);
#ifdef SHADOW
  oCol = vec4(0.0);
  return;
#else
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = uViewDir;
  // Malhas com faces de ordem invertida (pedras, copas): a normal visível sempre aponta para a câmera
  if (dot(N, V) < 0.0) N = -N;
#ifdef HOLO
  float fres = pow(1.0 - abs(dot(N, V)), 1.5);
  float scan = 0.5 + 0.5 * sin(vP.z * 1.4 - uTime * 7.0);
  vec3 hc = vExtra.y > 1.5 ? vec3(1.0, 0.18, 0.12) : vec3(0.2, 1.0, 0.55);
  // Corpo visível (luz do sol na forma) + borda brilhante + faixas de varredura
  float lam = max(dot(N, uSunDir), 0.0) * 0.6 + 0.4;
  // A laje baixa fica quase transparente: o que aparece é a forma do prédio
  float a = (0.42 + fres * 0.4 + scan * 0.1) * (0.25 + 0.75 * smoothstep(1.5, 5.0, vL.z));
  // Abaixo do limiar do bloom: a forma aparece em vez de virar uma laje estourada
  oCol = vec4(min(hc * (0.75 * lam + fres * 1.2 + scan * 0.35), vec3(1.0)) * a, a * 0.7);
  return;
#endif
#ifdef XRAY
  float fr2 = pow(1.0 - abs(dot(N, V)), 1.2);
  vec3 xc = vTeam.rgb * 1.4 + 0.06;
  float xa = 0.18 + fr2 * 0.4;
  oCol = vec4(xc * xa, xa * 0.7);
  return;
#endif
  vec3 base = pow(vCol.rgb, vec3(2.2));
  vec3 alb = mix(base, vTeam.rgb * (0.04 + base * 0.8), vCol.a);
  float rough = vMat.r, metal = vMat.g, emis = vMat.b;
  // Desgaste: variação de tom, sujeira embaixo, poeira nas superfícies de cima
  float n1 = vnoise(vL.xy * 0.55 + vL.z * 0.35 + vExtra.w);
  float n2 = vnoise(vL.xy * 2.1 + vL.z * 1.3);
  alb *= 0.9 + 0.14 * n1 + 0.06 * n2;
  // Sujeira na base (não nas pedras: elas são baixas e ficariam pretas e azuladas)
  float dirt = (1.0 - smoothstep(0.0, 4.5, vH + n1 * 2.0)) * 0.55 * (1.0 - step(abs(fx - 13.0), 0.5));
  alb = mix(alb, vec3(0.13, 0.1, 0.07), dirt);
  float dust = smoothstep(0.6, 0.95, N.z) * smoothstep(0.45, 0.8, n1) * 0.1 * step(fx, 10.5);
  alb = mix(alb, vec3(0.32, 0.27, 0.2), dust);
  rough = clamp(rough + dust * 0.4 + (n2 - 0.5) * 0.1, 0.04, 1.0);
  if (fx == 1.0) {
    // Esteira: gomos que andam com o odômetro
    float s = fract((vL.x + vExtra.z) * 0.6);
    alb *= mix(0.35, 1.25, smoothstep(0.3, 0.42, s) * (1.0 - smoothstep(0.8, 0.95, s)));
  } else if (fx == 7.0) {
    float s = fract((vL.x + vL.y - vL.z) * 0.16);
    alb = s < 0.5 ? vec3(0.78, 0.48, 0.02) : vec3(0.015);
    alb *= 0.8 + 0.3 * n1;
  } else if (fx == 12.0) {
    alb *= mix(0.4, 1.25, clamp(vL.z / 4.5, 0.0, 1.0));
    dirt = 0.0;
  } else if (fx == 11.0) {
    alb *= 0.8 + 0.4 * n2;
  } else if (fx == 9.0) {
    float a = atan(vL.z, vL.x);
    alb *= 0.6 + 0.5 * step(0.5, fract(a * 2.5));
  }
  // Dano: chamuscado escuro em manchas
  float dmg = vTeam.a;
  if (dmg > 0.0) {
    float b = smoothstep(0.78 - dmg * 0.55, 0.9 - dmg * 0.55, fbm3(vP.xy * 0.08 + vL.z * 0.12));
    alb = mix(alb, vec3(0.018, 0.015, 0.012), b * 0.94);
    rough = mix(rough, 0.95, b);
    metal *= 1.0 - b;
  }
  float sh = shadowAt(vP, N) * cloudShadow(vP);
  // Pedras pequenas: o mapa de sombra é grosso demais para elas e as apagaria inteiras
  if (fx == 13.0) sh = max(sh, 0.6 * smoothstep(0.0, 0.3, dot(N, uSunDir)));
  float ao = mix(uGroundAO, 1.0, smoothstep(0.0, 7.0, vH));
  vec3 col;
  if (fx == 2.0) {
    // Vidro: reflexo do céu e luz de dentro
    vec3 R = reflect(-V, N);
    float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
    col = shade(vP, N, alb * 0.15, 0.05, 0.0, 1.0, sh) + envColor(R) * fres * 0.9;
  } else {
    col = shade(vP, N, alb, rough, metal, ao, sh);
  }
  if (fx == 11.0 || fx == 12.0) col += alb * uSunCol * 0.22 * sh * (0.6 + 0.4 * n1);
  // Brilho próprio
  vec3 ecol = base;
  float e = emis * 5.0;
  if (fx == 3.0) e *= step(0.55, fract(uTime * 0.7 + vExtra.w * 0.137)) * 1.8 + 0.08;
  else if (fx == 4.0) ecol = vTeam.rgb * 1.3 + 0.05;
  else if (fx == 6.0) { ecol = vec3(0.12, 1.0, 0.85); e *= 0.8 + 0.4 * n2; }
  else if (fx == 8.0) e *= vExtra.y;
  else if (fx == 10.0) e *= (0.2 + 0.8 * vExtra.y) * (0.8 + 0.2 * sin(uTime * 3.0 + vExtra.w));
  col += ecol * e;
  // Luz de borda (separa as unidades do chão) e clarão quando leva tiro
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += (uSkyCol * 0.3 + vTeam.rgb * 0.15 * vCol.a) * rim * sh;
  col += vec3(1.0, 0.7, 0.4) * vExtra.y * 0.0;
  // Montagem: faixa de luz que sobe
  if (vExtra.x < 900.0) {
    float d = vExtra.x - vL.z;
    col = mix(col, col * vec3(0.55, 0.85, 1.1), 0.4);
    col += vec3(0.35, 0.9, 1.0) * smoothstep(3.0, 0.0, d) * 5.0;
    col += vec3(0.2, 0.6, 0.8) * step(0.92, fract(vL.z * 0.5 + vL.x * 0.05)) * 0.6;
  }
  oCol = vec4(applyFow(col, vP), 1.0);
#endif
}
`;

// ---------- Marcas no chão (queimado, esteira, anel de seleção, sombra de contato, onda de choque) ----------

const DECAL_VS = `
layout(location=0) in vec2 aPos;
layout(location=4) in vec4 iA; // x, y, z, ângulo
layout(location=5) in vec4 iB; // largura, altura, tipo, alfa
layout(location=6) in vec4 iC; // cor rgb, semente
uniform mat4 uVP;
out vec2 vUv;
out vec4 vB;
out vec4 vC;
out vec3 vP;
void main() {
  float c = cos(iA.w), s = sin(iA.w);
  vec2 o = aPos * iB.xy * 0.5;
  vec2 xy = iA.xy + vec2(c * o.x - s * o.y, s * o.x + c * o.y);
  vP = vec3(xy, iA.z);
  vUv = aPos;
  vB = iB;
  vC = iC;
  gl_Position = uVP * vec4(vP, 1.0);
}
`;

const DECAL_FS = GLSL_NOISE + `
in vec2 vUv;
in vec4 vB;
in vec4 vC;
in vec3 vP;
out vec4 oCol;
uniform float uTime;
void main() {
  float type = floor(vB.z + 0.5);
  float r = length(vUv);
  float a = vB.w;
#ifdef MULTIPLY
  float dark = 0.0;
  if (type == 0.0) {
    // Queimado: mancha irregular com borda suja
    float n = fbm3(vUv * 2.2 + vC.w * 7.0);
    dark = smoothstep(1.0, 0.25, r + (n - 0.5) * 0.7) * 0.82;
    dark *= 0.7 + 0.3 * vnoise(vUv * 9.0 + vC.w);
  } else if (type == 1.0) {
    // Duas trilhas de esteira (gomos)
    float side = abs(vUv.y);
    float band = smoothstep(0.95, 0.75, side) * smoothstep(0.2, 0.42, side);
    float g = 0.6 + 0.4 * step(0.5, fract(vUv.x * 2.0));
    dark = band * g * 0.42;
  } else if (type == 3.0) {
    dark = smoothstep(1.0, 0.1, r) * 0.6;
  } else if (type == 5.0) {
    // Sombra de contato retangular (prédios)
    vec2 q = abs(vUv);
    float m = max(q.x, q.y);
    dark = smoothstep(1.0, 0.82, m) * 0.5;
  } else if (type == 6.0) {
    // Escombros: chão escuro e sujo
    float n = fbm3(vUv * 3.0 + vC.w * 3.0);
    vec2 q = abs(vUv);
    dark = smoothstep(1.0, 0.7, max(q.x, q.y) + (n - 0.5) * 0.4) * (0.55 + 0.35 * n);
  } else if (type == 9.0) {
    // Trilha de terra batida: borda irregular, dois sulcos de roda e grão do chão
    float n = vnoise(vP.xy * 0.05 + vC.w);
    float side = abs(vUv.y + (n - 0.5) * 0.3);
    float body = smoothstep(1.0, 0.6, side) * smoothstep(1.0, 0.85, abs(vUv.x));
    float rut = smoothstep(0.08, 0.0, abs(side - 0.38)) * 0.35;
    float grit = 0.75 + 0.25 * vnoise(vP.xy * 0.35);
    dark = body * (0.85 + rut) * grit;
  }
  oCol = vec4(mix(vec3(1.0), vC.rgb, clamp(dark * a, 0.0, 1.0)), 1.0);
#else
  vec3 col = vec3(0.0);
  if (type == 2.0) {
    // Anel de seleção: luz verde fina e um halo
    float e = abs(r - 0.86);
    float aa = fwidth(r) * 1.2;
    float ring = (1.0 - smoothstep(0.03, 0.03 + aa, e)) + smoothstep(0.14, 0.0, e) * 0.18;
    float dash = 0.75 + 0.25 * step(0.5, fract(atan(vUv.y, vUv.x) * 3.82 + uTime * 0.6));
    col = vC.rgb * ring * dash * 2.2;
  } else if (type == 4.0) {
    // Onda de choque
    // Onda de choque: anel de poeira quente, fino, que some enquanto se abre
    float ring = smoothstep(0.2, 0.0, abs(r - 0.8)) * (1.0 - smoothstep(0.85, 1.0, r));
    ring *= 0.35 + 0.65 * vnoise(vec2(atan(vUv.y, vUv.x) * 6.0 + vC.w, r * 3.0 + uTime));
    col = vC.rgb * ring * 1.1;
  } else if (type == 7.0) {
    // Cantos de seleção de prédio
    vec2 q = abs(vUv);
    float edge = step(0.9, max(q.x, q.y)) * step(max(q.x, q.y), 0.985);
    float corner = step(0.62, min(q.x, q.y) + 0.0) + step(0.62, q.x) * step(0.62, q.y);
    float near = step(0.55, q.x) * step(0.55, q.y);
    col = vC.rgb * edge * max(near, 0.25) * 2.4;
  } else if (type == 10.0) {
    // Espuma na água: manchas brancas rasgadas
    float n = fbm3(vUv * 3.0 + vC.w);
    col = vC.rgb * smoothstep(1.0, 0.3, r) * (0.35 + 0.65 * smoothstep(0.3, 0.8, n + vnoise(vUv * 11.0) * 0.25)) * 1.1;
  } else if (type == 11.0) {
    // Brasa na cratera: pontos quentes que esfriam, mais fortes na borda
    float n = fbm3(vUv * 4.0 + vC.w * 3.0);
    float ring = smoothstep(0.35, 0.8, r) * smoothstep(1.0, 0.8, r);
    col = vC.rgb * (ring * 0.8 + smoothstep(0.6, 0.0, r) * 0.25) * smoothstep(0.5, 0.75, n) * 4.0;
  } else if (type == 8.0) {
    // Campo de construção permitido
    vec2 q = abs(fract(vP.xy / 32.0) - 0.5);
    float line = smoothstep(0.47, 0.5, max(q.x, q.y));
    col = vC.rgb * (0.03 + line * 0.32);
  }
  oCol = vec4(col * a, 0.0);
#endif
}
`;

// ---------- Partículas ----------

const PART_VS = `
layout(location=0) in vec2 aPos;
layout(location=4) in vec4 iA; // x, y, z, tamanho
layout(location=5) in vec4 iB; // tipo, idade (0..1), alfa, giro
layout(location=6) in vec4 iC; // vx, vy, vz, semente
uniform mat4 uVP;
uniform vec2 uView;     // px da área de jogo
uniform float uZoom;
out vec2 vUv;
out vec4 vB;
out vec3 vW;
out float vSeed;
out float vSize;
void main() {
  vec4 c = uVP * vec4(iA.xyz, 1.0);
  vSize = iA.w;
  float size = iA.w;
  vec2 o = aPos;
  float type = floor(iB.x + 0.5);
  vec2 px = vec2(2.0 / uView.x, 2.0 / uView.y) * uZoom;
  if (type == 2.0 || type == 8.0 || type == 9.0) {
    // Faísca/traçante: esticada na direção do movimento (na tela)
    vec4 c2 = uVP * vec4(iA.xyz + iC.xyz * 0.035, 1.0);
    vec2 d = (c2.xy - c.xy) / px;
    float len = length(d);
    vec2 dir = len > 0.001 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float L = max(len, size) * (type == 8.0 ? 1.0 : 0.9);
    vec2 off = dir * (o.x * 0.5 + 0.5) * -L + dir * size * 0.5 + nrm * o.y * size;
    if (type == 8.0) off = dir * o.x * L * 0.5 + nrm * o.y * size;
    c.xy += off * px;
  } else {
    float r = iB.w;
    vec2 ro = vec2(cos(r) * o.x - sin(r) * o.y, sin(r) * o.x + cos(r) * o.y);
    c.xy += ro * size * px;
  }
  // Puxa a profundidade para a frente (o sprite não corta no chão)
  c.z -= size * 0.0003;
  gl_Position = c;
  vUv = aPos;
  vB = iB;
  vW = iA.xyz;
  vSeed = iC.w;
}
`;

const PART_FS = GLSL_NOISE + `
in vec2 vUv;
in vec4 vB;
in vec3 vW;
in float vSeed;
in float vSize;
out vec4 oCol;
uniform sampler2D uAtlas;
uniform sampler2D uDepth;
uniform float uSoft;
uniform float uDepthR;
uniform vec2 uRes;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uSkyCol;
uniform vec3 uGndCol;
uniform sampler2D uFow;
uniform vec2 uMapSize;
uniform float uFowOn;
vec3 fireRamp(float t) {
  vec3 c = mix(vec3(1.0, 0.62, 0.22), vec3(1.0, 0.36, 0.05), smoothstep(0.0, 0.25, t));
  c = mix(c, vec3(0.7, 0.1, 0.01), smoothstep(0.3, 0.7, t));
  return mix(c, vec3(0.15, 0.05, 0.02), smoothstep(0.7, 1.0, t));
}
void main() {
  float type = floor(vB.x + 0.5), t = vB.y, alpha = vB.z;
  float r = length(vUv);
  if (r > 1.0 && type != 2.0 && type != 8.0 && type != 9.0) discard;
  // Atlas: 4 variações de nuvem (rgb = normal, a = densidade)
  float cell = floor(vSeed * 3.99);
  vec2 auv = (vUv * 0.5 + 0.5) * 0.5 + vec2(mod(cell, 2.0), floor(cell / 2.0)) * 0.5;
  vec4 tex = texture(uAtlas, auv);
  float vis = 1.0;
  if (uFowOn > 0.5) vis = smoothstep(0.1, 0.8, texture(uFow, vW.xy / uMapSize).r);
  vec3 col; float a;
  if (type == 0.0 || type == 3.0 || type == 6.0 || type == 7.0) {
    // Fumaça e poeira iluminadas pelo sol (normal do próprio sprite)
    vec3 n = normalize(tex.rgb * 2.0 - 1.0);
    vec3 N = normalize(vec3(n.x, -n.y * 0.55, n.z * 0.8 + n.y * 0.45));
    float diff = max(dot(N, uSunDir) * 0.35 + 0.65, 0.0);
    vec3 base = type == 3.0 ? vec3(0.42, 0.33, 0.22) : type == 6.0 ? vec3(0.6, 0.62, 0.64) : type == 7.0 ? vec3(0.1, 0.092, 0.086) : vec3(0.24, 0.23, 0.22);
    // Forma: a densidade é corroída por ruído com o tempo (rasga em fiapos em vez de sumir por igual)
    float ero = fbm3(vUv * 3.5 + vec2(vSeed * 11.0, vSeed * 3.0 + t * 0.8)) * 0.65 + vnoise(vUv * 9.0 + vSeed * 7.0 - t) * 0.35;
    tex.a *= smoothstep(t * 0.55, t * 0.55 + 0.3, tex.a * 0.7 + ero * 0.5);
    // Luz atravessando a fumaça: as bordas finas ficam mais claras
    float thin = 1.0 - tex.a;
    col = base * (uSkyCol * 1.1 + uGndCol * 0.3 + uSunCol * (diff * 0.6 + thin * 0.35));
    // Fumaça recém-nascida ainda brilha com o fogo
    if (type == 7.0 || type == 0.0) col += vec3(1.0, 0.4, 0.1) * smoothstep(0.2, 0.0, t) * 0.5 * smoothstep(0.5, 0.9, tex.a);
    float fade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.45, 1.0, t));
    a = tex.a * alpha * fade * (type == 7.0 ? 0.85 : 0.7);
    col *= a;
  } else if (type == 1.0) {
    // Fogo: dois ruídos turbulentos que deslizam em sentidos opostos multiplicam a densidade
    // (labaredas com buracos e línguas, não bolas lisas). Calor = densidade: miolo amarelo-branco,
    // borda vermelho-escura; da metade da vida em diante a borda vira fuligem.
    vec2 fu = vUv + (vec2(vnoise(vUv * 2.0 + vSeed * 9.0 + t * 2.0), vnoise(vUv * 2.0 + 4.0 - t * 2.0)) - 0.5) * 0.55;
    float f1 = fbm3(fu * 2.6 + vec2(vSeed * 17.0, vSeed * 5.0 - t * 2.6));
    float f2 = fbm3(fu * 4.1 + vec2(-vSeed * 7.0 + t * 1.7, vSeed * 13.0 + t * 1.1));
    float body = tex.a * (1.0 - smoothstep(0.55, 1.0, r));
    float dens = clamp(body * (f1 * 1.5) * (f2 * 1.4 + 0.3) * 1.5 - t * 0.35, 0.0, 1.0);
    dens = pow(smoothstep(0.02, 0.85, dens), 0.8);
    // Veios mais quentes correndo por dentro da chama
    float vein = smoothstep(0.55, 0.8, fbm3(fu * 5.5 + vec2(vSeed * 3.0, -t * 3.5)));
    float heat = clamp(1.0 - dens * (0.75 + 0.35 * vein) + t * 0.55, 0.0, 1.0);
    col = fireRamp(heat) * 1.8 * dens * alpha * (1.0 - t * 0.6);
    // Miolo branco-quente no começo
    col += vec3(1.0, 0.7, 0.35) * smoothstep(0.2, 0.0, t) * smoothstep(0.55, 0.9, dens) * 1.2;
    // Fuligem em manchas largas por dentro da chama (não um contorno em volta de cada bolha)
    float sootN = smoothstep(0.35, 0.6, fbm3(vUv * 1.3 + vSeed * 23.0 + vec2(0.0, t * 0.6)));
    float soot = smoothstep(0.3, 0.8, t) * sootN * smoothstep(0.0, 0.3, body);
    a = dens * alpha * (0.4 + 0.45 * smoothstep(0.3, 1.0, t));
    col = mix(col, vec3(0.035, 0.028, 0.024) * alpha * max(dens, 0.5), soot * 0.85);
    a = max(a, soot * alpha * 0.5);
  } else if (type == 2.0 || type == 8.0 || type == 9.0) {
    float d = abs(vUv.y);
    float g = smoothstep(1.0, 0.0, d) * smoothstep(1.0, 0.6, abs(vUv.x));
    vec3 c = type == 8.0 ? vec3(1.0, 0.75, 0.4) : vec3(1.0, 0.7, 0.3);
    col = c * g * (type == 9.0 ? 5.0 : type == 8.0 ? 6.0 : 9.0) * alpha * (1.0 - t);
    // Traçante: núcleo branco fino dentro da borda laranja
    if (type == 8.0) col += vec3(1.0, 0.95, 0.85) * smoothstep(0.35, 0.0, d) * smoothstep(0.9, 0.3, abs(vUv.x)) * 6.0 * alpha;
    a = 0.0;
  } else if (type == 4.0) {
    float g = exp(-r * r * 7.0);
    col = mix(vec3(1.0, 0.85, 0.6), vec3(1.0, 0.5, 0.15), smoothstep(0.1, 0.6, r)) * g * 2.0 * alpha * (1.0 - t) * (1.0 - t);
    a = 0.0;
  } else {
    float g = exp(-r * r * 6.0) + smoothstep(0.06, 0.0, abs(vUv.x)) * smoothstep(1.0, 0.0, abs(vUv.y)) * 0.6 + smoothstep(0.06, 0.0, abs(vUv.y)) * smoothstep(1.0, 0.0, abs(vUv.x)) * 0.6;
    col = vec3(0.2, 1.0, 0.85) * g * 5.0 * alpha * (1.0 - t);
    a = 0.0;
  }
  // Partícula suave: some perto do que está atrás dela (sem cortes retos no chão e na água)
  if (uSoft > 0.5) {
    float sz = texture(uDepth, gl_FragCoord.xy / uRes).r;
    float soft = clamp((sz - gl_FragCoord.z) * uDepthR / max(3.0, vSize * 0.7), 0.0, 1.0);
    vis *= soft;
  }
  oCol = vec4(col * vis, a * vis);
}
`;

// ---------- Pós-processamento ----------

// Reduz pela metade com filtro de 13 amostras (sem cintilar). O primeiro passo separa o que brilha.
const BLOOM_DOWN_FS = `
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uPrefilter;
in vec2 vUv;
out vec4 o;
vec3 s(vec2 off) { return texture(uSrc, vUv + off * uTexel).rgb; }
void main() {
  vec3 a = s(vec2(-2, -2)), b = s(vec2(0, -2)), c = s(vec2(2, -2));
  vec3 d = s(vec2(-1, -1)), e = s(vec2(1, -1));
  vec3 f = s(vec2(-2, 0)), g = s(vec2(0, 0)), h = s(vec2(2, 0));
  vec3 i = s(vec2(-1, 1)), j = s(vec2(1, 1));
  vec3 k = s(vec2(-2, 2)), l = s(vec2(0, 2)), m = s(vec2(2, 2));
  vec3 col = (d + e + i + j) * 0.125 + (a + c + k + m) * 0.03125 + (b + f + h + l) * 0.0625 + g * 0.125;
  if (uPrefilter > 0.5) {
    float br = max(col.r, max(col.g, col.b));
    float knee = 0.7, thr = 1.25;
    float soft = clamp(br - thr + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-4);
    float w = max(soft, br - thr) / max(br, 1e-4);
    col = min(col * w, vec3(40.0));
  }
  o = vec4(col, 1.0);
}
`;

const BLOOM_UP_FS = `
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uRadius;
in vec2 vUv;
out vec4 o;
void main() {
  vec2 r = uTexel * uRadius;
  vec3 c = texture(uSrc, vUv + vec2(-r.x, -r.y)).rgb + texture(uSrc, vUv + vec2(r.x, -r.y)).rgb +
    texture(uSrc, vUv + vec2(-r.x, r.y)).rgb + texture(uSrc, vUv + vec2(r.x, r.y)).rgb;
  c += (texture(uSrc, vUv + vec2(0.0, -r.y)).rgb + texture(uSrc, vUv + vec2(0.0, r.y)).rgb +
    texture(uSrc, vUv + vec2(-r.x, 0.0)).rgb + texture(uSrc, vUv + vec2(r.x, 0.0)).rgb) * 2.0;
  c += texture(uSrc, vUv).rgb * 4.0;
  o = vec4(c / 16.0, 1.0);
}
`;

// Composição final: exposição, bloom, curva de filme (ACES), gradação de cor, vinheta, grão.
const COMPOSITE_FS = GLSL_NOISE + `
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uTexel;
uniform float uExposure;
uniform float uBloomK;
uniform float uTime;
uniform float uTilt;
uniform float uVignette;
uniform float uFlash;
in vec2 vUv;
out vec4 o;
vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
void main() {
  vec2 uv = vUv;
  vec2 cc = uv - 0.5;
  float r2 = dot(cc, cc);
  // Aberração cromática leve nas bordas
  vec2 ca = cc * r2 * 0.003;
  vec3 col;
  col.r = texture(uScene, uv - ca).r;
  col.g = texture(uScene, uv).g;
  col.b = texture(uScene, uv + ca).b;
  // Miniatura (tela de título): borra em cima e embaixo
  if (uTilt > 0.0) {
    float k = smoothstep(0.12, 0.42, abs(uv.y - 0.52)) * uTilt;
    if (k > 0.01) {
      vec3 acc = vec3(0.0);
      float w = 0.0;
      for (int i = 0; i < 12; i++) {
        float a = float(i) * 2.399;
        vec2 off = vec2(cos(a), sin(a)) * sqrt(float(i) + 0.5) / 3.5 * k * 7.0 * uTexel;
        acc += texture(uScene, uv + off).rgb; w += 1.0;
      }
      col = mix(col, acc / w, smoothstep(0.0, 0.4, k));
    }
  }
  // Nitidez leve (estilo CAS): realça detalhe fino sem halo, limitada pelo contraste local
  {
    vec3 n1 = texture(uScene, uv + vec2(uTexel.x, 0.0)).rgb, n2 = texture(uScene, uv - vec2(uTexel.x, 0.0)).rgb;
    vec3 n3 = texture(uScene, uv + vec2(0.0, uTexel.y)).rgb, n4 = texture(uScene, uv - vec2(0.0, uTexel.y)).rgb;
    vec3 mn = min(min(n1, n2), min(n3, n4)), mx = max(max(n1, n2), max(n3, n4));
    vec3 amt = clamp(min(mn, 2.0 - mx) / max(mx, 1e-3), 0.0, 1.0);
    col = max(col + (col - (n1 + n2 + n3 + n4) * 0.25) * sqrt(amt) * 0.45, 0.0);
  }
  vec3 bloom = texture(uBloom, uv).rgb;
  col += bloom * uBloomK;
  col *= uExposure;
  col += uFlash * vec3(1.0, 0.8, 0.6);
  // ACES por canal leva o fogo ao branco; metade pela luminância preserva a cor
  float Lin = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 hueTm = col * (aces(vec3(Lin)).r / max(Lin, 1e-4));
  col = mix(aces(col), min(hueTm, vec3(1.0)), 0.45);
  // Gradação: sombras um pouco frias, luzes quentes, mais vida na cor
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, col * vec3(0.94, 0.99, 1.06), (1.0 - l) * 0.3);
  col = mix(col, col * vec3(1.07, 1.01, 0.9), l * 0.3);
  col = mix(vec3(l), col, 0.98);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.5);
  // Pretos mais densos sem esmagar: baixa o pé da curva
  col = max(col - 0.07 * (1.0 - col) * (1.0 - col), 0.0) / 0.93;
  // Vinheta e grão
  col *= mix(1.0, smoothstep(0.85, 0.2, r2 * 1.6), uVignette);
  col += (hash12(gl_FragCoord.xy + fract(uTime) * 437.0) - 0.5) * 0.018;
  o = vec4(col, dot(col, vec3(0.299, 0.587, 0.114)));
}
`;

// FXAA (versão compacta), usado quando não há multiamostragem
const FXAA_FS = `
uniform sampler2D uSrc;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 o;
void main() {
  vec3 rgbM = texture(uSrc, vUv).rgb;
  float lM = texture(uSrc, vUv).a;
  float lNW = texture(uSrc, vUv + vec2(-1.0, -1.0) * uTexel).a;
  float lNE = texture(uSrc, vUv + vec2(1.0, -1.0) * uTexel).a;
  float lSW = texture(uSrc, vUv + vec2(-1.0, 1.0) * uTexel).a;
  float lSE = texture(uSrc, vUv + vec2(1.0, 1.0) * uTexel).a;
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
  float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir * rcp, -8.0, 8.0) * uTexel;
  vec3 a = 0.5 * (texture(uSrc, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(uSrc, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture(uSrc, vUv - dir * 0.5).rgb + texture(uSrc, vUv + dir * 0.5).rgb);
  float lB = dot(b, vec3(0.299, 0.587, 0.114));
  o = vec4((lB < lMin || lB > lMax) ? a : b, 1.0);
}
`;

const COPY_FS = `
uniform sampler2D uSrc;
in vec2 vUv;
out vec4 o;
void main() { o = vec4(texture(uSrc, vUv).rgb, 1.0); }
`;

// Névoa de guerra: desfoque (bordas macias) e transição suave no tempo
const FOW_BLUR_FS = `
uniform sampler2D uSrc;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 o;
void main() {
  vec4 acc = vec4(0.0);
  float w = 0.0;
  for (int y = -3; y <= 3; y++) for (int x = -3; x <= 3; x++) {
    float k = exp(-float(x * x + y * y) / 5.0);
    acc += texture(uSrc, vUv + vec2(float(x), float(y)) * uTexel * 0.5) * k;
    w += k;
  }
  o = acc / w;
}
`;

const FOW_LERP_FS = `
uniform sampler2D uPrev;
uniform sampler2D uTarget;
uniform float uK;
in vec2 vUv;
out vec4 o;
void main() {
  vec4 a = texture(uPrev, vUv), b = texture(uTarget, vUv);
  // Revela rápido, esconde devagar
  vec4 k = vec4(b.r > a.r ? uK * 2.0 : uK * 0.6, uK * 2.0, 0.0, 0.0);
  o = mix(a, b, clamp(k, 0.0, 1.0));
}
`;

const CLOUDS_FS = GLSL_NOISE + `
in vec2 vUv;
out vec4 o;
float tn(vec2 p, float per) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(mod(i, per)), hash12(mod(i + vec2(1, 0), per)), u.x), mix(hash12(mod(i + vec2(0, 1), per)), hash12(mod(i + vec2(1, 1), per)), u.x), u.y);
}
void main() {
  float s = 0.0, a = 0.5, per = 4.0;
  for (int i = 0; i < 6; i++) { s += a * tn(vUv * per, per); per *= 2.0; a *= 0.5; }
  o = vec4(s, s, s, 1.0);
}
`;
