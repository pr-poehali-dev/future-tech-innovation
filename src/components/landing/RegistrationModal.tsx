import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

interface RegistrationModalProps {
  open: boolean
  onClose: () => void
}

type Role = "author" | "investor" | null
type Step = "role" | "form" | "success"

export default function RegistrationModal({ open, onClose }: RegistrationModalProps) {
  const [step, setStep] = useState<Step>("role")
  const [role, setRole] = useState<Role>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [inn, setInn] = useState("")
  const [innError, setInnError] = useState("")
  const [loading, setLoading] = useState(false)

  const validateInn = (value: string) => {
    if (value.length !== 10 && value.length !== 12) return "ИНН должен содержать 10 или 12 цифр"
    return ""
  }

  const handleRoleSelect = (r: Role) => {
    setRole(r)
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (role === "investor") {
      const error = validateInn(inn)
      if (error) { setInnError(error); return }
    }
    setLoading(true)
    await new Promise(res => setTimeout(res, 1000))
    setLoading(false)
    setStep("success")
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep("role")
      setRole(null)
      setName("")
      setEmail("")
      setInn("")
      setInnError("")
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a0a] border border-neutral-800 text-white max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">Регистрация</DialogTitle>
        <AnimatePresence mode="wait">
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="p-8"
            >
              <h2 className="text-2xl font-bold mb-2">Кто вы?</h2>
              <p className="text-neutral-400 text-sm mb-8">Выберите роль, чтобы мы настроили доступ под вас</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRoleSelect("author")}
                  className="group border border-neutral-800 hover:border-[#FF4D00] rounded-xl p-6 text-left transition-all hover:bg-[#FF4D00]/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 group-hover:bg-[#FF4D00]/10 flex items-center justify-center mb-4 transition-colors">
                    <Icon name="Lightbulb" size={20} className="text-neutral-400 group-hover:text-[#FF4D00]" />
                  </div>
                  <p className="font-semibold text-white mb-1">Автор идеи</p>
                  <p className="text-neutral-500 text-xs">У меня есть идея, ищу финансирование</p>
                </button>
                <button
                  onClick={() => handleRoleSelect("investor")}
                  className="group border border-neutral-800 hover:border-[#FF4D00] rounded-xl p-6 text-left transition-all hover:bg-[#FF4D00]/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 group-hover:bg-[#FF4D00]/10 flex items-center justify-center mb-4 transition-colors">
                    <Icon name="TrendingUp" size={20} className="text-neutral-400 group-hover:text-[#FF4D00]" />
                  </div>
                  <p className="font-semibold text-white mb-1">Инвестор</p>
                  <p className="text-neutral-500 text-xs">Ищу проекты для вложений</p>
                </button>
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="p-8"
            >
              <button
                onClick={() => setStep("role")}
                className="flex items-center gap-1 text-neutral-500 hover:text-white text-sm mb-6 transition-colors"
              >
                <Icon name="ArrowLeft" size={14} />
                Назад
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-[#FF4D00]/10 flex items-center justify-center">
                  <Icon name={role === "author" ? "Lightbulb" : "TrendingUp"} size={12} className="text-[#FF4D00]" />
                </div>
                <span className="text-xs text-[#FF4D00] font-medium">
                  {role === "author" ? "Автор идеи" : "Инвестор"}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-6">Расскажите о себе</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-neutral-400 text-sm mb-2 block">Ваше имя</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    required
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-[#FF4D00]"
                  />
                </div>
                <div>
                  <Label className="text-neutral-400 text-sm mb-2 block">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ivan@example.com"
                    required
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-[#FF4D00]"
                  />
                </div>
                {role === "investor" && (
                  <div>
                    <Label className="text-neutral-400 text-sm mb-2 block">
                      ИНН организации
                      <span className="ml-1 text-neutral-600">(для верификации)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={inn}
                        onChange={e => { setInn(e.target.value.replace(/\D/g, "")); setInnError("") }}
                        placeholder="1234567890"
                        maxLength={12}
                        required
                        className={`bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-[#FF4D00] pr-10 ${innError ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Icon name="Building2" size={16} className="text-neutral-600" />
                      </div>
                    </div>
                    {innError ? (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <Icon name="AlertCircle" size={12} />{innError}
                      </p>
                    ) : (
                      <p className="text-neutral-600 text-xs mt-1">10 цифр для юр. лица, 12 — для ИП</p>
                    )}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF4D00] hover:bg-[#e04400] text-white mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      Отправляем...
                    </span>
                  ) : "Отправить заявку"}
                </Button>
                <p className="text-neutral-600 text-xs text-center">
                  Нажимая кнопку, вы соглашаетесь с условиями платформы
                </p>
              </form>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#FF4D00]/10 flex items-center justify-center mx-auto mb-6">
                <Icon name="CheckCircle" size={32} className="text-[#FF4D00]" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Заявка принята!</h2>
              <p className="text-neutral-400 text-sm mb-2">
                Мы свяжемся с вами на <span className="text-white">{email}</span> в ближайшее время.
              </p>
              {role === "investor" && (
                <p className="text-neutral-600 text-xs mb-6">ИНН {inn} будет проверен нашей командой.</p>
              )}
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                Закрыть
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}