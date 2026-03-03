import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import client from '@/api/client'
import type { CursorPage } from '@/types/api'

/** Generic list hook with cursor pagination */
export function useCursorList<T>(
  key: string[],
  url: string,
  params?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<CursorPage<T>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CursorPage<T>>({
    queryKey: [...key, params],
    queryFn: async () => {
      const { data } = await client.get(url, { params })
      return data
    },
    ...options,
  })
}

/** Generic detail hook */
export function useDetail<T>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await client.get(url)
      return data
    },
    ...options,
  })
}

/** Generic create mutation */
export function useCreateMutation<TInput, TOutput = unknown>(
  url: string,
  invalidateKeys: string[][],
) {
  const qc = useQueryClient()
  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(url, body)
      return data
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
    },
  })
}

/** Generic update mutation */
export function useUpdateMutation<TInput, TOutput = unknown>(
  urlFn: (id: string) => string,
  invalidateKeys: string[][],
) {
  const qc = useQueryClient()
  return useMutation<TOutput, Error, { id: string; body: TInput }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(urlFn(id), body)
      return data
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
    },
  })
}

/** Generic delete mutation */
export function useDeleteMutation(
  urlFn: (id: string) => string,
  invalidateKeys: string[][],
) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await client.delete(urlFn(id))
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }))
    },
  })
}
