import { useState, useCallback, useMemo } from 'react'
import { UserPlus, Trash2 } from 'lucide-react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
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

function UserAvatar({ user, size = 32 }: { user?: { avatar_url?: string | null; display_name?: string | null } | null; size?: number }) {
  const name = user?.display_name ?? '?'
  const initial = name.charAt(0).toUpperCase()

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  )
}

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

  // Search state for user autocomplete
  const [userSearch, setUserSearch] = useState('')
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return availableUsers
    const q = userSearch.toLowerCase()
    return availableUsers.filter(
      (u) =>
        (u.display_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q),
    )
  }, [availableUsers, userSearch])

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
          setUserSearch('')
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
      <div className="space-y-4">
        <div className="skeleton-shimmer h-12 rounded-lg" />
        <div className="skeleton-shimmer h-52 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Failed to load project members.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Members</h3>
        <Button
          variant="primary"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Member
        </Button>
      </div>

      <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">User</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Role</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase">Capacity %</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase">Hours / Week</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase w-[60px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-secondary border-t border-surface-200">
                  No members yet. Add team members to get started.
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-2 border-t border-surface-200">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={member.user} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {member.user?.display_name ?? 'Unknown User'}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {member.user?.email ?? ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 border-t border-surface-200">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="rounded-lg border border-surface-200 bg-white px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 border-t border-surface-200 text-right">{member.capacity_pct}%</td>
                <td className="px-4 py-2 border-t border-surface-200 text-right">{member.hours_per_week}h</td>
                <td className="px-4 py-2 border-t border-surface-200 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    aria-label="Remove member"
                    className="inline-flex items-center justify-center rounded-[--radius-sm] p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} title="Add Project Member" size="sm">
        <div className="space-y-4">
          {/* User search / autocomplete */}
          <div>
            <label htmlFor="member-user" className="block text-sm font-medium text-text-primary mb-1">Select User</label>
            <div className="relative">
              <input
                id="member-user"
                type="text"
                value={selectedUser ? `${selectedUser.display_name} (${selectedUser.email})` : userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value)
                  setSelectedUser(null)
                }}
                placeholder="Search users..."
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
              />
              {!selectedUser && userSearch.trim() && filteredUsers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-lg dark:bg-dark-surface dark:border-dark-border">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u)
                        setUserSearch('')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-50 text-left transition-colors"
                    >
                      <UserAvatar user={u} size={24} />
                      <span>
                        {u.display_name} <span className="text-text-secondary">({u.email})</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="member-role" className="block text-sm font-medium text-text-primary mb-1">Role</label>
            <select
              id="member-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="member-capacity" className="block text-sm font-medium text-text-primary mb-1">Capacity %</label>
            <input
              id="member-capacity"
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              min={0}
              max={100}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            />
          </div>

          <div>
            <label htmlFor="member-hours" className="block text-sm font-medium text-text-primary mb-1">Hours per Week</label>
            <input
              id="member-hours"
              type="number"
              value={newHours}
              onChange={(e) => setNewHours(Number(e.target.value))}
              min={0}
              max={168}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddMember}
            disabled={!selectedUser || addMember.isPending}
            loading={addMember.isPending}
          >
            Add Member
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
