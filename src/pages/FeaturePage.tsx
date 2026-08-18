import { ArrowRight, FileText, Headphones, Home, LockKeyhole, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent } from '@/components/ui'

type FeatureKind = 'deposit' | 'withdraw' | 'change-password' | 'support' | 'terms' | 'privacy'

const content: Record<FeatureKind, { title: string; description: string; icon: typeof Wallet; body: string }> = {
  deposit: {
    title: 'إيداع الأموال',
    description: 'أضف الأموال إلى حسابك بطريقة آمنة.',
    icon: Wallet,
    body: 'لإيداع الأموال، تواصل مع أقرب وكيل معتمد أو استخدم بيانات حسابك البنكي المعتمدة. ستظهر العملية في سجل المعاملات بعد تأكيدها.',
  },
  withdraw: {
    title: 'سحب الأموال',
    description: 'اسحب الأموال من حسابك بطريقة آمنة.',
    icon: Wallet,
    body: 'يمكنك تنفيذ السحب من خلال وكيل معتمد. تحقّق من بيانات العملية قبل التأكيد واحتفظ بإيصال المعاملة.',
  },
  'change-password': {
    title: 'تغيير كلمة المرور',
    description: 'حافظ على أمان حسابك بتحديث كلمة المرور دوريًا.',
    icon: LockKeyhole,
    body: 'لأسباب أمنية، سيتم إرسال رابط آمن إلى رقم هاتفك المسجل لإتمام تغيير كلمة المرور.',
  },
  support: {
    title: 'الدعم والمساعدة',
    description: 'نحن هنا لمساعدتك في أي وقت.',
    icon: Headphones,
    body: 'للحصول على المساعدة، تواصل مع فريق الدعم عبر قنوات Shik الرسمية، واذكر رقم المعاملة أو الحساب دون مشاركة كلمة المرور.',
  },
  terms: {
    title: 'الشروط والأحكام',
    description: 'القواعد المنظمة لاستخدام خدمات Shik.',
    icon: FileText,
    body: 'باستخدام Shik، أنت توافق على استخدام الخدمة بشكل قانوني، والحفاظ على سرية بيانات الدخول، والتحقق من تفاصيل المعاملات قبل تنفيذها.',
  },
  privacy: {
    title: 'سياسة الخصوصية',
    description: 'كيف نحافظ على بياناتك ونستخدمها.',
    icon: LockKeyhole,
    body: 'نستخدم بياناتك لتقديم الخدمات المصرفية وتحسين الأمان. لا تشارك بيانات الدخول أو رموز التحقق مع أي شخص.',
  },
}

export function FeaturePage({ kind }: { kind: FeatureKind }) {
  const navigate = useNavigate()
  const item = content[kind]
  const Icon = item.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} aria-label="العودة">
          <ArrowRight className="w-5 h-5 ml-1" />
          العودة
        </Button>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-5">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
          <p className="mt-2 text-gray-500">{item.description}</p>
          <p className="mt-6 text-gray-700 leading-8">{item.body}</p>
          <Button className="mt-8" onClick={() => navigate('/dashboard')}>
            <Home className="w-5 h-5 ml-2" />
            العودة إلى لوحة التحكم
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
