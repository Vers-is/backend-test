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

// Добавьте этот код после других роутов, но перед app.listen()
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query("SELECT username FROM users");
        res.json(result.rows.map(row => row.username));
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


// Fetch messages between two users
app.get('/messages', async (req, res) => {
    const { with: recipient } = req.query;
    const username = req.session.username; // Adjust based on how you manage sessions

    try {
        const result = await pool.query(
            "SELECT * FROM messages WHERE (sender = $1 AND recipient = $2) OR (sender = $2 AND recipient = $1) ORDER BY created_at",
            [username, recipient]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении сообщений:', error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Send a message
app.post('/messages', async (req, res) => {
    const { sender, recipient, content } = req.body;

    try {
        await pool.query("INSERT INTO messages (sender, recipient, content, created_at) VALUES ($1, $2, $3, NOW())", [sender, recipient, content]);
        res.status(201).json({ message: "Сообщение отправлено" });
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

