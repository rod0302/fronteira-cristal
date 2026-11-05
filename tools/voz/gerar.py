# Gera as falas do jogo com um sintetizador de voz neural (Kokoro, licença Apache 2.0),
# trata o áudio (recorte, equalização, compressão, volume) e grava src/voicepack.js
# com cada fala em MP3 dentro do código (base64). Assim o jogo fala igual em qualquer
# navegador, mesmo sem voz instalada e sem internet (funciona em file://).
#
# Uso: [ASR_WHISPER=<pasta do whisper small do sherpa-onnx>] python3 tools/voz/gerar.py <pasta-do-modelo> [--so-wav]
#   A pasta do modelo precisa de kokoro-v1.0.fp16.onnx e voices-v1.0.bin
#   (github.com/thewh1teagle/kokoro-onnx, release model-files-v1.0).
import json, sys, os, subprocess, base64, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
modelo = sys.argv[1]
so_wav = '--so-wav' in sys.argv
saida = os.path.join(AQUI, 'wav')
os.makedirs(saida, exist_ok=True)
k = Kokoro(os.path.join(modelo, 'kokoro-v1.0.fp16.onnx'), os.path.join(modelo, 'voices-v1.0.bin'))
falas = json.load(open(os.path.join(AQUI, 'falas.json'), encoding='utf-8'))

def biquad_hp(x, sr, fc):
    # Passa-altas de 2ª ordem (tira ronco grave)
    w = 2 * np.pi * fc / sr; a = np.sin(w) / (2 * 0.707); c = np.cos(w)
    b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
    a0, a1, a2 = 1 + a, -2 * c, 1 - a
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i, s in enumerate(x):
        v = (b0 * s + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, s, y1, v; y[i] = v
    return y

def tratar(s, sr):
    s = np.asarray(s, dtype=np.float64)
    # Recorta o silêncio das pontas (limiar relativo ao pico)
    env = np.abs(s); thr = env.max() * 0.006
    idx = np.where(env > thr)[0]
    a, b = max(0, idx[0] - int(0.04 * sr)), min(len(s), idx[-1] + int(0.06 * sr))
    s = s[a:b]
    s = biquad_hp(s, sr, 110)
    # Compressão suave por envelope (iguala sílabas fortes e fracas)
    e = np.abs(s); att, rel = np.exp(-1 / (0.003 * sr)), np.exp(-1 / (0.08 * sr))
    g = np.zeros_like(s); lv = 0.0
    for i, v in enumerate(e):
        lv = att * lv + (1 - att) * v if v > lv else rel * lv + (1 - rel) * v
        g[i] = lv
    ref = np.percentile(g[g > 1e-4], 90)
    over = np.maximum(g / ref, 1e-6)
    gain = np.where(over > 0.35, (over / 0.35) ** (1 / 2.5 - 1), 1.0)  # razão 2,5:1 acima de -9 dB do topo
    s = s * gain
    # Volume: pico em -1 dBFS; fade curto nas pontas
    s = s / np.abs(s).max() * 0.89
    f = int(0.008 * sr); s[:f] *= np.linspace(0, 1, f); s[-f*3:] *= np.linspace(1, 0, f*3)
    return s.astype(np.float32)

# Juiz opcional: um reconhecedor de fala (Whisper small via sherpa-onnx) escuta cada "tomada".
# O sintetizador varia um pouco a cada geração; geramos até 5 tomadas e fica a que o
# reconhecedor entende melhor (como escolher o melhor take numa gravação de estúdio).
import difflib, re, unicodedata
juiz = None
ASR = os.environ.get('ASR_WHISPER')  # pasta do modelo sherpa-onnx-whisper-small (opcional)
if ASR:
    import sherpa_onnx
    juiz = {l: sherpa_onnx.OfflineRecognizer.from_whisper(encoder=ASR + '/small-encoder.int8.onnx', decoder=ASR + '/small-decoder.int8.onnx',
            tokens=ASR + '/small-tokens.txt', language=l, task='transcribe', num_threads=4) for l in ('pt', 'en')}
def normal(t):
    t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return ' '.join(re.sub(r'[^a-z0-9 ]', ' ', t).split())
def nota(s, sr, lang, texto):
    if not juiz: return 1.0, ''
    r = juiz['en' if lang.startswith('en') else 'pt']
    st = r.create_stream(); st.accept_waveform(sr, s); r.decode_stream(st)
    ouvido = st.result.text.strip()
    return difflib.SequenceMatcher(None, normal(texto), normal(ouvido)).ratio(), ouvido
relatorio = []
BITRATE = '96k'
RUIDO_WAV = os.environ.get('RUIDO_WAV')  # gravação de uma batalha do jogo (opcional): o juiz ouve a fala sobre ela
_ruido = None
def ruido_batalha(n, sr, ref):
    global _ruido
    if RUIDO_WAV:
        if _ruido is None:
            x, r0 = sf.read(RUIDO_WAV, always_2d=True); x = x.mean(axis=1)
            idx = np.arange(0, len(x) - 1, r0 / sr).astype(int); _ruido = x[idx].astype(np.float32)
        ini = np.random.default_rng(n).integers(0, max(1, len(_ruido) - n))
        b = _ruido[ini:ini + n]
        if len(b) < n: b = np.pad(b, (0, n - len(b)))
        b = b / (np.sqrt(np.mean(b ** 2)) + 1e-9)
        return (b * np.sqrt(np.mean(ref ** 2)) * 10 ** (-10 / 20)).astype(np.float32)
    return _ruido_rosa(n, sr, ref)
def _ruido_rosa(n, sr, ref):
    # Ruído rosa grave (como uma batalha ao fundo) 6 dB abaixo da fala
    w = np.random.default_rng(n).standard_normal(n)
    b = np.cumsum(w); b -= np.convolve(b, np.ones(400) / 400, mode='same')  # tira a deriva (fica marrom-rosado)
    b = b / (np.sqrt(np.mean(b ** 2)) + 1e-9)
    return (b * np.sqrt(np.mean(ref ** 2)) * 10 ** (-6 / 20)).astype(np.float32)
def mp3_ida_volta(s, sr):
    tmp = os.path.join(saida, '_tmp.wav'); tmp3 = tmp + '.mp3'
    sf.write(tmp, s, sr)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', BITRATE, tmp3], check=True)
    out = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', tmp3, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'], check=True, capture_output=True).stdout
    return np.frombuffer(out, dtype=np.float32)

