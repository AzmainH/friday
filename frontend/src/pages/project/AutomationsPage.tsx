import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import BoltIcon from '@mui/icons-material/Bolt'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import type { AutomationRule } from '@/types/api'
import {
  useAutomations,
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
} from '@/hooks/useAutomations'
import AutomationBuilder, {
  type AutomationBuilderOutput,
} from '@/components/automations/AutomationBuilder'
import ExecutionLog from '@/components/automations/ExecutionLog'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AutomationsPageProps {
  projectId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AutomationsPage({ projectId }: AutomationsPageProps) {
  const { data: rules, isLoading } = useAutomations(projectId)
  const createMutation = useCreateAutomation(projectId)
  const updateMutation = useUpdateAutomation(projectId)
  const deleteMutation = useDeleteAutomation(projectId)

  const [showBuilder, setShowBuilder] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleCreate = useCallback(
    (output: AutomationBuilderOutput) => {
      createMutation.mutate(output, {
        onSuccess: () => setShowBuilder(false),
      })
    },
    [createMutation],
  )

  const handleUpdate = useCallback(
    (output: AutomationBuilderOutput) => {
      if (!editingRule) return
      updateMutation.mutate(
        { id: editingRule.id, body: output },
        { onSuccess: () => setEditingRule(null) },
      )
    },
    [editingRule, updateMutation],
  )

  const handleToggle = useCallback(
    (rule: AutomationRule) => {
      updateMutation.mutate({
        id: rule.id,
        body: { is_enabled: !rule.is_enabled },
      })
    },
    [updateMutation],
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id)
    },
    [deleteMutation],
  )

  const toggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id))
    },
    [],
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BoltIcon color="warning" />
          <Typography variant="h5" fontWeight={600}>
            Automations
          </Typography>
          {rules && (
            <Chip
              label={`${rules.length} rule${rules.length !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingRule(null)
            setShowBuilder(true)
          }}
        >
          New Automation
        </Button>
      </Box>

      {/* Builder for creating */}
      {showBuilder && !editingRule && (
        <Box sx={{ mb: 3 }}>
          <AutomationBuilder
            onSave={handleCreate}
            onCancel={() => setShowBuilder(false)}
          />
        </Box>
      )}

      {/* Loading state */}
      {isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      )}

      {/* Rule list */}
      {!isLoading && rules?.length === 0 && !showBuilder && (
        <Box
          sx={{
            p: 6,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <BoltIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No automations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first automation to streamline your workflow.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowBuilder(true)}
          >
            Create Automation
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rules?.map((rule) => (
          <Card key={rule.id} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: expandedId === rule.id ? 0 : undefined }}>
              {/* Editing view */}
              {editingRule?.id === rule.id ? (
                <AutomationBuilder
                  rule={rule}
                  onSave={handleUpdate}
                  onCancel={() => setEditingRule(null)}
                />
              ) : (
                <>
                  {/* Summary row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title={rule.is_enabled ? 'Enabled' : 'Disabled'}>
                      <Switch
                        checked={rule.is_enabled}
                        onChange={() => handleToggle(rule)}
                        size="small"
                        color="primary"
                      />
                    </Tooltip>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {rule.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={`When: ${rule.trigger_type.replace(/_/g, ' ')}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                        <Chip
                          label={`Then: ${rule.action_type.replace(/_/g, ' ')}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        {rule.execution_count > 0 && (
                          <Chip
                            label={`${rule.execution_count} execution${rule.execution_count !== 1 ? 's' : ''}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setShowBuilder(false)
                          setEditingRule(rule)
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={expandedId === rule.id ? 'Collapse' : 'Execution Log'}>
                      <IconButton size="small" onClick={() => toggleExpand(rule.id)}>
                        {expandedId === rule.id ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Expanded: execution log */}
                  <Collapse in={expandedId === rule.id}>
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Execution History
                      </Typography>
                      <ExecutionLog ruleId={rule.id} />
                    </Box>
                  </Collapse>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  )
}
