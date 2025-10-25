import { createTheme } from '@mui/material/styles';

// 👉 Module augmentation to let MUI know about @mui/lab's LoadingButton
declare module '@mui/material/styles' {
  interface Components {
    MuiLoadingButton?: any;
  }
}

// 👉 Module augmentation for custom button variants on <Button> and <LoadingButton>
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    tertiary: true;
  }
}
declare module '@mui/lab/LoadingButton' {
  interface LoadingButtonPropsVariantOverrides {
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
  typography: {
    fontFamily: `'Inter', sans-serif`,

    h1: {
      fontFamily: `'Playfair Display', serif`,
      fontSize: "3rem",
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: "-0.5px",
      color: "#1a1a1a",
    },
    h2: {
      fontFamily: `'Playfair Display', serif`,
      fontSize: "2.25rem",
      fontWeight: 500,
      lineHeight: 1.25,
      color: "#1c1c1c",
    },
    h3: {
      fontFamily: `'Playfair Display', serif`,
      fontSize: "1.75rem",
      fontWeight: 500,
      lineHeight: 1.3,
      color: "#202020",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 500,
      lineHeight: 1.4,
      color: "#222",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 500,
      lineHeight: 1.45,
      color: "#2a2a2a",
    },
    h6: {
      fontSize: "1.05rem",
      fontWeight: 500,
      lineHeight: 1.5,
      color: "#333",
    },

    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.7,
      color: "#444",
    },
    body2: {
      fontSize: "0.9rem",
      fontWeight: 300,
      lineHeight: 1.6,
      color: "#555",
    },

    caption: {
      fontSize: "0.75rem",
      fontWeight: 300,
      letterSpacing: "0.4px",
      textTransform: "uppercase",
      color: "#777",
    },
  },

  

  components: {
      MuiCssBaseline: {
    styleOverrides: (themeParam) => ({
      "h1": { ...themeParam.typography.h1 },
      "h2": { ...themeParam.typography.h2 },
      "h3": { ...themeParam.typography.h3 },
      "h4": { ...themeParam.typography.h4 },
      "h5": { ...themeParam.typography.h5 },
      "h6": { ...themeParam.typography.h6 },
      "p": { ...themeParam.typography.body1 },
    }),
  },
    // ---- Button variants ----
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          transition: 'background-color 0.2s, box-shadow 0.2s',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        sizeSmall: { padding: '4px 12px', fontSize: '0.8rem' },
        sizeMedium: { padding: '6px 16px', fontSize: '0.9rem' },
        sizeLarge: { padding: '8px 20px', fontSize: '1rem' },
      },
      variants: [
        {
          props: { variant: 'primary' },
          style: {
            backgroundColor: '#1976D2',
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#1565C0' },
            '&:disabled': { backgroundColor: '#90CAF9', color: '#FFFFFF' },
          },
        },
        {
          props: { variant: 'secondary' },
          style: {
            backgroundColor: '#E0E0E0',
            color: '#212529',
            '&:hover': { backgroundColor: '#BDBDBD' },
            '&:disabled': { backgroundColor: '#EEEEEE', color: '#9E9E9E' },
          },
        },
        {
          props: { variant: 'tertiary' },
          style: {
            border: '1px solid #1976D2',
            color: '#1976D2',
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: '#E3F2FD' },
            '&:disabled': { color: '#90CAF9', borderColor: '#90CAF9' },
          },
        },
      ],
    },

    // ---- Loading Button (from @mui/lab)
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-disabled': { opacity: 0.6 },
          '&:active': { transform: 'scale(0.98)' },
        },
      },
      variants: [
        {
          props: { variant: 'primary' },
          style: {
            backgroundColor: '#1976D2',
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#1565C0' },
            '&:disabled': { backgroundColor: '#90CAF9', color: '#FFFFFF' },
          },
        },
        {
          props: { variant: 'secondary' },
          style: {
            backgroundColor: '#E0E0E0',
            color: '#212529',
            '&:hover': { backgroundColor: '#BDBDBD' },
            '&:disabled': { backgroundColor: '#EEEEEE', color: '#9E9E9E' },
          },
        },
        {
          props: { variant: 'tertiary' },
          style: {
            border: '1px solid #1976D2',
            color: '#1976D2',
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: '#E3F2FD' },
            '&:disabled': { color: '#90CAF9', borderColor: '#90CAF9' },
          },
        },
      ],
    },

    // ---- TextField input styling ----
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '&:hover fieldset': { borderColor: '#1976D2' },
            '&.Mui-focused fieldset': { borderColor: '#1976D2', borderWidth: 2 },
            '&.Mui-error fieldset': { borderColor: '#F44336' },
          },
          '& .MuiFormHelperText-root.Mui-error': {
            color: '#F44336',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#1976D2',
          },
        },
      },
    },
  },
});

export default theme;