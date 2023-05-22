const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dish.db');

// Создание таблицы 'order'
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status VARCHAR(50) NOT NULL,
      special_requests TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Создание таблицы 'order_dish'
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS order_dish (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL
    )
  `);
}
);

// Создание нового заказа
exports.CreateOrder = (req, res) => {
    const { dishes, special_requests } = req.body;
    // Проверка, что каждое блюдо из dishes доступно в меню
    const query1 = `
        SELECT id
        FROM dish
        WHERE id = ?
    `;
    dishes.forEach((dish) => {
        db.get(query1, [dish.id], (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to create order', code: 500 });
                return;
            } else if (!row) {
                res.status(400).json({ error: 'Dish not found. Error Dish ID - ' + dish.id, code: 400 });
                return;
            }
        });
    });
    // Создание нового заказа
    const status = 'в ожидании';
    const query = `
        INSERT INTO orders (status, special_requests)
        VALUES (?, ?)
    `;
    db.run(query, [status, special_requests], function (err) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create order', code: 500 });
        } else {
            const orderId = this.lastID;
            const query = `
                INSERT INTO order_dish (order_id, dish_id, quantity, price)
                VALUES (?, ?, ?, ?)
            `;
            dishes.forEach((dish) => {
                db.run(query, [orderId, dish.id, dish.quantity, dish.price], (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({ error: 'Failed to create order', code: 500 });
                    }
                });
            });
            res.status(200).json({ message: "Succesfully Created", id: orderId });
        }
    });
}

// Получение списка заказов 'в ожидании'
exports.GetWaitingOrders = (req, res) => {
    const query = `
        SELECT id, status, special_requests
        FROM orders
        WHERE status = 'в ожидании'
    `;
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to get orders', code: 500 });
        } else {
            res.status(200).json(rows);
        }
    });
}

// Обновление статуса заказа
exports.UpdateOrder = (req, res) => {
    // Проверка на 'manager'
    if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Forbidden', code: 403 });
    }
    const { id, status } = req.body;
    const query = `
        UPDATE orders
        SET status = ?
        WHERE id = ?
    `;
    db.run(query, [status, id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update order', code: 500 });
        } else {
            res.status(200).json({ message: "Succesfully Updated", id: id });
        }
    });
}

// Получение списка заказов
exports.GetOrders = (req, res) => {
    const query = `
        SELECT id, status, special_requests
        FROM orders
    `;
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to get orders', code: 500 });
        } else {
            res.status(200).json(rows);
        }
    }
    );
}

// Получение информации по одному заказу
exports.GetOrder = (req, res) => {
    const orderId = req.params.id;
    const query = `
        SELECT id, status, special_requests
        FROM orders
        WHERE id = ?
    `;
    db.get(query, [orderId], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to get order', code: 500 });
        } else {
            res.status(200).json(row);
        }
    });
}


