import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PostSkeleton() {
  return (
    <Card className="bg-white rounded-xl shadow-sm mb-3 border border-gray-100">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

          <div className="flex-1 space-y-3">
            {/* User info */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-6 pt-2">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
