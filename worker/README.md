# silownia-feedback (Cloudflare Worker)

Mały worker, który przyjmuje uwagi z aplikacji i tworzy z nich **Issue na GitHubie** (`dzeppettto/silownia`).

## Dlaczego tak?

GitHub **blokuje push** tokenów do kodu publicznej aplikacji (Secret Scanning / Push Protection). Dlatego token trzymamy jako **sekret workerka** po stronie Cloudflare — aplikacja nigdy nie widzi tokena, a Ty odbierasz uwagi jako Issue.

## Jak wgrać (bez Node.js — przez dashboard)

1. Wejdź na **dash.cloudflare.com** i zaloguj się (lub załóż **darmowe** konto).
2. Po lewej: **Workers & Pages** → **Create application** → **Create Worker**.
3. Nazwa workerka: `silownia-feedback`.
4. Usuń przykładowy kod i **wklej całą zawartość** `worker/src/worker.js`.
5. Kliknij **Deploy**.
6. Wejdź w **Settings** → **Variables and Secrets**:
   - **Add secret**: nazwa `GITHUB_TOKEN`, wartość = Twój token `github_pat_...`
   - Kliknij **Deploy** (zapisz zmianę).
7. Wróć na kartę Worker → pod **Workers Routes / Preview** skopiuj adres URL, np.
   `https://silownia-feedback.TWOJ-SUBDOMENA.workers.dev`
8. Podaj mi ten adres — wpinam go do aplikacji (`FEEDBACK_URL` w `app.js`).

## Test

Po wgraniu i ustawieniu sekretu możesz sprawdzić ręcznie (np. w przeglądarce albo PowerShell):

```powershell
$body = @{ title = 'TEST'; body = 'test uwagi' } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri 'https://silownia-feedback.TWOJ-SUBDOMENA.workers.dev/api/feedback' -ContentType 'application/json' -Body $body
```

Powinno odpowiedzieć `{ok: true, number: N}` i utworzyć Issue #N w repo.

## Lokalnie (wymaga Node.js)

```bash
npm i -g wrangler
wrangler secret put GITHUB_TOKEN   # wklej token
wrangler deploy
```
