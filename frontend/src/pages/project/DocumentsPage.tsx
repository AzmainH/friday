import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

interface ProjectDocument {
  id: string
  filename: string
  content_type: string
  size: number
  uploaded_by_name: string
  created_at: string
  issue_key?: string
}

export default function DocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [search, setSearch] = useState('')

  const { data: uploads, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'uploads'],
    queryFn: async () => {
      const res = await client.get<{ items: ProjectDocument[] }>(
        `/projects/${projectId}/uploads`,
      )
      return res.data.items ?? []
    },
    enabled: !!projectId,
  })

  const filtered = (uploads ?? []).filter((u) =>
    u.filename.toLowerCase().includes(search.toLowerCase()),
  )

  const getFileTypeColor = (ct: string) => {
    if (ct.startsWith('image/')) return 'info'
    if (ct.includes('pdf')) return 'error'
    if (ct.includes('spreadsheet') || ct.includes('csv')) return 'success'
    return 'default'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Documents
        </Typography>
        <Button variant="contained" startIcon={<UploadFileIcon />}>
          Upload
        </Button>
      </Box>

      <TextField
        size="small"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 320 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Uploaded By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <InsertDriveFileIcon
                      sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      No documents found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InsertDriveFileIcon
                          fontSize="small"
                          color="action"
                        />
                        {doc.filename}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.content_type.split('/').pop()}
                        size="small"
                        color={getFileTypeColor(doc.content_type) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>{doc.uploaded_by_name}</TableCell>
                    <TableCell>{formatDateTime(doc.created_at)}</TableCell>
                    <TableCell>
                      {doc.issue_key && (
                        <Chip label={doc.issue_key} size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" title="Download">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Delete" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
