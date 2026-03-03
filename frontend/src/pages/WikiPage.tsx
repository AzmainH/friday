import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function WikiPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Wiki
      </Typography>
      <Box
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Coming soon — team knowledge base, docs, and collaborative editing.
        </Typography>
      </Box>
    </Container>
  )
}
