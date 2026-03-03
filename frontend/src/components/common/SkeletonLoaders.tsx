import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

export function SkeletonCard() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
      </CardContent>
    </Card>
  )
}

export function SkeletonTable() {
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
        <Skeleton variant="text" width="20%" height={32} />
        <Skeleton variant="text" width="30%" height={32} />
        <Skeleton variant="text" width="25%" height={32} />
        <Skeleton variant="text" width="25%" height={32} />
      </Box>
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
          <Skeleton variant="text" width="20%" height={28} />
          <Skeleton variant="text" width="30%" height={28} />
          <Skeleton variant="text" width="25%" height={28} />
          <Skeleton variant="text" width="25%" height={28} />
        </Box>
      ))}
    </Box>
  )
}

export function SkeletonList() {
  return (
    <Box>
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={22} />
            <Skeleton variant="text" width="45%" height={18} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export function SkeletonDetail() {
  return (
    <Box>
      <Skeleton variant="text" width="50%" height={36} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="30%" height={22} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 2 }} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="80%" height={20} />
    </Box>
  )
}
