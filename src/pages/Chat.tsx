import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

const CHAT_URL = "https://functions.poehali.dev/35b66bf4-ae09-4e90-96b7-a71a7318a46b"

interface User { id: number; name: string; email: string; role: string }
interface Message { id: number; text: string; created_at: string; sender: { id: number; name: string; role: string } }
interface Conversation {
  id: number
  author: { id: number; name: string }
  investor: { id: number; name: string }
  last_message: string | null
  last_at: string | null
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("chat_user")
    return saved ? JSON.parse(saved) : null
  })
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (user) loadConversations()
  }, [user])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id)
      pollRef.current = setInterval(() => loadMessages(activeConv.id), 3000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadConversations = async () => {
    if (!user) return
    const res = await fetch(`${CHAT_URL}?action=conversations&user_id=${user.id}`)
    const data = await res.json()
    setConversations(Array.isArray(data) ? data : [])
  }

  const loadMessages = async (convId: number) => {
    const res = await fetch(`${CHAT_URL}?action=messages&conversation_id=${convId}`)
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", name: loginEmail.split("@")[0], email: loginEmail, role: "author" })
    })
    const data = await res.json()
    if (data.id) {
      localStorage.setItem("chat_user", JSON.stringify(data))
      setUser(data)
    }
    setLoginLoading(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !activeConv || !user) return
    setSending(true)
    await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_message", conversation_id: activeConv.id, sender_id: user.id, text })
    })
    setText("")
    await loadMessages(activeConv.id)
    await loadConversations()
    setSending(false)
  }

  const getCompanion = (conv: Conversation) => {
    if (!user) return null
    return user.id === conv.author.id ? conv.investor : conv.author
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-8"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center mb-6">
            <Icon name="MessageSquare" size={24} className="text-[#FF4D00]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Войти в чат</h1>
          <p className="text-neutral-400 text-sm mb-6">Введите email, с которым вы регистрировались</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              placeholder="ivan@example.com"
              required
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600"
            />
            <Button type="submit" disabled={loginLoading} className="w-full bg-[#FF4D00] hover:bg-[#e04400] text-white">
              {loginLoading
                ? <span className="flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" />Входим...</span>
                : "Войти"
              }
            </Button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-neutral-500 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </a>
          <div className="w-8 h-8 rounded-full bg-[#FF4D00]/20 flex items-center justify-center">
            <span className="text-[#FF4D00] text-sm font-bold">{user.name[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user.name}</p>
            <p className="text-neutral-500 text-xs">{user.role === "investor" ? "Инвестор" : "Автор идеи"}</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("chat_user"); setUser(null) }}
          className="text-neutral-600 hover:text-neutral-400 text-xs transition-colors"
        >
          Выйти
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        {/* Sidebar */}
        <div className="w-72 border-r border-neutral-800 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-neutral-800">
            <p className="text-white font-semibold text-sm">Диалоги</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-neutral-600 text-sm">
                <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
                Диалогов пока нет
              </div>
            ) : (
              conversations.map(conv => {
                const companion = getCompanion(conv)
                return (
                  <button key={conv.id} onClick={() => setActiveConv(conv)}
                    className={`w-full p-4 text-left border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors ${activeConv?.id === conv.id ? "bg-neutral-800/70" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">{companion?.name[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{companion?.name}</p>
                        <p className="text-neutral-500 text-xs truncate">{conv.last_message || "Нет сообщений"}</p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{getCompanion(activeConv)?.name[0].toUpperCase()}</span>
                </div>
                <p className="text-white font-medium text-sm">{getCompanion(activeConv)?.name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map(msg => {
                    const isMe = msg.sender.id === user.id
                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${isMe ? "bg-[#FF4D00] text-white rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p className={`text-xs mt-1 ${isMe ? "text-orange-200" : "text-neutral-500"}`}>{formatTime(msg.created_at)}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-neutral-800 flex gap-2">
                <Input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600"
                />
                <Button type="submit" disabled={sending || !text.trim()} className="bg-[#FF4D00] hover:bg-[#e04400] text-white px-4">
                  <Icon name="Send" size={16} />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Icon name="MessageSquareDashed" size={48} className="text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500 text-sm">Выберите диалог слева</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
