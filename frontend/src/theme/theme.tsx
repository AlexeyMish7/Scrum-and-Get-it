import { createTheme } from '@mui/material/styles';

// 👉 Module augmentation to allow custom variants
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    tertiary: true;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2', // Blue
      light: '#63A4FF',
      dark: '#004BA0',
      contrastText: '#FFFFFF',
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

  // ✅ Extend with component customizations
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
      variants: [
        {
          props: { variant: 'primary' },
          style: {
            backgroundColor: '#1976D2',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#1565C0',
            },
            '&:disabled': {
              backgroundColor: '#90CAF9',
              color: '#FFFFFF',
            },
          },
        },
        {
          props: { variant: 'secondary' },
          style: {
            backgroundColor: '#E0E0E0',
            color: '#212529',
            '&:hover': {
              backgroundColor: '#BDBDBD',
            },
          },
        },
        {
          props: { variant: 'tertiary' },
          style: {
            border: '1px solid #1976D2',
            color: '#1976D2',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: '#E3F2FD',
            },
          },
        },
      ],
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '&:hover fieldset': {
              borderColor: '#1976D2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976D2',
            },
          },
        },
      },
    },
  },
});

export default theme;