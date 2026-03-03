import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <h1 className="text-[6rem] font-extrabold opacity-20 mb-2 leading-none">
        404
      </h1>
      <h2 className="text-xl font-semibold text-text-primary mb-1">
        Page not found
      </h2>
      <p className="text-sm text-text-secondary mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-2 justify-center">
        <Button variant="primary" onClick={() => navigate('/')}>
          Go Home
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  )
}
