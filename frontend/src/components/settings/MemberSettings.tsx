import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Autocomplete from '@mui/material/Autocomplete'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  useProjectMembers,
  useAddProjectMember,
  useUpdateProjectMember,
  useRemoveProjectMember,
  useUsers,
} from '@/hooks/useProjectSettings'
import type { User } from '@/types/api'

interface MemberSettingsProps {
  projectId: string
}

const ROLES = ['admin', 'member', 'viewer'] as const

export default function MemberSettings({ projectId }: MemberSettingsProps) {
  const { data: members = [], isLoading, error } = useProjectMembers(projectId)
  const { data: users = [] } = useUsers()
  const addMember = useAddProjectMember()
  const updateMember = useUpdateProjectMember()
  const removeMember = useRemoveProjectMember()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<string>('member')
  const [newCapacity, setNewCapacity] = useState(100)
  const [newHours, setNewHours] = useState(40)

  // Users not already in the project
  const memberUserIds = new Set(members.map((m) => m.user_id))
  const availableUsers = users.filter((u) => !memberUserIds.has(u.id))

  const handleAddMember = useCallback(() => {
    if (!selectedUser) return
    addMember.mutate(
      {
        projectId,
        body: {
          user_id: selectedUser.id,
          role: newRole,
          capacity_pct: newCapacity,
          hours_per_week: newHours,
        },
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false)
          setSelectedUser(null)
          setNewRole('member')
          setNewCapacity(100)
          setNewHours(40)
        },
      },
    )
  }, [selectedUser, projectId, newRole, newCapacity, newHours, addMember])

  const handleRoleChange = useCallback(
    (memberId: string, role: string) => {
      updateMember.mutate({ memberId, projectId, body: { role: role as 'admin' | 'member' | 'viewer' } })
    },
    [projectId, updateMember],
  )

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      removeMember.mutate({ memberId, projectId })
    },
    [projectId, removeMember],
  )

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={200} />
      </Stack>
    )
  }

  if (error) {
    return <Alert severity="error">Failed to load project members.</Alert>
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Members</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Member
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Capacity %</TableCell>
              <TableCell align="right">Hours / Week</TableCell>
              <TableCell align="center" width={60}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No members yet. Add team members to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={member.user?.avatar_url ?? undefined}
                      sx={{ width: 32, height: 32 }}
                    >
                      {(member.user?.display_name ?? member.user_id).charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {member.user?.display_name ?? 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.user?.email ?? ''}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    variant="standard"
                    disableUnderline
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        <Chip
                          label={role}
                          size="small"
                          color={role === 'admin' ? 'primary' : role === 'member' ? 'default' : 'secondary'}
                          variant="outlined"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell align="right">{member.capacity_pct}%</TableCell>
                <TableCell align="right">{member.hours_per_week}h</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveMember(member.id)}
                    aria-label="Remove member"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Project Member</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={availableUsers}
              getOptionLabel={(u) => `${u.display_name} (${u.email})`}
              value={selectedUser}
              onChange={(_e, val) => setSelectedUser(val)}
              renderInput={(params) => <TextField {...params} label="Select User" />}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
            />
            <TextField
              select
              label="Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              fullWidth
            >
              {ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              label="Capacity %"
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              fullWidth
              slotProps={{ input: { inputProps: { min: 0, max: 100 } } }}
            />
            <TextField
              type="number"
              label="Hours per Week"
              value={newHours}
              onChange={(e) => setNewHours(Number(e.target.value))}
              fullWidth
              slotProps={{ input: { inputProps: { min: 0, max: 168 } } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddMember}
            disabled={!selectedUser || addMember.isPending}
          >
            {addMember.isPending ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
