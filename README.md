# Ratatouille API

A recipe API built with Express and a Supabase (Postgres) database. Recipes belong to a chef (user) and a category such as Vegetarian, Vegan or Pescatarian.

**Live API:** {to insert LIVE API of backend later}
**Frontend:** {to insert LIVE API of Frontend later}

## Features

- Get all recipes, or one recipe by id
- Add a new recipe
- Recipes include the chef name and the category name (tables are joined with foreign keys)
- If a chef's email already exists, a new recipe is added to that chef. If not, a new chef is created
- Get all chefs and add a new chef
- Get all categories
- Input checks and clear error messages (400, 404, 409, 500)
- A home page (`/`) that lists every endpoint

## Tech stack

- Node.js and Express
- PostgreSQL on Supabase (`pg` package)
- `cors` and `dotenv`
- Hosted on Railway

## Database

Three tables:

| Table | Columns |
|---|---|
| `ratatouille_categories` | `id`, `category` |
| `ratatouille_users` | `id`, `username`, `email` |
| `ratatouille_recipes` | `id`, `name`, `ingredients`, `instructions`, `created_at`, `author`, `category` |

`author` is a foreign key to `ratatouille_users(id)` and `category` is a foreign key to `ratatouille_categories(id)`.

## Run it locally

1. Clone the repo and install:

   ```
   npm install
   ```

2. Create a `.env` file in the project folder:

   ```
   DATABASE_URL=your-supabase-connection-string
   ```

3. Start the server:

   ```
   npm start
   ```

4. Open `http://localhost:3000`

## Endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/recipes` | Get all recipes |
| GET | `/recipes/:id` | Get one recipe |
| POST | `/recipes` | Add a recipe |
| GET | `/users` | Get all chefs |
| POST | `/users` | Add a chef |
| GET | `/categories` | Get all categories |

### GET /recipes

Response (`200`):

```json
[
  {
    "id": 1,
    "name": "Veggie Stir Fry",
    "ingredients": "broccoli, carrot, soy sauce",
    "instructions": "Fry the vegetables, then add the sauce.",
    "created_at": "2026-11-27T10:30:00.000Z",
    "chef_name": "Jeremy",
    "category_name": "Vegetarian"
  }
]
```

### GET /recipes/:id

Example: `/recipes/1`. Returns one recipe in the same format as above.

Errors: `400` if the id is not a number, `404` if the recipe does not exist.

### POST /recipes

Request body:

```json
{
  "name": "Mushroom Soup",
  "chef_name": "Vegeta",
  "email": "vegeta@example.com",
  "ingredients": "mushroom, cream, salt",
  "instructions": "Boil everything for 20 minutes.",
  "category": 1
}
```

`category` is the category's id number (see `GET /categories`).

Response (`201`): the new recipe.

Errors: `400` for a missing field, a category that is not a number, or an email without `@`. `409` if the chef name is already used by a different email.

### GET /users

Response (`200`):

```json
[
  { "id": 1, "username": "Jeremy", "email": "jeremy@example.com" }
]
```

### POST /users

Request body:

```json
{
  "username": "Alex",
  "email": "alex@example.com"
}
```

Response (`201`):

```json
{ "id": 4, "username": "Alex" }
```

Errors: `400` for a missing field, `409` if the username or email is already taken.

### GET /categories

Response (`200`):

```json
[
  { "id": 1, "category": "Vegetarian" },
  { "id": 2, "category": "Vegan" },
  { "id": 3, "category": "Pescatarian" }
]
```

## Error format

Every error returns JSON like this:

```json
{ "error": "Please fill in all fields" }
```

Unknown routes return `404` with `{ "error": "Route not found" }`.

## Known limits

- There is no login, so chef names and emails are not verified. Anyone can add a recipe under any email.
- `GET /users` shows emails to anyone, so only use test emails.