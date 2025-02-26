// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASS,
//     port: process.env.DB_PORT
// });

// const createUser = async (username, password) => {
//     const result = await pool.query(
//         "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
//         [username, password]
//     );
//     return result.rows[0];
// };

// const getUserByUsername = async (username) => {
//     const result = await pool.query(
//         "SELECT * FROM users WHERE username = $1",
//         [username]
//     );
//     return result.rows[0];
// };

// module.exports = { createUser, getUserByUsername };
