import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, GraduationCap, Bell } from 'lucide-react';

const icons = {
    'Placement': <Briefcase size={20} className="text-[#58a6ff]" />,
    'Event': <Calendar size={20} className="text-[#d29922]" />,
    'Result': <GraduationCap size={20} className="text-[#3fb950]" />,
    'General': <Bell size={20} className="text-white" />
};

const typeColors = {
    'Placement': 'border-l-[#58a6ff]',
    'Event': 'border-l-[#d29922]',
    'Result': 'border-l-[#3fb950]',
    'General': 'border-l-white'
};

const NotificationCard = ({ notification }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className={`glass p-5 rounded-xl mb-4 border-l-4 ${typeColors[notification.type] || typeColors.General} transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(88,166,255,0.1)]`}
        >
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="bg-[#21262d] p-3 rounded-lg">
                        {icons[notification.type] || icons.General}
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-secondary opacity-70 mb-1 block">
                            {notification.type}
                        </span>
                        <h3 className="text-lg font-bold mb-1">{notification.title}</h3>
                        <p className="text-[#8b949e] text-sm line-clamp-2">{notification.content}</p>
                    </div>
                </div>
                <span className="text-xs text-[#8b949e] whitespace-nowrap">
                    {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </motion.div>
    );
};

export default NotificationCard;
