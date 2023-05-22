const crypto = require('crypto');

function hashPassword(password, salt) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');

  return hash;
}

module.exports = hashPassword;