// Функция проверяет корректность введенного email, если строка содержит @ и точку, то возвращает true, иначе false
function check_correct_email(email) {
    if (email.includes('@') && email.includes('.')) {
        return true;
    } else {
        return false;
    }
}

module.exports = check_correct_email;