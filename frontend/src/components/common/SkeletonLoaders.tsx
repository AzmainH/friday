import { cn } from '@/lib/cn'

function Bone({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-[--radius-sm]', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-surface-100 rounded-[--radius-lg] shadow-sm border border-surface-200 p-5">
      <Bone className="h-6 w-3/5 mb-2" />
      <Bone className="h-4 w-2/5 mb-4" />
      <Bone className="h-20 w-full rounded-[--radius-sm]" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div>
      <div className="flex gap-3 mb-2">
        <Bone className="h-7 w-1/5" />
        <Bone className="h-7 w-[30%]" />
        <Bone className="h-7 w-1/4" />
        <Bone className="h-7 w-1/4" />
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3 mb-1">
          <Bone className="h-6 w-1/5" />
          <Bone className="h-6 w-[30%]" />
          <Bone className="h-6 w-1/4" />
          <Bone className="h-6 w-1/4" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonList() {
  return (
    <div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <Bone className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1">
            <Bone className="h-5 w-[70%] mb-1" />
            <Bone className="h-4 w-[45%]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div>
      <Bone className="h-8 w-1/2 mb-2" />
      <Bone className="h-5 w-[30%] mb-5" />
      <Bone className="h-28 w-full rounded-[--radius-sm] mb-4" />
      <Bone className="h-4 w-full mb-1" />
      <Bone className="h-4 w-full mb-1" />
      <Bone className="h-4 w-4/5" />
    </div>
  )
}
