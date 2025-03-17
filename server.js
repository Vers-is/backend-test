require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

const SECRET = process.env.JWT_SECRET || "secret_key";

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Введите имя пользователя и пароль" });
        }

        const normalizedUsername = username.trim().toLowerCase();
        console.log("Попытка регистрации:", normalizedUsername);

        const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [normalizedUsername]);
        console.log("Проверка существующего пользователя:", existingUser.rowCount);

        if (existingUser.rowCount > 0) {
            return res.status(409).json({ error: "Пользователь уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [normalizedUsername, hashedPassword]);

        res.status(201).json({ message: "Пользователь создан" });
    } catch (error) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.use(express.json()); 
app.use(express.static('public')); 

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (user.rows.length === 0) {
        return res.status(401).json({ error: "Неверное имя пользователя или пароль" });
    }

    const hashedPassword = user.rows[0].password;
    
    const isMatch = await bcrypt.compare(password, hashedPassword);
    
    if (isMatch) {
        res.json({ message: "Вход успешен!" });
    } else {
        res.status(401).json({ error: "Неверное имя пользователя или пароль" });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Ошибка при выходе" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Выход выполнен" });
    });
});

app.get('/users', async (req, res) => {
    try {
        const result = await pool.query("SELECT username FROM users");
        res.json(result.rows.map(row => row.username));
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


app.post('/messages', async (req, res) => {
    try {
        const { sender, recipient, content } = req.body;
        
        if (!sender || !recipient || !content) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }

        const usersExist = await pool.query(
            `SELECT COUNT(*) = 2 as valid 
             FROM users 
             WHERE username IN ($1, $2)`,
            [sender, recipient]
        );

        if (!usersExist.rows[0].valid) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const result = await pool.query(
            `INSERT INTO messages (sender_id, recipient_id, content)
             VALUES (
                 (SELECT id FROM users WHERE username = $1),
                 (SELECT id FROM users WHERE username = $2),
                 $3
             ) RETURNING *`,
            [sender, recipient, content]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/messages', async (req, res) => {
    try {
        const currentUser = req.query.currentUser;
        const withUser = req.query.with;

        if (!currentUser || !withUser) {
            return res.status(400).json({ error: "Не указаны пользователи" });
        }

        const messages = await pool.query(`
            SELECT m.*, u1.username as sender, u2.username as recipient
            FROM messages m
            JOIN users u1 ON m.sender_id = u1.id
            JOIN users u2 ON m.recipient_id = u2.id
            WHERE (u1.username = $1 AND u2.username = $2)
               OR (u1.username = $2 AND u2.username = $1)
            ORDER BY m.created_at`,
            [currentUser, withUser]
        );

        res.json(messages.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

