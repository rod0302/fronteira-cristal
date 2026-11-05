// Modo Premium: trechos de GLSL compartilhados (ruído, luz, sombra, névoa de guerra, projeção).

// Inclinação da câmera: cada px de altura sobe K px na tela. O chão não muda de lugar.
const PREMIUM_K = 0.7;

const GLSL_NOISE = `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1, 0)), c = hash12(i + vec2(0, 1)), d = hash12(i + vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; }
  return s / 0.96875;
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.07 + vec2(5.3, 1.9); a *= 0.5; }
  return s / 0.875;
}
// Voronoi: x = distância à célula mais próxima, y = distância à borda, z = id da célula
vec3 voronoi(vec2 p) {
  vec2 n = floor(p), f = fract(p);
  vec2 mg, mr; float md = 8.0; float id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash22(n + g);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; id = hash12(n + g); }
  }
  float me = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 o = hash22(n + g);
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 0.00001) me = min(me, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec3(sqrt(md), me, id);
}
`;

// Projeção oblíqua: uVP leva (x, y, z) do mundo para o recorte.
// Luz: sol (com sombra suave e sombra de nuvens), céu e chão (hemisfério), luzes pontuais.
const GLSL_LIGHT = `
#ifndef MAXL
#define MAXL 24
#endif
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uSkyCol;
uniform vec3 uGndCol;
uniform vec3 uViewDir;
uniform mat4 uLightVP;
uniform highp sampler2DShadow uShadow;
uniform float uShadowTexel;
uniform sampler2D uFow;
uniform sampler2D uClouds;
uniform vec2 uMapSize;
uniform float uTime;
uniform float uFowOn;
uniform float uShadowPush;
uniform int uNumLights;
uniform vec4 uLightPos[MAXL];
uniform vec4 uLightCol[MAXL];

const float PI = 3.14159265;

const vec2 POISSON[12] = vec2[](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
  vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
  vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598));

float shadowAt(vec3 P, vec3 N) {
  // uShadowPush: empurrão extra para objetos pequenos (pedras, árvores) não se sombrearem inteiros
  vec3 p = P + N * (1.2 + uShadowPush) + uSunDir * (0.8 + uShadowPush);
  vec4 l = uLightVP * vec4(p, 1.0);
  vec3 c = l.xyz * 0.5 + 0.5;
  if (c.x < 0.0 || c.y < 0.0 || c.x > 1.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
  float a = hash12(gl_FragCoord.xy) * 6.2831;
  mat2 rot = mat2(cos(a), sin(a), -sin(a), cos(a));
  float s = 0.0;
  float rad = 1.6 * uShadowTexel;
  for (int i = 0; i < 12; i++) {
    s += texture(uShadow, vec3(c.xy + rot * POISSON[i] * rad, c.z - 0.0008));
  }
  return s / 12.0;
}

float cloudShadow(vec3 P) {
  float c = texture(uClouds, P.xy / 2400.0 + uTime * vec2(0.0035, 0.0018)).r;
  return mix(1.0, 0.62, smoothstep(0.48, 0.72, c));
}

vec3 envColor(vec3 R) {
  float t = smoothstep(-0.3, 0.8, R.z);
  vec3 horizon = vec3(0.95, 0.72, 0.52);
  return mix(uGndCol * 1.2, mix(horizon, uSkyCol * 1.6, t), smoothstep(-0.2, 0.15, R.z));
}

// Iluminação física simplificada (GGX). Devolve cor linear (HDR).
vec3 shade(vec3 P, vec3 N, vec3 alb, float rough, float metal, float ao, float sh) {
  vec3 V = uViewDir;
  vec3 L = uSunDir;
  rough = clamp(rough, 0.04, 1.0);
  float NdL = max(dot(N, L), 0.0);
  float NdV = max(dot(N, V), 0.02);
  vec3 H = normalize(L + V);
  float NdH = max(dot(N, H), 0.0);
  float a = rough * rough, a2 = a * a;
  float dd = NdH * NdH * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * dd * dd);
  float k = (rough + 1.0) * (rough + 1.0) / 8.0;
  float G = (NdV / (NdV * (1.0 - k) + k)) * (NdL / (NdL * (1.0 - k) + k));
  vec3 F0 = mix(vec3(0.04), alb, metal);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);
  vec3 spec = D * G * F / max(4.0 * NdV * NdL, 0.001);
  vec3 kd = (1.0 - F) * (1.0 - metal);
  vec3 col = (kd * alb / PI + spec) * uSunCol * NdL * sh * PI;
  // Céu e reflexo do chão
  float hemi = N.z * 0.5 + 0.5;
  col += mix(uGndCol, uSkyCol, hemi) * alb * (1.0 - metal) * ao;
  // Luz rebatida do chão ensolarado (quente): as sombras ficam coloridas, não pretas
  col += uSunCol * 0.055 * alb * (1.0 - metal * 0.7) * ao * (0.6 + 0.4 * hemi);
  vec3 R = reflect(-V, N);
  vec3 Fa = F0 + (max(vec3(1.0 - rough), F0) - F0) * pow(1.0 - NdV, 5.0);
  col += envColor(R) * Fa * ao * mix(1.0, 0.25, rough) * 0.55;
  // Luzes pontuais (explosões, disparos, luzes dos prédios, fogo)
  for (int i = 0; i < MAXL; i++) {
    if (i >= uNumLights) break;
    vec3 d = uLightPos[i].xyz - P;
    float r = uLightPos[i].w;
    float dist = length(d);
    if (dist > r) continue;
    vec3 l = d / max(dist, 0.001);
    float f = 1.0 - dist / r;
    float att = f * f;
    float nl = max(dot(N, l), 0.0) * 0.85 + 0.15;
    vec3 hh = normalize(l + V);
    float sp = pow(max(dot(N, hh), 0.0), mix(64.0, 4.0, rough)) * (1.0 - rough) * 2.0;
    col += uLightCol[i].rgb * att * (alb * kd * nl + sp * F0 * 4.0 + metal * alb * sp);
  }
  return col;
}

// Névoa de guerra: o que nunca foi visto fica escuro com bruma; o que já foi visto continua revelado,
// só com um véu leve (um pouco mais frio e escuro) marcando que não está sendo visto agora.
vec3 applyFow(vec3 col, vec3 P) {
  if (uFowOn < 0.5) return col;
  // Borda em fiapos: a consulta é torcida por ruído que se move devagar
  vec2 w = vec2(fbm3(P.xy * 0.012 + uTime * 0.03), fbm3(P.xy * 0.012 + 5.2 - uTime * 0.025)) - 0.5;
  vec2 f = texture(uFow, (P.xy + w * 46.0) / uMapSize).rg;
  float vis = smoothstep(0.1, 0.9, f.r);
  float expl = smoothstep(0.08, 0.8, f.g);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  // Visto antes: o terreno segue à mostra, só levemente frio e escurecido
  vec3 mem = mix(vec3(lum), col, 0.8) * vec3(0.9, 0.93, 0.98) * 0.86;
  vec3 c = mix(mem, col, vis);
  // Nunca visto: camada de nuvens baixas, com topo iluminado pelo sol e vales escuros
  vec2 q = P.xy * 0.0042 + vec2(uTime * 0.01, -uTime * 0.006);
  float n = fbm(q + vec2(fbm3(q * 1.7), fbm3(q * 1.7 + 3.0)) * 0.6);
  float nl = fbm(q + vec2(0.02, -0.02));
  float lit = clamp((n - nl) * 9.0 + 0.5, 0.0, 1.0);
  vec3 cloud = mix(vec3(0.016, 0.022, 0.042), vec3(0.1, 0.115, 0.15), smoothstep(0.3, 0.8, n));
  cloud += vec3(0.12, 0.1, 0.08) * lit * smoothstep(0.45, 0.8, n);
  return mix(cloud, c, expl);
}
`;
