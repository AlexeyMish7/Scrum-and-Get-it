import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2', // Blue
      light: '#63A4FF',
      dark: '#004BA0',
      contrastText: '#FFFFFF', // White text for contrast
    },
    secondary: {
      main: '#FF5722',
    },
    success: {
      main: '#4CAF50',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFC107',
      contrastText: '#000000',
    },
    error: {
      main: '#F44336',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#2196F3',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212529',
      secondary: '#6C757D',
    },
  },
});

export default theme;