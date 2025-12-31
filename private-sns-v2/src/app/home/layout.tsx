import { BottomNav } from '@/components/layout/bottom-nav'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Main Content */}
      {children}

      {/* Bottom Navigation */}
      <BottomNav />
    </>
  )
}
