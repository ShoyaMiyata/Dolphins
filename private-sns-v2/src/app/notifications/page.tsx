import { NotificationList } from '@/components/features/notification-list'
import { BottomNav } from '@/components/layout/bottom-nav'
import { AppHeader } from '@/components/layout/app-header'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader groupName="通知" icon={Bell} />

      <div className="max-w-md mx-auto px-4 py-4 pb-32">
        <NotificationList />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
