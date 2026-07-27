import { Box, Stack, Typography } from '@mui/material'

export default function PageHeader({ icon: Icon, title, subtitle, color = '#1976d2', actions }) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
      {Icon && (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: 2,
          }}
        >
          <Icon />
        </Box>
      )}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" fontWeight={700} lineHeight={1.1}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box>{actions}</Box>}
    </Stack>
  )
}
