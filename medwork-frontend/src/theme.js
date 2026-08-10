import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#113a7b',
      light: '#2563eb',
      dark: '#0e2f63',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1e293b',
      light: '#334155',
      dark: '#0b1b36',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
    error: {
      main: '#dc2626',
    },
    divider: '#e5e8ef',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    body1: {
      fontSize: '14px',
    },
    body2: {
      fontSize: '13px',
    },
    caption: {
      fontSize: '12px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 2px 12px rgba(17, 58, 123, 0.08)',
        },
        contained: {
          backgroundColor: '#113a7b',
          '&:hover': {
            backgroundColor: '#0e2f63',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#f9fafb',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '13px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e5e8ef',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#113a7b',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#113a7b',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f9fafb',
          '& .MuiTableCell-root': {
            color: '#6b7280',
            fontWeight: 600,
            fontSize: '13px',
            borderBottom: '1px solid #e5e8ef',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontSize: '13px',
            borderBottom: '1px solid #f3f4f6',
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(17, 58, 123, 0.03)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e5e8ef',
        },
        indicator: {
          backgroundColor: '#113a7b',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '13px',
          '&.Mui-selected': {
            color: '#113a7b',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          fontSize: '12px',
        },
        filled: {
          backgroundColor: '#113a7b',
          color: '#ffffff',
        },
      },
    },
  },
})

export default theme
