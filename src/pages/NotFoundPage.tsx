import { Link } from 'react-router-dom'
import { Home, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">الصفحة غير موجودة</h2>
        <p className="text-gray-500 mt-2 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة</p>
        <Link to="/dashboard">
          <Button size="lg">
            <Home className="w-5 h-5 ml-2" />
            العودة للرئيسية
            <ArrowRight className="w-5 h-5 mr-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
