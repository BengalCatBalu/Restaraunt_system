<p>This system is implemented using Node.js and utilizes packages such as express, nodemon, sqlite, jsonwebtoken, and bcrypt.</p>

> <a href="https://www.postman.com/material-physicist-87201864/workspace/hungry-kitties-dapp/collection/26062559-b69865d5-3468-4880-9155-2aafebf5eda9?action=share&creator=26062559">Link to Postman collection</a> Please note that in many authentication functions, a token that I used during testing is already inserted. Be sure to update it with your own token.

## User Authentication

> The server responsible for user authentication is located in the user_server.js file. It runs on port 3000 for local hosting.

### Registering a New User

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
### User Login
``` js
Copy code
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(salt)
  console.log(email, hashPassword(password, salt));
  const query = `
    SELECT * FROM user WHERE email = ? AND password_hash = ?
  `;
  db.get(query, [email, hashPassword(password, salt)], (err, row) => {
    if err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to log in', code: 500 });
    } else if (!row) {
      res.status(401).json({ error: 'Invalid email or password', code: 401 });
    } else {
      // Generate a JWT token and send it along with a success message
      const token = jwt.sign({ email, role: row.role }, process.env.SECRET_KEY, {expiresIn : '24h'})
      res.status(200).json({ message: 'Logged in successfully', token });
    }
  });
});
```
Upon successful login, a new session token will be returned.

### Retrieving User Information (By Token)
``` js
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
Additionally, there are additional queries implemented for convenient testing, such as deleting all users and retrieving a list of all users.

<strong>JWT Secret Key: 'KPO-Homework'</strong>

### Handling Dishes / Menu / Orders
The server for these functions automatically runs on port 3001.

Retrieving the Entire Menu
``` js
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
Adding a Dish to the Menu (Available only to 'managers')
``` js
exports.AddNewDish = (req, res) => {
    // Checking user role
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
Similar requests are implemented for modifying/deleting dishes from the menu.

### Creating an Order
``` js
exports.CreateOrder = (req, res) => {
    const { dishes, special_requests } = req.body;
    // Checking that each dish in dishes is available in the menu
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
    // Creating a new order
    const status = 'pending';
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

### Updating Order Status
```js
// Updating order status
exports.UpdateOrder = (req, res) => {
    // Checking for 'manager' role
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
