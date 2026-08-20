import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="app-card mt-10">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you are looking for doesn't exist or has moved."
        actionLabel="Back to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    </div>
  )
}
