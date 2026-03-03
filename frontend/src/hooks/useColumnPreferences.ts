import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_COLUMNS } from '@/hooks/useTableColumns'

interface ColumnPreferencesState {
  /** IDs of currently visible columns. */
  visibleColumns: string[]
  /** Ordered list of column IDs (determines display order). */
  columnOrder: string[]

  /** Toggle a column's visibility on/off. */
  toggleColumn: (columnId: string) => void
  /** Replace the column order array (e.g. after drag-and-drop reorder). */
  reorderColumns: (newOrder: string[]) => void
  /** Reset visibility and order back to defaults. */
  resetToDefaults: () => void
}

const defaultVisible = [...DEFAULT_COLUMNS] as string[]
const defaultOrder = [...DEFAULT_COLUMNS] as string[]

export const useColumnPreferences = create<ColumnPreferencesState>()(
  persist(
    (set) => ({
      visibleColumns: defaultVisible,
      columnOrder: defaultOrder,

      toggleColumn: (columnId: string) =>
        set((state) => {
          const isVisible = state.visibleColumns.includes(columnId)
          return {
            visibleColumns: isVisible
              ? state.visibleColumns.filter((id) => id !== columnId)
              : [...state.visibleColumns, columnId],
          }
        }),

      reorderColumns: (newOrder: string[]) =>
        set({ columnOrder: newOrder }),

      resetToDefaults: () =>
        set({
          visibleColumns: defaultVisible,
          columnOrder: defaultOrder,
        }),
    }),
    {
      name: 'friday-column-preferences',
    },
  ),
)
