import { PostForm } from '@/components/features/post-form'
import { Timeline } from '@/components/features/timeline'
import { AppHeader } from '@/components/layout/app-header'

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="container max-w-md mx-auto pb-32 px-4">
        {/* Post Form */}
        <div className="mb-4 bg-white rounded-xl shadow-md border border-blue-100 mt-4 hover:shadow-lg transition-shadow">
          <PostForm />
        </div>

        {/* Timeline */}
        <Timeline />
      </main>
    </div>
  )
}
