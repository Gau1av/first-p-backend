const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Fetch all services (Services.jsx / Home.jsx)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new service (Admin)
router.post('/', async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const service = new Service({ title, description, price });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an existing service (Admin)
router.put('/:id', async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a service (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;