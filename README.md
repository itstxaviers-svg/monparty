# Monsters’ Party

Браузерный учебный квиз на React, TypeScript и Vite: 43 слайда, игры с голосами монстров, словами о еде, Memory и Dobble. Изображения, звук и видео находятся в проекте; плеер Genially не используется.

**Актуальный технический отчёт и шаблон для следующих квизов:** [docs/quiz-implementation-report.md](docs/quiz-implementation-report.md).

## Локальный запуск

```bash
npm ci
npm run dev
```

Проверка сборки:

```bash
npm run build
npm run preview
```

Игра публикуется через GitHub Pages: <https://itstxaviers-svg.github.io/monparty/>. Vite настроен для базового пути `/monparty/`; отправка изменений в `main` запускает сборку и публикацию.

Файлы `docs/original-flow.md` и `docs/asset-report.md` описывают исходный экспорт и происхождение материалов. `docs/game-flow.md` и некоторые старые тесты относятся к более ранней версии приложения; для действующей логики используйте новый отчёт и `src/App.tsx`.
