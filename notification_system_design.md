# Notification System Design

## Overview

This document outlines the design for the notification system, including architecture, components, and workflows.

## Components

- Notification producer / sender
- Notification queue or broker
- Notification processing service
- Notification storage and logs
- Notification delivery adapters (email, SMS, push, in-app)

## Architecture

1. Producer sends notification request.
2. Request enters a queue or event stream.
3. Processor consumes events, applies business rules.
4. Notifications are dispatched via adapter.
5. Delivery status is logged and stored.

## Considerations

- Retry strategy
- Failure handling
- Event deduplication
- Scalability
- Monitoring and alerting

## Deployment

- Backend service handles notification orchestration.
- Frontend application provides user management and notification configuration.
## Stage 2: Persistent Storage and Scalability

### 1. Database Suggestion: PostgreSQL
For the campus notification platform, I suggest **PostgreSQL** as the primary persistent storage.

**Rationale:**
- **Data Integrity:** ACID compliance ensures that notification delivery statuses and user read states are never lost or corrupted.
- **Structured Categorization:** Relational tables are ideal for linking notifications to categories (Placements, Events, Results).
- **JSONB Support:** Notifications often have varying metadata (e.g., a "Placement" might have a company logo URL, while a "Result" has a PDF link). PostgreSQL's `JSONB` allows for flexible schema-less data within a structured record.
- **Indexing:** Excellent support for B-Tree and GIN indexes, critical for fetching the latest updates quickly.

---

### 2. Database Schema

```sql
-- Categories table
CREATE TABLE notification_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- 'Placement', 'Event', 'Result'
);

-- Core notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type_id INTEGER REFERENCES notification_types(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB, -- For dynamic fields like links, images, or tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User notification status (assuming users are pre-authorized)
CREATE TABLE user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- External ID from auth system
    notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, notification_id)
);

-- Indexing for performance
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_user_notif_unread ON user_notifications(user_id) WHERE is_read = FALSE;
```

---

### 3. Scalability Analysis

#### Potential Problems as Data Volume Increases:
1. **Table Bloat:** The `notifications` table could grow to millions of rows, slowing down `SELECT` and `INSERT` operations.
2. **Index Degradation:** As indexes grow larger than available RAM, disk I/O increases, causing latency spikes during "Result" releases when traffic peaks.
3. **Write Contention:** High-frequency logging and status updates (`is_read = true`) can cause lock contention on the `user_notifications` table.

#### Proposed Solutions:
- **Table Partitioning:** Partition the `notifications` table by `created_at` (e.g., Monthly partitions). Old data can be archived or dropped easily.
- **Read Replicas:** Offload heavy `GET` requests (fetching campus updates) to read replicas, keeping the primary DB focused on writes.
- **Caching Layer (Redis):** Cache the "Latest 20 Notifications" in Redis. Since 90% of user traffic will be viewing recent updates, this significantly reduces DB load.
- **Asynchronous Processing:** Use a message broker (RabbitMQ) to ingest notifications, preventing the API from hanging during high-volume bursts.

---

### 4. Stage 1 REST API Queries

**Fetch All Notifications (By Type):**
```sql
SELECT n.id, nt.name as type, n.title, n.content, n.created_at 
FROM notifications n
JOIN notification_types nt ON n.type_id = nt.id
WHERE nt.name = 'Placement' -- Variable based on filter
ORDER BY n.created_at DESC
LIMIT 50;
```

**Get Unread Count for a User:**
```sql
SELECT COUNT(*) 
FROM user_notifications 
WHERE user_id = :current_user_id AND is_read = FALSE;
```

**Mark Notification as Read:**
```sql
UPDATE user_notifications 
SET is_read = TRUE, read_at = NOW() 
WHERE user_id = :current_user_id AND notification_id = :notif_id;
```
