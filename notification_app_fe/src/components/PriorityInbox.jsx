import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Slider,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import { 
  Flame, 
  Trophy, 
  Megaphone, 
  GraduationCap,
  Clock
} from 'lucide-react';

const API_BASE = '/api/notifications';

const TYPE_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

const PriorityInbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  const fetchAndPrioritize = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE, {
        params: { limit: 50 } // Fetch more to find top priority
      });
      
      const allNotifs = response.data.notifications;
      
      // Sorting Algorithm: Weight -> Recency
      const sorted = [...allNotifs].sort((a, b) => {
        const weightA = TYPE_WEIGHTS[a.Type] || 0;
        const weightB = TYPE_WEIGHTS[b.Type] || 0;
        
        if (weightB !== weightA) return weightB - weightA;
        return new Date(b.Timestamp) - new Date(a.Timestamp);
      });
      
      setNotifications(sorted.slice(0, limit));
    } catch (error) {
      console.error('Priority Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndPrioritize();
  }, [limit]);

  const getPriorityInfo = (type) => {
    switch (type) {
      case 'Placement': return { icon: <Campaign color="error" />, label: 'CRITICAL', color: 'error' };
      case 'Result': return { icon: <School color="warning" />, label: 'HIGH', color: 'warning' };
      case 'Event': return { icon: <EmojiEvents color="info" />, label: 'NORMAL', color: 'info' };
      default: return { icon: <EmojiEvents />, label: 'INFO', color: 'default' };
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Whatshot sx={{ fontSize: 40, color: '#f59e0b' }} />
          <Box>
            <Typography variant="h4" fontWeight={800}>Priority Inbox</Typography>
            <Typography variant="body2" color="text.secondary">
              Weight-based algorithm: Placements &gt; Results &gt; Events
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography gutterBottom variant="subtitle2">Displaying Top {limit} Notifications</Typography>
          <Slider
            value={limit}
            min={5}
            max={20}
            step={1}
            onChange={(e, v) => setLimit(v)}
            valueLabelDisplay="auto"
            sx={{ maxWidth: 300 }}
          />
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="warning" />
        </Box>
      ) : (
        <Stack spacing={2}>
          {notifications.map((notif, index) => {
            const info = getPriorityInfo(notif.Type);
            return (
              <Card 
                key={notif.ID}
                sx={{ 
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: `"${index + 1}"`,
                    position: 'absolute',
                    left: -15,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    opacity: 0.1,
                    color: 'white'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                    <Avatar sx={{ bgcolor: `${info.color}.main`, width: 56, height: 56, boxShadow: 3 }}>
                      {info.icon}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={info.label} 
                          size="small" 
                          color={info.color} 
                          variant="filled" 
                          sx={{ fontWeight: 900, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Score: {TYPE_WEIGHTS[notif.Type]}pts
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {notif.Message}
                      </Typography>
                      
                      <Divider sx={{ my: 1.5, opacity: 0.1 }} />
                      
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {notif.Type} Category
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notif.Timestamp).toLocaleDateString()} at {new Date(notif.Timestamp).toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
};

export default PriorityInbox;
