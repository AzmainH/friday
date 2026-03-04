import { useState } from 'react'
import { useWebhookLogs } from '@/hooks/useIntegrations'
import type { WebhookLog } from '@/hooks/useIntegrations'
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface WebhookLogsProps {
  integrationId: string
}

function LogRow({ log }: { log: WebhookLog }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="hover:bg-surface-50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-2 border-t border-surface-200 text-sm">
          {new Date(log.created_at).toLocaleString()}
        </td>
        <td className="px-4 py-2 border-t border-surface-200 text-sm">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-text-secondary">
            {log.event_type}
          </span>
        </td>
        <td className="px-4 py-2 border-t border-surface-200 text-sm text-center">
          {log.status_code ?? '--'}
        </td>
        <td className="px-4 py-2 border-t border-surface-200 text-sm text-center">
          {log.success ? (
            <CheckCircle className="h-4 w-4 text-green-500 inline" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500 inline" />
          )}
        </td>
        <td className="px-4 py-2 border-t border-surface-200 text-sm text-center">
          {expanded ? (
            <ChevronUp className="h-4 w-4 inline text-text-tertiary" />
          ) : (
            <ChevronDown className="h-4 w-4 inline text-text-tertiary" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-4 py-3 bg-surface-50 border-t border-surface-200">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase mb-1">Payload</p>
                <pre className="text-xs text-text-secondary bg-white dark:bg-dark-surface border border-surface-200 rounded-md p-3 overflow-x-auto max-h-48">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(log.payload_json), null, 2)
                    } catch {
                      return log.payload_json
                    }
                  })()}
                </pre>
              </div>
              {log.response_body && (
                <div>
                  <p className="text-xs font-semibold text-text-tertiary uppercase mb-1">Response</p>
                  <pre className="text-xs text-text-secondary bg-white dark:bg-dark-surface border border-surface-200 rounded-md p-3 overflow-x-auto max-h-48">
                    {log.response_body}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function WebhookLogs({ integrationId }: WebhookLogsProps) {
  const { data: logs, isLoading, error } = useWebhookLogs(integrationId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-surface-200 border-t-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
        Failed to load webhook logs.
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-text-secondary">
        No delivery logs yet. Send a test webhook to see results here.
      </div>
    )
  }

  return (
    <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
              Timestamp
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
              Event
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">
              Status
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase">
              Result
            </th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-text-secondary uppercase w-10" />
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
