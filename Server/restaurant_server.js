const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const app = express();
const PORT = 3001;


// Промежуточное ПО для обработки данных формы и JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/menu', menuRoutes);
app.use('/order', orderRoutes);

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Order processing service is running on port ${PORT}`);
});

