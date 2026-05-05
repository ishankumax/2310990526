require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { loggingMiddleware, logger } = require('../logging_middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
app.use(cors());
app.use(express.json());

// Stage 0: Mandatory Logging Integration
// Use the custom middleware to log all requests
app.use(loggingMiddleware);

// Health Check
app.get('/health', (req, res) => {
    logger.info('Health check performed');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test Endpoint
app.get('/api/test', (req, res) => {
    logger.info('Test endpoint reached');
    res.json({ message: 'Notification System Backend is Active' });
});

// Error simulation
app.get('/api/error', (req, res) => {
    try {
        throw new Error('Intentional simulation error');
    } catch (err) {
        logger.error(`Error in /api/error route: ${err.message}`);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Basic Notification API placeholders (for Stage 1)
app.get('/api/notifications', (req, res) => {
    logger.info('Fetching notifications');
    res.json([
        { id: 1, type: 'Placement', title: 'Google Interview', content: 'Scheduled for tomorrow', timestamp: new Date() },
        { id: 2, type: 'Event', title: 'Tech Fest', content: 'Join the coding challenge', timestamp: new Date() }
    ]);
});

app.listen(PORT, () => {
    // Note: No console.log allowed!
    logger.info(`Server successfully started on port ${PORT}`);
});
