# BetterNM 🏋️

Tracker treningów siłowych, biegowych i statystyk zdrowia — jako **instalowalna aplikacja webowa (PWA)** działająca na Androidzie i iOS.

**Aplikacja online:** https://dzeppettto.github.io/silownia/

## Funkcje

- **Kalendarz** — podsumowanie dnia, seria treningów, statystyki miesiąca, pasma (streak)
- **Rozpiska treningowa** — plany siłowe i biegowe, edycja ćwiczeń
- **Zapisz trening**
  - Siłownia: zestawy ćwiczeń (kg × powtórzenia), timer odpoczynku, propozycja ciężaru na podstawie ostatniego treningu, własna nazwa ćwiczenia
  - Bieganie: czas, dystans, tętno, strefa tętna, międzyczasy
  - **Własna nazwa treningu** i **spalone kalorie (kcal)** przy każdym treningu
- **Postęp** — wykresy objętości/ciężaru i dystansów, rekordy (PR), odznaki
- **Zawody i starty** — planowane starty z odliczaniem
- **Zdrowie** — waga, tkanka tłuszczowa, mięśnie, zdjęcia sylwetki
- **Wiele profili** — osobne dane dla każdego użytkownika
- **Ustawienia** — motyw ciemny/jasny, kolor akcentu, maskotka, kopia zapasowa (plik .json), raport PDF (30 dni), przypomnienia o treningu, sekcja „Uwagi i poprawki"
- **Blokada PIN** — każdy profil może mieć własny PIN (4 cyfry); po włączeniu wybranie profilu wymaga jego podania (Ustawienia → Profil → „Ustaw PIN")
- **Nowości** — sekcja w ustawieniach pokazująca, co zmieniło się w najnowszej wersji (przy nowej wersji na ikonie ustawień pojawia się kropka)
- **Aktualizuj aplikację** — przycisk w ustawieniach pobiera najnowszą wersję bez utraty danych

## Instalacja na telefonie

Aplikacja wymaga połączenia przez **HTTPS** (już działa pod linkiem powyżej).

| Platforma | Jak zainstalować |
|---|---|
| Android (Chrome) | menu ⋮ → **Zainstaluj aplikację** |
| iPhone/iPad (Safari) | **Udostępnij** → **Dodaj do ekranu głównego** |

Po instalacji aplikacja działa na pełnym ekranie, offline i startuje z ikony na ekranie głównym.

## Uruchamianie lokalne (rozwój)

Wystarczy dowolny serwer statyczny, np. PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1   # uruchamia serwer na http://localhost:8037
```

albo `start.bat` (otwiera przeglądarkę).

## Struktura projektu

```
index.html          — struktura aplikacji
style.css           — style (motyw ciemny/jasny)
app.js              — cała logika aplikacji
manifest.webmanifest — manifest PWA
sw.js               — service worker (cache offline)
icons/              — ikony aplikacji (192, 180, 512 px)
logo.png            — logo
zdjecia/            — zasoby
worker/             — osobny worker „silownia-feedback" (uwagi → Issue na GitHubie)
```

## Dane

Dane zapisywane są w **localStorage** przeglądarki (osobno dla każdego profilu) — czyli wyłącznie na Twoim urządzeniu. Każdy, kto otworzy aplikację (np. znajomy z linkiem), ma **własną, niezależną kopię** danych — nikt inny ich nie widzi.

Przy każdym zapisie tworzona jest też **automatyczna kopia bezpieczeństwa** — jeśli zapis ulegnie uszkodzeniu lub zniknie, aplikacja sama odzyska dane („Dane odzyskane z kopii bezpieczeństwa"). Aktualizacje aplikacji nigdy nie usuwają danych.

### Przenoszenie danych na inny komputer/telefon

Każde urządzenie to osobne miejsce z danymi, więc przenosisz je ręcznie przez plik kopii zapasowej:

**1. Na urządzeniu, z którego chcesz zabrać dane:**
- Ustawienia → **Kopia zapasowa danych** → **„Pobierz plik .json"**
- Wyślij plik na nowe urządzenie (mail, messenger, kabel USB)

**2. Na nowym urządzeniu (np. komputerze):**
- Otwórz aplikację i utwórz profil (np. tak samo nazwany jak stary)
- Ustawienia → **Przywróć z kopii** → **„Wybierz plik .json"** → wybierz przesłany plik

**Pamiętaj:** to ręczna synchronizacja. Jeśli coś dodasz na telefonie, nie pojawi się automatycznie na komputerze — trzeba ponownie wyeksportować i zaimportować.

## Aktualizacje

Zmiany wgranego na GitHub — po `git push` strona odświeża się automatycznie (GitHub Pages).
