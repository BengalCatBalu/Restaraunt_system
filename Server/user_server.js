const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken'); // Подключаем пакет jsonwebtoken
const check_correct_email = require('./utility_func/check_correct_email');
const hashPassword = require('./utility_func/hash_password');
const authenticateToken = require('./utility_func/authentificateToken.js');
const app = express();
require('dotenv').config();
const PORT = 3000;

const db = new sqlite3.Database('mydatabase.db');
const salt = process.env.SALT;

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(100) NOT NULL,
      role VARCHAR(10) NOT NULL CHECK (role IN ('customer', 'chef', 'manager')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Database initialized');
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Регистрация нового пользователя
app.post('/register', (req, res) => {
  const { username, email, password, role } = req.body;
  let password_hash = hashPassword(password, salt);

  const query = `
    INSERT INTO user (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `;
  db.run(query, [username, email, password_hash, role], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to register user', code: 500 });
    } else if (!check_correct_email(email)) {
      return res.status(400).json({ error: 'Invalid email format', code: 400 });
    } else {
      // Генерируем JWT токен и отправляем его вместе с успешным сообщением
      res.status(201).json({ message: 'User registered successfully'});
    }
  });
});

// Вход пользователя в систему (авторизация)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(salt)
  console.log(email, hashPassword(password, salt));
  const query = `
    SELECT * FROM user WHERE email = ? AND password_hash = ?
  `;
  db.get(query, [email, hashPassword(password, salt)], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to log in', code: 500 });
    } else if (!row) {
      res.status(401).json({ error: 'Invalid email or password', code: 401 });
    } else {
      // Генерируем JWT токен и отправляем его вместе с успешным сообщением
      const token = jwt.sign({ email, role: row.role }, process.env.SECRET_KEY, {expiresIn : '24h'})
      res.status(200).json({ message: 'Logged in successfully', token });
    }
  });
});

// Получение списка пользователей
app.get('/users', authenticateToken, (req, res) => {
  // Если JWT токен валиден, продолжаем обработку запроса
  const query = `
    SELECT * FROM user
  `;
  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get users', code: 500 });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Получение информации о пользователе по токену
app.get('/user', authenticateToken, (req, res) => {
  const { email } = req.user;
  const query = `
    SELECT * FROM user WHERE email = ?
  `;
  db.get(query, [email], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get user', code: 500 });
    } else if (!row) {
      res.status(404).json({ error: 'User not found', code: 404 });
    } else {
      res.status(200).json(row);
    }
  });
});

// удаление всех пользователей
app.delete('/users', (req, res) => {
  const query = `
    DELETE FROM user
  `;
  db.run(query);
  res.status(200).json({ message: 'All users deleted successfully' });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

