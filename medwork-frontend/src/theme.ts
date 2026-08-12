import { createTheme, type CSSTokens, type AlphaFunction } from '@mui/material/styles'

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
          transition: 'all 0.2s ease',
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
        variant: 'outlined',
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
          borderRadius: 8,
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
    MuiFormControl: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        dropdown: {
          borderRadius: 6,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiCardAction: {
      styleOverrides: {
        root: {
          fontSize: '12px',
          padding: '8px 16px',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        anchorElement: {
          fontSize: '11px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '13px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
  // Enhanced border-radius values for newer MUI components
  borders: {
    none: '0',
    1: '1px solid #e5e8ef',
    2: '2px solid #e5e8ef',
    3: '3px solid #e5e8ef',
    4: '4px solid #e5e8ef',
  },
})

// Add dark mode theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    error: {
      main: '#ef4444',
    },
    divider: '#334155',
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
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease',
        },
        contained: {
          backgroundColor: '#1e293b',
          '&:hover': {
            backgroundColor: '#334155',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#334155',
            '&:hover': {
              backgroundColor: '#475569',
            },
            '&.Mui-focused': {
              backgroundColor: '#1e293b',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '13px',
            color: '#94a3b8',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#334155',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          '& .MuiTableCell-root': {
            color: '#cbd5e1',
            fontWeight: 600,
            fontSize: '13px',
            borderBottom: '1px solid #334155',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontSize: '13px',
            borderBottom: '1px solid #334155',
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
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
          borderRadius: 8,
          border: '1px solid #334155',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          backgroundColor: '#1e293b',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #334155',
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
          color: '#94a3b8',
          '&.Mui-selected': {
            color: '#113a7b',
            fontWeight: 700,
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
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
        },
      },
    },
  },
})

export default theme

// Custom theme overrides
export const themeOverrides: Record<string, any> = {
  MuiTextField: {
    defaultProps: {
      size: 'small',
      variant: 'outlined',
      inputProps: {
        style: {
          fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: '13px',
        },
      },
    },
  },
  MuiButton: {
    defaultProps: {
      size: 'medium',
    },
  },
}

// Color tokens for the dark theme
export const darkThemeColors = {
  primary: {
    light: '#60a5fa',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },
  secondary: {
    light: '#94a3b8',
    main: '#64748b',
    dark: '#475569',
  },
  danger: {
    main: '#ef4444',
  },
  success: {
    main: '#22c55e',
  },
  warning: {
    main: '#f59e0b',
  },
}