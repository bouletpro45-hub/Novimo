"""Rend une animation HTML du moteur Novimo en MP4 (image par image + bande-son).
Usage : python rendu_mp4.py <page.html> <sortie.mp4> [fps] [largeur] [hauteur]
"""
import asyncio, base64, json, os, subprocess, sys, time, urllib.request
import websockets

PAGE = sys.argv[1]
SORTIE = sys.argv[2]
FPS = int(sys.argv[3]) if len(sys.argv) > 3 else 30
L = int(sys.argv[4]) if len(sys.argv) > 4 else 1920
H = int(sys.argv[5]) if len(sys.argv) > 5 else 1080
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
FFMPEG = r'C:\Users\swann\AppData\Local\Medal\recorder-2642.2986.1\ffmpeg7.exe'
DOSSIER = os.path.dirname(os.path.abspath(__file__))
PORT = 9333

async def main():
    profil = os.path.join(DOSSIER, 'profil-chrome')
    chrome = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
                               '--force-device-scale-factor=1', f'--window-size={L},{H}', f'--remote-debugging-port={PORT}',
                               f'--user-data-dir={profil}', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                cibles = json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json'))
                page = next(c for c in cibles if c['type'] == 'page')
                break
            except Exception:
                time.sleep(0.2)
        async with websockets.connect(page['webSocketDebuggerUrl'], max_size=200_000_000) as ws:
            num = 0
            async def cdp(methode, **params):
                nonlocal num
                num += 1
                ident = num
                await ws.send(json.dumps({'id': ident, 'method': methode, 'params': params}))
                while True:
                    r = json.loads(await ws.recv())
                    if r.get('id') == ident:
                        if 'error' in r: raise RuntimeError(r['error'])
                        return r['result']
            async def js(code):
                r = await cdp('Runtime.evaluate', expression=code, awaitPromise=True, returnByValue=True)
                if 'exceptionDetails' in r: raise RuntimeError(r['exceptionDetails'])
                return r['result'].get('value')

            await cdp('Emulation.setDeviceMetricsOverride', width=L, height=H, deviceScaleFactor=1, mobile=False)
            await cdp('Page.enable')
            await cdp('Page.navigate', url=PAGE)
            await asyncio.sleep(1)
            # attendre que l'animation soit construite (polices chargées), puis tout mettre en pause
            await js("new Promise(r => { const t = setInterval(() => { if (document.getAnimations().length > 5) { clearInterval(t); r(1); } }, 100); })")
            await asyncio.sleep(0.5)
            infos = await js("""(() => {
              document.body.classList.add('propre');            // cache la barre de boutons
              window.dispatchEvent(new Event('resize'));
              document.getAnimations().forEach(a => a.pause());
              const fin = Math.max(...document.getAnimations().map(a => { const t = a.effect.getTiming(); return t.iterations === Infinity ? 0 : t.delay + t.duration * t.iterations; }));
              return { fin: fin / 1000, tenue: (document.querySelector('#barre .info') || {}).textContent || '' };
            })()""")
            duree = infos['fin']
            m = __import__('re').search(r'([\d,]+)', infos['tenue'])
            if m: duree = max(duree, float(m.group(1).replace(',', '.')))
            print('durée', duree, 's', flush=True)

            # ---- la bande-son, rendue par la page elle-même ----
            wav = os.path.join(DOSSIER, 'bande-son.wav')
            b64 = await js("""new Promise(async (ok) => {
              const fabrique = URL.createObjectURL;
              URL.createObjectURL = (b) => { const r = new FileReader(); r.onload = () => ok(r.result.split(',')[1]); r.readAsDataURL(b); return fabrique(b); };
              HTMLAnchorElement.prototype.click = function () {};
              const b = [...document.querySelectorAll('#barre button')].find(x => /wav/.test(x.textContent));
              if (b) b.click(); else ok('');
            })""")
            avec_son = bool(b64)
            if avec_son:
                open(wav, 'wb').write(base64.b64decode(b64))
                print('bande-son ok', flush=True)

            # ---- les images, envoyées directement à ffmpeg ----
            cmd = [FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-i', '-']
            if avec_son: cmd += ['-i', wav]
            cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', str(FPS)]
            if avec_son: cmd += ['-c:a', 'aac', '-b:a', '192k', '-shortest']
            cmd += ['-movflags', '+faststart', SORTIE]
            ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
            n = int(round(duree * FPS))
            debut = time.time()
            for i in range(n):
                t = i * 1000 / FPS
                await js(f"new Promise(r => {{ document.getAnimations().forEach(a => {{ a.currentTime = {t}; }}); requestAnimationFrame(() => requestAnimationFrame(() => r(1))); }})")
                img = await cdp('Page.captureScreenshot', format='jpeg', quality=95, clip={'x': 0, 'y': 0, 'width': L, 'height': H, 'scale': 1})
                ff.stdin.write(base64.b64decode(img['data']))
                if i % (FPS * 2) == 0:
                    print(f'image {i}/{n} ({time.time() - debut:.0f} s)', flush=True)
            ff.stdin.close()
            ff.wait()
            print('MP4 terminé :', SORTIE, flush=True)
    finally:
        chrome.terminate()

asyncio.run(main())
