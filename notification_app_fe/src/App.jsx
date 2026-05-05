import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  PriorityHigh as PriorityIcon 
} from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import PriorityInbox from './components/PriorityInbox';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ gap: 2 }}>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.5px' }}
              >
                CampuSync
              </Typography>
              
              <Button 
                component={Link} 
                to="/" 
                startIcon={<DashboardIcon />} 
                color="inherit"
              >
                Dashboard
              </Button>
              
              <Button 
                component={Link} 
                to="/priority" 
                startIcon={<PriorityIcon />} 
                variant="contained" 
                color="primary"
              >
                Priority Inbox
              </Button>
            </Toolbar>
          </Container>
        </AppBar>

        <Box sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/priority" element={<PriorityInbox />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
