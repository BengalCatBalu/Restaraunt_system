const express = require('express')

const router = express.Router()

const { CreateOrder, GetWaitingOrders, UpdateOrder, GetOrder, GetOrders  } = require('../controllers/order_controller')
const auth = require('../utility_func/authentificateToken')

// Create Order
router.post('/', auth, CreateOrder)

// Get Waiting Orders
router.get('/waiting', GetWaitingOrders)

// Update Order
router.put('/:id', auth, UpdateOrder)

// Get Order
router.get('/:id', GetOrder)

// Get Orders
router.get('/', GetOrders)

module.exports = router