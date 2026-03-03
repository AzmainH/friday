import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Upload, Search, Download, Trash2, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
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

const FILE_TYPE_CHIP: Record<string, string> = {
  image: 'bg-blue-100 text-blue-700 border-blue-200',
  pdf: 'bg-red-100 text-red-700 border-red-200',
  spreadsheet: 'bg-green-100 text-green-700 border-green-200',
  csv: 'bg-green-100 text-green-700 border-green-200',
}

function getFileTypeChipClass(ct: string): string {
  if (ct.startsWith('image/')) return FILE_TYPE_CHIP.image
  if (ct.includes('pdf')) return FILE_TYPE_CHIP.pdf
  if (ct.includes('spreadsheet') || ct.includes('csv')) return FILE_TYPE_CHIP.spreadsheet
  return 'bg-surface-100 text-text-secondary border-surface-200'
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Documents</h1>
        <Button leftIcon={<Upload className="h-4 w-4" />}>Upload</Button>
      </div>

      {/* Search */}
      <div className="relative w-80 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-surface-200 bg-white pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-200 border-t-primary-500" />
        </div>
      ) : (
        <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">File</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Size</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Uploaded By</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Issue</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center border-t border-surface-200">
                    <FileText className="h-12 w-12 text-surface-300 mx-auto mb-2" />
                    <p className="text-text-secondary">No documents found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-2 border-t border-surface-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-text-secondary flex-shrink-0" />
                        <span>{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-t border-surface-200">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                          getFileTypeChipClass(doc.content_type),
                        )}
                      >
                        {doc.content_type.split('/').pop()}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-t border-surface-200">{formatFileSize(doc.size)}</td>
                    <td className="px-4 py-2 border-t border-surface-200">{doc.uploaded_by_name}</td>
                    <td className="px-4 py-2 border-t border-surface-200">{formatDateTime(doc.created_at)}</td>
                    <td className="px-4 py-2 border-t border-surface-200">
                      {doc.issue_key && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-text-secondary">
                          {doc.issue_key}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-t border-surface-200 text-right">
                      <button type="button" className="p-1 rounded hover:bg-surface-100 transition-colors text-text-secondary" title="Download">
                        <Download className="h-4 w-4" />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-red-50 transition-colors text-red-500 ml-1" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
