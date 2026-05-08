# Frontend (Supply Request Tracker)

React SPA на Vite + TypeScript. Контракт API зафиксирован в `docs/swagger.json`.

## Требования

- Node.js (рекомендуемо LTS)
- npm (или любой совместимый менеджер, но в репо сейчас используются npm-scripts)

## Установка и запуск

```bash
npm i
npm run dev
```

Dev-сервер Vite выведет URL в консоль.

## Переменные окружения

Vite читает переменные из `.env*` файлов в корне проекта.

- `VITE_API_BASE_URL` — базовый URL backend API (например `http://localhost:3000`).
- `VITE_UPLOADS_BASE_URL` — базовый URL для статического `/uploads`.
  - Если не задан, обычно можно использовать тот же origin, что и `VITE_API_BASE_URL` (зависит от конфигурации бэкенда/прокси).

Минимальный `.env.local`:

```bash
VITE_API_BASE_URL="http://localhost:3000"
VITE_UPLOADS_BASE_URL="http://localhost:3000"
```

## Команды

- `npm run dev` — локальная разработка (Vite).
- `npm run build` — сборка (TypeScript project build + Vite build).
- `npm run preview` — предпросмотр production-сборки.
- `npm run lint` — ESLint.
- `npm run lint:fix` — ESLint autofix.
- `npm run format` — Prettier.

## Архитектура и структура (FSD)

Проект организован в стиле Feature-Sliced Design (FSD), с минимально необходимыми слоями.

### Точки входа

- `src/main.tsx` — старт приложения.
- `src/app/App.tsx` — корневой компонент приложения/роутинг.

### Слои

- `src/app/`
  - Инициализация приложения (корневой `App`, провайдеры/роутинг).
- `src/pages/`
  - Страницы роутера:
    - `ApplicationsListPage.tsx`
    - `ApplicationDetailsPage.tsx`
    - `ApplicationCreatePage.tsx`
    - `ApplicationEditPage.tsx`
    - `MaterialsPage.tsx`
- `src/widgets/`
  - Крупные блоки UI, собирающие фичи и shared:
    - пример: `widgets/app-layout/ui/AppLayout.tsx`
- `src/features/`
  - Бизнес-сценарии (формы/диалоги/валидация), изолированно по фичам:
    - `features/application-editor/*`
    - `features/invoice-management/*`
    - `features/material-management/*`
- `src/entities/`
  - Доменные модели/типы/метаданные статусов:
    - `entities/application/*`
    - `entities/invoice/*`
    - `entities/material/*`
- `src/shared/`
  - Переиспользуемые утилиты, UI-примитивы, API-клиент:
    - `shared/api/*` — thin typed-клиент поверх `fetch`
    - `shared/lib/*` — форматтеры, toast-обёртки, утилиты
    - `shared/lib/queryCache/*` — zustand-кеш запросов (TTL/inflight/refetch)
    - `shared/ui/*` — UI-компоненты/обёртки для единообразных импортов

### UI-компоненты

В репо есть две группы:

- `src/components/ui/*` — исходные компоненты shadcn/ui (как правило, близко к upstream).
- `src/shared/ui/*` — публичный UI слой для приложения (ре-экспорты/адаптеры).

Рекомендуемая практика для импорта в коде приложения: тянуть UI из `src/shared/ui/*`, чтобы не размазывать зависимости от “сырого” `components/ui`.

## API и контракт (`docs/swagger.json`)

Контракт бекенда хранится в `docs/swagger.json`. На его основе реализованы ручные typed-модули:

- `src/shared/api/httpClient.ts` — общий fetch wrapper (JSON/FormData, единые ошибки).
- `src/shared/api/applicationsApi.ts`
- `src/shared/api/invoicesApi.ts`
- `src/shared/api/materialsApi.ts`
- `src/shared/api/contracts.ts` — типы/контракты (ручные, синхронизированы со swagger по смыслу).

Файлы:

- Word для заявки: `PATCH /applications/{id}/word-file`
- PDF для счета: `PATCH /invoices/{id}/pdf-file`

Ссылки на открытие/скачивание строятся через утилиту:

- `src/shared/lib/resolveFileHref.ts` (base URL + path без “двойных слешей”)

## Как обновлять shadcn/ui компоненты

В проекте используется CLI `shadcn`.

### Добавить новый компонент

```bash
npx shadcn@latest add <component>
```

После добавления:

- проверь, куда положился файл (обычно `src/components/ui/<component>.tsx`);
- при необходимости добавь/обнови ре-экспорт в `src/shared/ui/` (чтобы остальной код импортировал из shared-слоя).

### Обновить/сравнить изменения

Зависит от версии CLI, но обычно полезно:

```bash
npx shadcn@latest diff
```

Если компонент сильно кастомизирован, лучше обновлять вручную (чтобы не сломать существующий UI/контракты пропсов).