pacote = {}
# --so=chave1,chave2: refaz só essas falas e mantém as outras do voicepack.js atual
so = next((a.split('=', 1)[1].split(',') for a in sys.argv if a.startswith('--so=')), None)
if so:
    atual = open(os.path.join(RAIZ, 'src', 'voicepack.js'), encoding='utf-8').read()
    pacote = json.loads(atual[atual.index('{'):atual.rindex('}') + 1])
    rel_antigo = {}
    try:
        for linha in open(os.path.join(AQUI, 'relatorio-reconhecimento.txt'), encoding='utf-8').read().splitlines()[1:]:
            rel_antigo[linha.split()[0]] = linha
    except FileNotFoundError: pass
for grupo, itens in falas.items():
    if grupo.startswith('_'): continue
    for chave, item in itens.items():
        if so and chave not in so:
            if chave in rel_antigo: relatorio.append(rel_antigo[chave])
            continue
        voz, lang, texto, vel = item[:4]
        fon = item[4] if len(item) > 4 else None  # fonemas escritos à mão (corrigem a pronúncia)
        melhor = None
        for tomada in range(6 if juiz else 1):
            # O Kokoro é determinístico: a mesma entrada dá o mesmo áudio. Cada tomada muda um pouco a velocidade
            v = vel * (1.0, 0.95, 1.05, 0.92, 1.08, 0.98)[tomada]
            if fon: s, sr = k.create(fon, voice=voz, speed=v, lang=lang, is_phonemes=True)
            else: s, sr = k.create(texto, voice=voz, speed=v, lang=lang)
            s = tratar(s, sr)
            # O juiz ouve o que vai para o jogo: depois do MP3, não o WAV
            if juiz:
                m = mp3_ida_volta(s, sr)
                n1, ouvido = nota(m, sr, lang, texto)
                n2, _ = nota(m + ruido_batalha(len(m), sr, m), sr, lang, texto)
                n = (n1 + n2) / 2
            else: n, ouvido = 1.0, ''
            if not melhor or n > melhor[0]: melhor = (n, s, ouvido)
            if n >= 0.999: break  # tomada perfeita: para
        n, s, ouvido = melhor
        relatorio.append(f'{chave:22s} {n:4.2f}  "{texto}" -> "{ouvido}"')
        wav = os.path.join(saida, chave + '.wav')
        sf.write(wav, s, sr)
        if so_wav: continue
        mp3 = os.path.join(saida, chave + '.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '24000',
                        '-c:a', 'libmp3lame', '-b:a', BITRATE, mp3], check=True)
        pacote[chave] = {'t': texto, 'd': round(len(s) / sr, 3), 'a': base64.b64encode(open(mp3, 'rb').read()).decode()}
        print(f'{chave:22s} {len(s)/sr:5.2f}s  {texto}')

if not so_wav:
    js = ('// Falas do locutor e das tropas, geradas por tools/voz/gerar.py com o sintetizador de voz\n'
          '// neural Kokoro (Apache 2.0). Cada fala é um MP3 em base64: funciona em file:// e sem internet.\n'
          '// Não editar à mão: rode o gerador.\n'
          'const VOICE_PACK = ' + json.dumps(pacote, ensure_ascii=False, separators=(',', ':')) + ';\n')
    open(os.path.join(RAIZ, 'src', 'voicepack.js'), 'w', encoding='utf-8').write(js)
    print('voicepack.js', len(js) // 1024, 'KB')
if juiz:
    open(os.path.join(AQUI, 'relatorio-reconhecimento.txt'), 'w', encoding='utf-8').write(
        'Cada fala ouvida pelo reconhecedor Whisper small (1,00 = entendeu exatamente o texto)\n' + '\n'.join(relatorio) + '\n')
    print('\n'.join(relatorio))
