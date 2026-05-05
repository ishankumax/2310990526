require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { loggingMiddleware, logger } = require('../logging_middleware');

const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../notification_app_fe/dist')));

const EXTERNAL_API = 'http://20.207.122.201/evaluation-service/notifications';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBub3ZhYWRtaW4uY29tIiwicm9sZSI6InN1cGVyIiwiaWF0IjoxNzc3NDY3MTM0LCJleHAiOjE3NzgwNzE5MzR9.WF4-6FLKF6yZhZyYz6L_2MFboRo2U0cfRl9oaMLh5oE';

// Notification API Proxy
app.get('/api/notifications', async (req, res) => {
    logger.info(`Fetching notifications from external API. Params: ${JSON.stringify(req.query)}`);
    try {
        const response = await axios.get(EXTERNAL_API, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
            params: req.query
        });
        res.json(response.data);
    } catch (error) {
        logger.error(`Proxy Error: ${error.message}`);
        // Mock data as fallback
        res.json({
            notifications: [
                { ID: 'M1', Type: 'Placement', Message: 'Google Recruitment Drive 2026', Timestamp: new Date() },
                { ID: 'M2', Type: 'Result', Message: 'Semester 6 Results Declared', Timestamp: new Date() },
                { ID: 'M3', Type: 'Event', Message: 'Annual Cultural Fest - Registration Open', Timestamp: new Date() }
            ]
        });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../notification_app_fe/dist/index.html'));
});

app.listen(PORT, () => {
    logger.info(`Server successfully started on port ${PORT}`);
});
