const express = require('express')

const router = express.Router()

const { GetMenu, AddNewDish, UpdateDish, DeleteDish, GetDish } = require('../controllers/menu_controller')
const auth = require('../utility_func/authentificateToken')
// GET Menu
router.get('/', GetMenu)

// POST Menu
router.post('/', auth, AddNewDish)

// GET Dish
router.get('/:id', GetDish)

// Update Dish in Menu
router.put('/:id', auth, UpdateDish)

// Delete Dish from Menu
router.delete('/:id', auth, DeleteDish)

module.exports = router