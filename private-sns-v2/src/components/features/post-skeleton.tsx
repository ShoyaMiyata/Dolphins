import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PostSkeleton() {
  return (
    <Card className="bg-white rounded-xl shadow-sm mb-3 border border-blue-100">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-12 rounded-full" />
              <Skeleton className="h-8 w-12 rounded-full" />
              <Skeleton className="h-8 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
