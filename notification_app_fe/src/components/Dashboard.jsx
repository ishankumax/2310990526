import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import { 
  Clock, 
  Briefcase, 
  Trophy, 
  GraduationCap, 
  CheckCircle2, 
  Circle 
} from 'lucide-react';

const API_BASE = '/api/notifications';

const Dashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('All');
  const [viewedIds, setViewedIds] = useState(() => {
    const saved = localStorage.getItem('viewed_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10
      };
      if (type !== 'All') params.notification_type = type;

      const response = await axios.get(API_BASE, {
        params
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, type]);

  const markAsViewed = (id) => {
    if (!viewedIds.includes(id)) {
      const updated = [...viewedIds, id];
      setViewedIds(updated);
      localStorage.setItem('viewed_notifications', JSON.stringify(updated));
    }
  };

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'academic': return <GraduationCap size={20} color="#2196f3" />;
      case 'event': return <Trophy size={20} color="#ff9800" />;
      case 'administrative': return <Briefcase size={20} color="#9c27b0" />;
      default: return <Clock size={20} color="#757575" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'Placement': return 'primary';
      case 'Result': return 'success';
      case 'Event': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Campus Updates</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter Category</InputLabel>
          <Select
            value={type}
            label="Filter Category"
            onChange={(e) => { setType(e.target.value); setPage(1); }}
          >
            <MenuItem value="All">All Categories</MenuItem>
            <MenuItem value="Placement">Placements</MenuItem>
            <MenuItem value="Result">Results</MenuItem>
            <MenuItem value="Event">Events</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {notifications.map((notif) => {
            const isNew = !viewedIds.includes(notif.ID);
            return (
              <Card 
                key={notif.ID} 
                onMouseEnter={() => markAsViewed(notif.ID)}
                sx={{ 
                  transition: '0.3s',
                  '&:hover': { transform: 'translateX(8px)', borderColor: 'primary.main' },
                  borderLeft: isNew ? '4px solid' : '1px solid',
                  borderColor: isNew ? 'primary.main' : 'rgba(255,255,255,0.1)',
                  opacity: isNew ? 1 : 0.8
                }}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: isNew ? 'primary.main' : 'rgba(255,255,255,0.05)',
                        color: isNew ? 'white' : 'text.secondary'
                      }}>
                        {getIcon(notif.Type)}
                      </Box>
                    </Grid>
                    <Grid item xs>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {notif.Message}
                        </Typography>
                        {isNew && <Chip label="New" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      </Box>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                          label={notif.Type} 
                          size="small" 
                          variant="outlined" 
                          color={getColor(notif.Type)} 
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Clock size={14} /> {new Date(notif.Timestamp).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item>
                      <IconButton disabled>
                        {notif.status === 'read' ? (
                          <CheckCircle2 size={16} color="#4caf50" />
                        ) : (
                          <Circle size={16} color="#bdbdbd" />
                        )}
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={10} 
              page={page} 
              onChange={(e, v) => setPage(v)} 
              color="primary" 
              shape="rounded" 
            />
          </Box>
        </Stack>
      )}
    </Container>
  );
};

export default Dashboard;
