#  Система обработки заказов ресторана
> <p>Выполнил: Ефимов Иван БПИ212</p> <p>Система реализованая на Node.js с использованием пакетов express, nodemon, sqlite, jsonwebtoken, bcrypt. </p>

> <a href = "https://www.postman.com/material-physicist-87201864/workspace/hungry-kitties-dapp/collection/26062559-b69865d5-3468-4880-9155-2aafebf5eda9?action=share&creator=26062559">ссылка на коллекцию в postman </a> Важно, что во многих функциях в разделе аутентификации уже вставлен токен, который использовался мной при тестировании. Следует обновить его на свой токен.

## Авторизация пользователя

> Сервер, отвечающий за авторизацию пользователей находится в папке user_server.js. При локальном хостинге располагается на 3000 порту.

### Регистрация нового пользователя

``` js 
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
      res.status(201).json({ message: 'User registered successfully'});
    }
  });
});
```

### Авторизация пользователя

```js
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
```

При успешной авторизации вернется новый токен сессии.

### Представление информации о пользователе (по токену)
```js
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
```

Также дополнительно реализованы запросы для удобного тестирования - удаление всех пользователей и получение списка всех пользователей.

<strong>Кодовое слово к JWT - 'KPO-Homework'</strong>

## Обработка dishes / menu / order

Сервер для автоматически размещается на хосте 3001.

### Получение всего меню
```js
exports.GetMenu = (req, res) => {
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
```

### Добавление блюда в меню (доступно только 'manager')
```js
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
```

Аналогично реализованы запросы на изменение/удаление блюда из меню.

### Создание заказа
```js
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
```

### Обновление статуса заказа
```js
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
```

## Качество кода
Так как этот пункт весит целых  😱😱😱😱 2 балла, то считаю необходимым расписать.

Код разделил на три папки, помимо двух главных файлов с серверами.

<ul>
<li> controllers (описаны функции поведения при выполнении запроса)</li>
<li> routes (описаны пути для определения запроса)</li>
<li> utility_func (без лишних слов)</li> 
</ul>

Таким образом поддержка сервера будет намного быстрее и понятней.




