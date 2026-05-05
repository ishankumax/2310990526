import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Bell, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import NotificationCard from './NotificationCard';

const Dashboard = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        setRefreshing(true);
        try {
            const response = await axios.get('http://localhost:5000/api/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Simulate real-time by polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredNotifications = notifications.filter(n => 
        (filter === 'All' || n.type === filter) &&
        (n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
         n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 glass border-r border-border-color p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Bell className="text-white" />
                    </div>
                    <h1 className="font-bold text-xl tracking-tight">CampuSync</h1>
                </div>

                <nav className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 opacity-50">Filter by Category</p>
                    {['All', 'Placement', 'Event', 'Result'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                filter === cat ? 'bg-accent-primary text-white shadow-md shadow-blue-500/10' : 'hover:bg-bg-tertiary text-text-secondary'
                            }`}
                        >
                            {cat === 'All' && <LayoutDashboard size={18} />}
                            {cat === 'Placement' && <Bell size={18} />}
                            {cat === 'Event' && <Filter size={18} />}
                            {cat === 'Result' && <AlertCircle size={18} />}
                            <span className="font-medium">{cat}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto glass p-4 rounded-xl border border-dashed border-border-color">
                    <p className="text-xs text-text-secondary">Logged in as</p>
                    <p className="font-semibold text-sm">AffordMed Student</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Campus Updates</h2>
                        <p className="text-text-secondary">Stay updated with the latest placements, events, and results.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-bg-secondary border border-border-color rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-accent-primary transition-colors"
                            />
                        </div>
                        <button 
                            onClick={fetchNotifications}
                            className={`p-2.5 rounded-xl border border-border-color hover:bg-bg-tertiary transition-colors ${refreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={20} className="text-text-secondary" />
                        </button>
                    </div>
                </header>

                <div className="max-w-4xl">
                    <AnimatePresence mode='popLayout'>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-text-secondary animate-pulse">Fetching latest updates...</p>
                            </div>
                        ) : filteredNotifications.length > 0 ? (
                            filteredNotifications.map((n) => (
                                <NotificationCard key={n.id} notification={n} />
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-64 glass rounded-2xl border-dashed border-2 border-border-color"
                            >
                                <Search size={48} className="text-text-secondary mb-4 opacity-20" />
                                <p className="text-text-secondary">No notifications found for "{searchTerm}"</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
