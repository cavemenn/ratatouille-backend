let express = require('express');
let app = express();

const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');

const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM ratatouille_users ORDER BY id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong'})
    }
})

app.get('/categories', async (req,res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM ratatouille_categories ORDER BY id`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong'})
    }
})

app.get('/recipes', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ratatouille_recipes.id,
                    ratatouille_recipes.name,
                    ratatouille_recipes.ingredients,
                    ratatouille_recipes.instructions,
                    ratatouille_recipes.created_at,
                    ratatouille_users.username AS chef_name,
                    ratatouille_categories.category AS category_name
            FROM ratatouille_recipes
            JOIN ratatouille_users ON ratatouille_recipes.author = ratatouille_users.id
            JOIN ratatouille_categories ON ratatouille_recipes.category = ratatouille_categories.id
            ORDER BY ratatouille_recipes.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/recipes/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)){
            return res.status(400).json({ error: 'Recipe id must be a number' });
        }

        const result = await pool.query(
            `SELECT ratatouille_recipes.id,
                    ratatouille_recipes.name,
                    ratatouille_recipes.ingredients,
                    ratatouille_recipes.instructions,
                    ratatouille_recipes.created_at,
                    ratatouille_users.username AS chef_name,
                    ratatouille_categories.category AS category_name
            FROM ratatouille_recipes
            JOIN ratatouille_users ON ratatouille_recipes.author = ratatouille_users.id
            JOIN ratatouille_categories ON ratatouille_recipes.category = ratatouille_categories.id
            WHERE ratatouille_recipes.id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
})

app.post('/users', async (req, res) => {
    const { username, email } = req.body;
    try {
        if (!username || !username.trim() || !email || !email.trim()) {
            return res.status(400).json({ error: 'Please enter a username and email' });
        }

        const cleanName = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        const nameCheck = await pool.query(
            'SELECT id FROM ratatouille_users WHERE LOWER(username) = LOWER($1)',
            [cleanName]
        );

        if (nameCheck.rows.length > 0) {
            return res.status(409).json({ error: 'That username already exists' });
        }

        const emailCheck = await pool.query(
            'SELECT id FROM ratatouille_users WHERE email = $1',
            [cleanEmail]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ error: 'That email already exists' });
        }

        const result = await pool.query(
            `INSERT INTO ratatouille_users (username, email) VALUES ($1, $2) RETURNING id, username`,
            [cleanName, cleanEmail]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong'});
    }
});

app.post('/recipes', async (req, res) => {
    try {
        const { name, chef_name, email, ingredients, instructions, category } = req.body;

        if (!name || !chef_name || !email || !ingredients || !instructions || !category){
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const categoryId = Number(category);
        if (!Number.isInteger(categoryId)) {
            return res.status(400).json({ error: 'Category must be a number' });
        }

        const chefName = chef_name.trim();
        const chefEmail = email.trim().toLowerCase();

        if (!chefEmail.includes('@')){
            return res.status(400).json({ error: 'Please enter a valid email' });
        }

        const foundChefByEmail = await pool.query(
            'SELECT id FROM ratatouille_users WHERE email = $1',
            [chefEmail]
        )

        let authorId;

        if (foundChefByEmail.rows.length > 0){
            authorId = foundChefByEmail.rows[0].id;
        } else {
            const nameCheck = await pool.query(
                'SELECT id FROM ratatouille_users WHERE LOWER(username) = LOWER($1)',
                [chefName]
            );
            if (nameCheck.rows.length > 0){
                return res.status(409).json({ error: 'That chef name is already used by another email' });
            }

            const created = await pool.query(
                'INSERT INTO ratatouille_users (username, email) VALUES ($1, $2) RETURNING id',
                [chefName, chefEmail]
            );
            authorId = created.rows[0].id;
        }

        const result = await pool.query(
            `INSERT INTO ratatouille_recipes (name, ingredients, instructions, author, category)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [name, ingredients, instructions, authorId, categoryId]
        )
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong'});
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Ratatouille API backend listening on port ${PORT}`);
});