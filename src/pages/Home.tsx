import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type Gender = 'male' | 'female' | 'other'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState(() => localStorage.getItem('rooms_name') || '')
  const [gender, setGender] = useState<Gender>(
    () => (localStorage.getItem('rooms_gender') as Gender) || 'male',
  )
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { localStorage.setItem('rooms_name', name) }, [name])
  useEffect(() => { localStorage.setItem('rooms_gender', gender) }, [gender])

  const goToRoom = (roomCode: string) => {
    if (!name.trim()) {
      setError('Enter your name first')
      return
    }
    navigate(`/room/${roomCode}`)
  }

  const createRoom = () => goToRoom(generateRoomCode())

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) {
      setError('Enter a 4-character room code')
      return
    }
    goToRoom(code)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[360px] space-y-8">

        {/* Logo & Title */}
        <div className="text-center space-y-2 fade-in">
          <div className="w-[72px] h-[72px] rounded-[22px] bg-[#1c1c1e] flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="#30D158" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#30D158" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="22" stroke="#30D158" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="22" x2="16" y2="22" stroke="#30D158" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-[34px] font-bold text-white tracking-tight" style={{ letterSpacing: '-0.5px' }}>
            Rooms
          </h1>
          <p className="text-[#8e8e93] text-[15px]">Talk with anyone, anywhere</p>
        </div>

        {/* Name Input */}
        <div className="space-y-3 fade-in fade-in-delay-1">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value.slice(0, 20)); setError('') }}
            placeholder="Your name"
            className="apple-input text-center"
            maxLength={20}
          />

          {/* Gender - iOS Segmented Control */}
          <div className="segment-control">
            {(['male', 'female', 'other'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={gender === g ? 'active' : ''}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[#FF453A] text-[13px] text-center fade-in">{error}</p>
        )}

        {/* Create Room */}
        <div className="fade-in fade-in-delay-2">
          <button onClick={createRoom} className="apple-btn-primary">
            Create Room
          </button>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 fade-in fade-in-delay-3">
          <div className="flex-1 apple-separator" />
          <span className="text-[#48484a] text-[13px] font-medium uppercase tracking-widest">or join</span>
          <div className="flex-1 apple-separator" />
        </div>

        {/* Join Room */}
        <div className="space-y-3 fade-in fade-in-delay-4">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4))
              setError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            placeholder="XXXX"
            className="apple-input text-center font-mono text-[28px] tracking-[0.35em] uppercase"
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={joinRoom}
            disabled={joinCode.length < 4}
            className="apple-btn-secondary"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  )
}
