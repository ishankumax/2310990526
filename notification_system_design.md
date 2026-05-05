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
JOIN notification_types nt ON n.id = nt.id
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

---

## Stage 3: Query Optimization and Indexing

### 1. Query Accuracy and Performance Analysis
**Query:** `SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;`

**Is it accurate?**
Technically, yes. It will return the correct data. However, using `SELECT *` is considered poor practice in high-volume systems as it fetches unneeded columns (like metadata or heavy content strings), increasing network I/O and memory usage.

**Why is it slow?**
With 5 million rows, the database is likely performing a **Full Table Scan**. It has to check every single row to see if it matches `studentID = 1042` and `isRead = false`. Even if only 10 rows match, the DB still "reads" 5 million.

**Recommended Changes:**
- **Composite Index:** Add a composite index on `(studentID, isRead, createdAt)`. This allows the DB to jump directly to the student's data and have it pre-sorted.
- **Selective Columns:** Only fetch the columns needed for the UI (e.g., `id`, `title`, `createdAt`).

**Computation Cost:**
- **Current (No Index):** $O(N)$ where $N=5,000,000$. The cost is high as it requires significant Disk I/O.
- **Optimized (With Index):** $O(\log N)$. The cost is negligible (microseconds) as it only involves a B-Tree traversal and a range scan of a few rows.

---

### 2. The "Index Every Column" Advice
**Is this effective?** **No.**

**Why not?**
1. **Write Overhead:** Every `INSERT`, `UPDATE`, or `DELETE` becomes significantly slower because the database must update *every* index associated with the table.
2. **Storage Waste:** Indexes consume significant disk space. At 5 million rows, indexing every column could easily double or triple the storage requirements.
3. **Optimizer Confusion:** Too many indexes can confuse the Query Planner, leading it to choose a less efficient index for a specific query.
4. **Inefficiency:** A single-column index on `isRead` is useless because its "selectivity" is low (half the table might be `false`). You need **Composite Indexes** tailored to your specific query patterns.

---

### 3. New Query Requirement
*Find all students who got a placement notification in the last 7 days.*

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days';
```

**Optimization Note:** To make this fast, a composite index on `(notificationType, createdAt)` is required.

---

## Stage 4: High-Frequency Read Optimization

The current issue—database overwhelm due to "on-load" fetching for every student—indicates a lack of caching and an inefficient communication model. Below are the suggested solutions to improve performance and their respective trade-offs.

---

### 1. Suggested Solutions

#### A. In-Memory Caching (Redis)
Instead of hitting the PostgreSQL database for every page load, we should cache the notification data in a high-speed memory store like Redis.
- **Implementation:** Store the "Latest 50 Notifications" as a JSON string or a List in Redis. When a student loads the page, the API checks Redis first. If the data is there (Cache Hit), it returns it in <1ms. If not (Cache Miss), it fetches from the DB and populates the cache.

#### B. Real-time Push (WebSockets / SSE)
Transition from a "Pull" model (client asks server) to a "Push" model (server tells client).
- **Implementation:** Use WebSockets or Server-Sent Events (SSE). When a new "Placement" or "Result" is published in the DB, the backend pushes that specific notification payload to all currently connected clients. The UI updates instantly without the student needing to refresh or trigger a DB query on load.

#### C. Database Read Replicas
Offload the read traffic from the primary database.
- **Implementation:** Set up one or more Read Replicas. All `SELECT` queries from the student dashboard are directed to the replicas, while the primary DB handles only `INSERT` and `UPDATE` (marking as read) operations.

---

### 2. Trade-off Analysis

| Strategy | Performance Gain | Complexity | Consistency Trade-off | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Redis Caching** | **Very High** | Medium | **Cache Invalidation:** Users might see slightly stale data (seconds) if invalidation logic is not robust. | Low (Shared Redis) |
| **WebSockets** | **Highest (UX)** | High | **Real-time Sync:** Requires a Pub/Sub (like Redis) to sync across multiple server instances. | Medium (RAM for open connections) |
| **Read Replicas** | High | Low | **Replication Lag:** A student might mark a notification as read, but see it as "unread" for a few ms/seconds due to lag. | **High** (Additional DB nodes) |
| **Client-side Caching** | High (for repeats) | Low | **Sync Issues:** Hard to manage unread counts accurately across different devices. | Zero |

---

### 3. Recommended Improvement Path

1. **Short Term (Quick Win):** Implement **Redis Caching** for the global notification feed. This will reduce DB load by up to 90% immediately, as thousands of students will be served from memory.
2. **Long Term (Premium UX):** Transition to **WebSockets** for real-time delivery. This eliminates the need for "refresh on load" entirely, providing the "real-time" experience expected in a modern notification platform.
3. **Hybrid Optimization:** Use **ETags** (HTTP Caching headers). If the notifications haven't changed since the last fetch, the server can return a `304 Not Modified` status, saving bandwidth and processing time.
