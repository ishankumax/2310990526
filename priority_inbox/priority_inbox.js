const axios = require('axios');

const API_URL = 'http://20.207.122.201/evaluation-service/notifications';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBub3ZhYWRtaW4uY29tIiwicm9sZSI6InN1cGVyIiwiaWF0IjoxNzc3NDY3MTM0LCJleHAiOjE3NzgwNzE5MzR9.WF4-6FLKF6yZhZyYz6L_2MFboRo2U0cfRl9oaMLh5oE';

/**
 * Priority Weights as per Stage 6 requirements:
 * Placement (3) > Result (2) > Event (1)
 */
const TYPE_WEIGHTS = {
    'Placement': 3,
    'Result': 2,
    'Event': 1
};

async function getPriorityNotifications(n = 10) {
    try {
        // Fetch from the external API with Authorization header
        const response = await axios.get(API_URL, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            timeout: 5000 
        });
        
        const notifications = response.data.notifications;

        // Sorting Algorithm: Multi-level sort
        // 1. Primary: Weight (Category Importance)
        // 2. Secondary: Recency (Timestamp)
        const sorted = notifications.sort((a, b) => {
            const weightA = TYPE_WEIGHTS[a.Type] || 0;
            const weightB = TYPE_WEIGHTS[b.Type] || 0;

            // Sort by Weight Descending
            if (weightB !== weightA) {
                return weightB - weightA;
            }

            // Sort by Timestamp Descending (Newest first)
            return new Date(b.Timestamp) - new Date(a.Timestamp);
        });

        // Slice the top 'n' most important unread notifications
        const topN = sorted.slice(0, n);

        // Display results in a clean table format
        console.log(`\n=============================================================`);
        console.log(`     PRIORITY INBOX: TOP ${n} CRITICAL NOTIFICATIONS`);
        console.log(`=============================================================`);
        
        const tableData = topN.map((notif, index) => ({
            'Rank': index + 1,
            'Type': notif.Type,
            'Message': notif.Message,
            'Timestamp': notif.Timestamp,
            'Weight': TYPE_WEIGHTS[notif.Type] || 0
        }));

        console.table(tableData);

        return topN;
    } catch (error) {
        console.error('❌ Failed to retrieve Priority Inbox:');
        if (error.code === 'ECONNABORTED') {
            console.error('   Error: Request timed out. Please check the API availability.');
        } else if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${JSON.stringify(error.response.data)}`);
            console.error(`   Note: This route may require specific authentication headers.`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

// Execute the priority inbox processor
getPriorityNotifications(10);
