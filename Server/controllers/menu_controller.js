const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dish.db');
// Создание таблицы 'dish'
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS dish (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      quantity INT NOT NULL,
      is_available BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Реализация предоставления меню
exports.GetMenu = (req, res) => {
    // Запрос к базе данных для получения информации о блюдах
    const query = `
      SELECT id, name, description, price
      FROM dish
      WHERE is_available = 1
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to get menu', code: 500 });
        } else {
            res.status(200).json(rows);
        }
    });
}

// добавление нового блюда в меню, доступно только 'manager'
exports.AddNewDish = (req, res) => {
    // Проверка роли пользователя
    if (req.user.role !== 'manager') {
        return res.sendStatus(403).json({ error: 'Forbidden', code: 403 });
    }
    const { name, description, price, quantity} = req.body;
    if (quantity > 0) {
        is_available = 1;
    } else {
        is_available = 0;
    }

    const query = `
        INSERT INTO dish (name, description, price, quantity, is_available)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [name, description, price, quantity, is_available], function (err) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to add dish', code: 500 });
        } else {
            res.status(200).json({ message: "Succesfully Added", id: this.lastID });
        }
    }
    );
}

// Информация об одном блюде из меню
exports.GetDish = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT id, name, description, price, quantity
        FROM dish
        WHERE id = ?
    `;
    db.get(query, [id], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to get dish', code: 500 });
        } else {
            res.status(200).json(row);
        }
    });
}

// изменение блюда в меню, доступно только 'manager'
exports.UpdateDish = (req, res) => {
    // Проверка роли пользователя
    if (req.user.role !== 'manager') {
        return res.sendStatus(403).json({ error: 'Forbidden', code: 403 });
    }
    const { id } = req.params;
    const { name, description, price, quantity } = req.body;
    if (quantity > 0) {
        is_available = 1;
    } else {
        is_available = 0;
    }

    const query = `
        UPDATE dish
        SET name = ?, description = ?, price = ?, quantity = ?, is_available = ?
        WHERE id = ?
    `;
    db.run(query, [name, description, price, quantity, is_available, id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update dish', code: 500 });
        } else {
            res.status(200).json({ message: "Succesfully Updated", rowsUpdated: this.changes });
        }
    }
    );
}

// удаление блюда из меню, доступно только 'manager'
exports.DeleteDish = (req, res) => {
    // Проверка роли пользователя
    if (req.user.role !== 'manager') {
        return res.sendStatus(403).json({ error: 'Forbidden', code: 403 });
    }
    const { id } = req.params;

    const query = `
        DELETE FROM dish
        WHERE id = ?
    `;
    db.run(query, [id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to delete dish', code: 500 });
        } else {
            res.status(200).json({ rowsDeleted: this.changes });
        }
    });
}
