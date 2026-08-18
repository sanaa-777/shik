import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Phone, MapPin, Shield, Camera, Check, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth.store'
import { doc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '@/config/firebase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const profileSchema = z.object({
  displayName: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { profile, user } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || '',
      email: profile?.email || '',
      address: profile?.address || '',
    },
  })

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast.error('اختر صورة أقل من 5MB')
      return
    }
    setUploadingAvatar(true)
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}/profile`)
      await uploadBytes(avatarRef, file, { contentType: file.type })
      const avatar = await getDownloadURL(avatarRef)
      await updateDoc(doc(db, 'users', user.uid), { avatar, updatedAt: new Date() })
      toast.success('تم تحديث الصورة الشخصية')
    } catch {
      toast.error('تعذر رفع الصورة الشخصية')
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: data.displayName,
        email: data.email || null,
        address: data.address || null,
        updatedAt: new Date(),
      })
      toast.success('تم تحديث الملف الشخصي')
      setEditing(false)
    } catch {
      toast.error('حدث خطأ أثناء التحديث')
    }
  }

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
        <p className="text-gray-500 mt-1">إدارة معلوماتك الشخصية</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary-600" />
              )}
            </div>
            <label className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 cursor-pointer" aria-label="تغيير الصورة الشخصية">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.displayName}</h2>
            <p className="text-gray-500">{profile.phone}</p>
            <div className="flex items-center gap-2 mt-2">
              {profile.kyc.verified ? (
                <span className="flex items-center gap-1 text-sm text-success-600">
                  <Check className="w-4 h-4" />
                  تم التحقق
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  لم يتم التحقق
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>المعلومات الشخصية</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? 'إلغاء' : 'تعديل'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="الاسم الكامل"
                icon={<User className="w-5 h-5" />}
                error={errors.displayName?.message}
                {...register('displayName')}
              />
              <Input
                label="البريد الإلكتروني"
                type="email"
                icon={<Mail className="w-5 h-5" />}
                error={errors.email?.message}
                {...register('email')}
                dir="ltr"
                textAlign="right"
              />
              <Input
                label="العنوان"
                icon={<MapPin className="w-5 h-5" />}
                {...register('address')}
              />
              <div className="flex gap-3">
                <Button type="submit" loading={isSubmitting}>حفظ التغييرات</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>إلغاء</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">الاسم</p>
                  <p className="font-medium">{profile.displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">رقم الهاتف</p>
                  <p className="font-medium" dir="ltr">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="font-medium" dir="ltr">{profile.email || 'غير محدد'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">العنوان</p>
                  <p className="font-medium">{profile.address || 'غير محدد'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            الأمان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">كلمة المرور</p>
              <p className="text-sm text-gray-500">آخر تغيير: منذ 30 يوم</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/change-password')}>تغيير</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">المصادقة الثنائية</p>
              <p className="text-sm text-gray-500">حماية إضافية لحسابك</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast('المصادقة الثنائية ستكون متاحة بعد ربط مزود SMS')}>تفعيل</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
