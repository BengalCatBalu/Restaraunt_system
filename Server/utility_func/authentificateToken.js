const jwt = require('jsonwebtoken'); // Подключаем пакет jsonwebtoken
require('dotenv').config();

function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) {
      return res.sendStatus(401);
    }
  
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        console.error(err);
        return res.sendStatus(403);
      }
  
      // Если JWT токен валиден, сохраняем информацию о пользователе в объекте запроса
      req.user = user;
      next();
    });
}

module.exports = auth;