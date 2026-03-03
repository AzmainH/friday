import { createTheme, type ThemeOptions } from '@mui/material/styles'

const sharedTypography: ThemeOptions['typography'] = {
  fontFamily: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: { fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2 },
  h2: { fontWeight: 700, fontSize: '1.875rem', lineHeight: 1.3 },
  h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3 },
  h4: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
  h5: { fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.4 },
  h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
  button: { textTransform: 'none', fontWeight: 600 },
}

const sharedComponents: ThemeOptions['components'] = {
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: { borderRadius: 12 },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: { padding: '8px 16px' },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 8 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 16 },
    },
  },
}

const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#ce93d8' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: sharedTypography,
  components: {
    ...sharedComponents,
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#1e1e1e', backgroundImage: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#1e1e1e', backgroundImage: 'none' },
      },
    },
  },
}

const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  typography: sharedTypography,
  components: sharedComponents,
}

export function getTheme(mode: 'light' | 'dark') {
  return createTheme(mode === 'dark' ? darkThemeOptions : lightThemeOptions)
}
