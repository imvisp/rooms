import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAgora } from '../hooks/useAgora'

// ---- iOS-style gender colors ----

const GENDER_COLORS: Record<string, string> = {
  male: '#0A84FF',
  female: '#FF375F',
  other: '#BF5AF2',
}

function Avatar({
  name,
  gender,
  isSpeaking,
  isLocal,
  delay,
}: {
  name: string
  gender: string
  isSpeaking: boolean
  isLocal?: boolean
  delay?: number
}) {
  const color = GENDER_COLORS[gender] || GENDER_COLORS.other
  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <div
      className="flex flex-col items-center gap-2 min-w-[60px] fade-in"
      style={{ animationDelay: `${(delay || 0) * 0.06}s` }}
    >
      <div
        className={[
          'w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-500',
          isSpeaking ? 'avatar-glow' : '',
        ].join(' ')}
        style={{
          backgroundColor: color + '20',
          boxShadow: isSpeaking ? `0 0 0 2px ${color}` : '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[18px] font-semibold select-none" style={{ color }}>
          {initial}
        </span>
      </div>

      <span className="text-[11px] text-[#8e8e93] max-w-[64px] truncate text-center leading-none font-medium">
        {isLocal ? 'You' : name}
      </span>

      {/* Waveform */}
      <div className="flex gap-[3px] items-center h-3">
        {isSpeaking && (
          <>
            <div className="w-[2.5px] rounded-full bg-[#30D158] apple-wave-1" />
            <div className="w-[2.5px] rounded-full bg-[#30D158] apple-wave-2" />
            <div className="w-[2.5px] rounded-full bg-[#30D158] apple-wave-3" />
          </>
        )}
      </div>
    </div>
  )
}

// ---- Room page ----

export function Room() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const {
    joinRoom,
    leaveRoom,
    toggleMic,
    resumeAudio,
    isConnected,
    isMuted,
    remoteParticipants,
    participantCount,
    maxParticipants,
    error,
  } = useAgora()
  const [copied, setCopied] = useState(false)
  const [pressed, setPressed] = useState(false)
  const hasJoined = useRef(false)

  useEffect(() => {
    if (code && !hasJoined.current) {
      hasJoined.current = true
      const userName = localStorage.getItem('rooms_name') || 'User'
      const userGender = localStorage.getItem('rooms_gender') || 'other'
      joinRoom(code, userName, userGender)
    }
    return () => { leaveRoom() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const copyCode = () => {
    const url = `${window.location.origin}/room/${code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleLeave = async () => {
    await leaveRoom()
    navigate('/')
  }

  const isSpeaking = isConnected && !isMuted
  const localName = localStorage.getItem('rooms_name') || 'You'
  const localGender = localStorage.getItem('rooms_gender') || 'other'

  const handleSpeakClick = async () => {
    if (!isConnected) return
    resumeAudio()
    setPressed(true)
    setTimeout(() => setPressed(false), 200)
    await toggleMic()
  }

  return (
    <div className="min-h-screen bg-black flex flex-col select-none">

      {/* Navigation bar — iOS style */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4 fade-in">
        <button
          onClick={handleLeave}
          className="text-[#0A84FF] text-[17px] font-normal flex items-center gap-1 active:opacity-50 transition-opacity"
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
            <path d="M10.586 0.586a2 2 0 0 1 2.828 2.828L5.828 10l7.586 7.586a2 2 0 1 1-2.828 2.828l-9-9a2 2 0 0 1 0-2.828l9-9z" />
          </svg>
          Back
        </button>

        <button
          onClick={copyCode}
          className="flex items-center gap-2 bg-[#1c1c1e] rounded-full px-4 py-[7px] active:bg-[#2c2c2e] transition-colors"
        >
          <span className="text-white font-mono font-semibold tracking-[0.15em] text-[14px]">{code}</span>
          <span className="text-[#0A84FF] text-[13px] font-medium">
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>

        <span className="text-[#8e8e93] text-[15px] tabular-nums font-medium">
          {participantCount}/{maxParticipants}
        </span>
      </div>

      {/* Thin separator */}
      <div className="apple-separator mx-4" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-8">

        {/* Avatars */}
        {isConnected && !error && (
          <div className="flex items-start gap-5 justify-center flex-wrap fade-in fade-in-delay-1">
            <Avatar
              name={localName}
              gender={localGender}
              isSpeaking={isSpeaking}
              isLocal
              delay={0}
            />
            {remoteParticipants.map((p, i) => (
              <Avatar
                key={String(p.uid)}
                name={p.name}
                gender={p.gender}
                isSpeaking={p.isSpeaking}
                delay={i + 1}
              />
            ))}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-center w-full fade-in fade-in-delay-2">
          {!isConnected && !error && (
            <div className="flex items-center gap-2">
              <div className="w-[18px] h-[18px] border-2 border-[#48484a] border-t-[#8e8e93] rounded-full animate-spin" />
              <p className="text-[#8e8e93] text-[15px]">Connecting</p>
            </div>
          )}
          {error && (
            <div className="bg-[#1c1c1e] rounded-2xl px-5 py-4 text-[15px] text-center leading-relaxed space-y-3 max-w-xs w-full">
              <p className="text-[#FF453A] whitespace-pre-line">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="text-[13px] text-[#0A84FF] font-medium active:opacity-50 transition-opacity"
              >
                Go Back
              </button>
            </div>
          )}
          {isConnected && !error && (
            <p className="text-[#8e8e93] text-[15px]">
              {remoteParticipants.length === 0
                ? 'Waiting for others\u2026'
                : `${remoteParticipants.length} other${remoteParticipants.length > 1 ? 's' : ''} in room`}
            </p>
          )}
        </div>

        {/* Mic Button — Apple Siri style */}
        <div className="relative fade-in fade-in-delay-3">
          {isSpeaking && (
            <>
              <div className="siri-ring" />
              <div className="siri-ring" />
              <div className="siri-ring" />
            </>
          )}

          <button
            onClick={handleSpeakClick}
            disabled={!isConnected}
            className={`mic-button ${!isConnected ? '' : isSpeaking ? 'speaking' : 'idle'}`}
            style={{
              transform: pressed ? 'scale(0.9)' : 'scale(1)',
            }}
          >
            {isSpeaking ? (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="#30D158" />
                <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#30D158" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="19" x2="12" y2="22" stroke="#30D158" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="22" x2="16" y2="22" stroke="#30D158" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="#48484a" />
                <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke="#48484a" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="19" x2="12" y2="22" stroke="#48484a" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="22" x2="16" y2="22" stroke="#48484a" strokeWidth="2" strokeLinecap="round" />
                <line x1="4" y1="4" x2="20" y2="20" stroke="#636366" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-[#48484a] text-[15px] fade-in fade-in-delay-4">
          {isConnected ? (isSpeaking ? 'Tap to mute' : 'Tap to speak') : ''}
        </p>
      </div>

      {/* Bottom hint */}
      <div className="px-6 pb-10 text-center fade-in fade-in-delay-5">
        <p className="text-[#38383a] text-[13px]">
          Share code <span className="font-mono text-[#48484a] font-semibold">{code}</span> to invite others
        </p>
      </div>
    </div>
  )
}
