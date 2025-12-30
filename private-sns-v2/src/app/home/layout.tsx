import { BottomNav } from '@/components/layout/bottom-nav'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div>
        {children}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Bottom padding to prevent content being hidden behind nav */}
      <div className="h-16" />
    </div>
  )
}
