# Автообновление райдера

Источник правды — закрытый редактор райдера.
Задача по расписанию делает:

1. Сохраняет страницу редактора (Artifact → read) и извлекает данные:
   `python3 -I tools/extract.py <сохранённый html> /tmp/new.json`
2. Сравнивает с `data/rider.json` и дописывает журнал `data/changelog.json`:
   `python3 -I tools/sync.py /tmp/new.json` (код 3 — изменений нет, дальше не идти)
3. Пересобирает PDF и страницу: `npm install --prefix tools && node tools/build.js`
4. Коммитит и пушит в `main` — GitHub Pages обновляет сайт за 1–2 минуты.

Форма предложений: скрытый адрес FormSubmit задаётся в `tools/config.json` (поле `form`).
