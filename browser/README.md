# 🎨 CC0 Asset Browser & Tagger

Веб-интерфейс для просмотра 3D моделей и отбора на NFT минтинг.

## 🚀 Запуск

```bash
cd browser
npm install
npm start
```

Откроется автоматически в браузере: **http://localhost:3456**

## ✨ Возможности

### 📦 Просмотр моделей
- **306+ моделей** из `~/Assets/CC0_Assets/`
- 3D превью с Three.js
- Вращение, зум, осмотр со всех сторон
- Информация о размере и источнике

### 🏷️ Тегирование
| Тег | Клавиша | Описание |
|-----|---------|----------|
| ✅ **Approved** | `A` | Пойдёт в продакшн |
| ❌ **Rejected** | `X` | Не подходит |
| ⏭️ **Pending** | `S` | Пропустить |

### 🔍 Фильтры
- **All** — все модели
- **Pending** — без тега
- **Approved** — отобранные
- **Rejected** — отклонённые

### 📦 Экспорт
Кнопка **"Export Approved"** создаёт:
```
~/Assets/CC0_Assets/approved-models.json
```

## ⌨️ Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `A` | Approve |
| `X` | Reject |
| `S` | Skip |
| `→` | Следующая |
| `←` | Предыдущая |

## 🖥️ Интерфейс

```
┌──────────────┬────────────────────────────┐
│  🎨 Browser  │                            │
│  A:0 R:0     │      [3D VIEWER]           │
│  P:306       │         🛸                 │
│              │        /  \                │
│ [All]        │       / 🔄 \               │
│ [Pending]    │        \   /               │
│ [Approved]   │         \ /                │
│ [Rejected]   │      ─────────             │
│              │                            │
│ 📦 alien     │  ┌─────────────────────┐   │
│ 📦 barrel    │  │ alien (2.3 MB)      │   │
│ 📦 craft     │  │                     │   │
│ ...          │  │ [❌] [⏭️] [✅]      │   │
│              │  └─────────────────────┘   │
└──────────────┴────────────────────────────┘
```

## 📁 Структура тегов

Теги сохраняются в:
```
~/Assets/CC0_Assets/model-tags.json
```

Формат:
```json
{
  "kenney/environment/alien.glb": "approved",
  "kenney/environment/barrel.glb": "rejected",
  ...
}
```

## 🔧 Настройка

### Изменить порт
В `model-browser.js`:
```javascript
const PORT = 3456; // Изменить на нужный
```

### Изменить путь к моделям
```javascript
const ASSETS_DIR = path.join(os.homedir(), 'Assets', 'CC0_Assets');
```

## 🛠️ Технологии

- **Backend:** Node.js + Express
- **3D Engine:** Three.js (r128)
- **Loader:** GLTFLoader
- **Controls:** OrbitControls

## 📝 Лицензия

CC0 (Public Domain) — см. основной LICENSE файл репозитория.
