import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng'
import { useState, useRef, useCallback } from 'react'

AgoraRTC.setLogLevel(4)

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''
const MAX_PARTICIPANTS = 6

// ---- UID encoding: "Name..m..x9k2" ----

function createUid(name: string, gender: string): string {
  const safeName = name.trim().slice(0, 20) || 'User'
  const g = gender === 'male' ? 'm' : gender === 'female' ? 'f' : 'o'
  const rand = Math.random().toString(36).slice(2, 6)
  return `${safeName}..${g}..${rand}`
}

function parseUid(uid: UID): { name: string; gender: string } {
  const str = String(uid)
  const parts = str.split('..')
  if (parts.length >= 3) {
    const genderMap: Record<string, string> = { m: 'male', f: 'female', o: 'other' }
    return {
      name: parts.slice(0, -2).join('..'),
      gender: genderMap[parts[parts.length - 2]] || 'other',
    }
  }
  // Fallback for numeric UIDs from other clients
  return { name: `User ${str.slice(-4)}`, gender: 'other' }
}

// ---- Types ----

export interface RemoteParticipant {
  uid: UID
  name: string
  gender: string
  isSpeaking: boolean
}

// ---- Hook ----

export function useAgora() {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const trackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const leftRef = useRef(false)
  const audioTracksRef = useRef<Map<string, IRemoteAudioTrack>>(new Map())
  const deviceHandlerRef = useRef<(() => void) | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [speakingUids, setSpeakingUids] = useState<Set<UID>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const syncRemoteUsers = useCallback(() => {
    if (clientRef.current) {
      setRemoteUsers([...clientRef.current.remoteUsers])
    }
  }, [])

  const subscribeToUser = useCallback(async (user: IAgoraRTCRemoteUser) => {
    const client = clientRef.current
    if (!client) return
    try {
      await client.subscribe(user, 'audio')
      if (user.audioTrack) {
        user.audioTrack.play()
        audioTracksRef.current.set(String(user.uid), user.audioTrack)
      }
    } catch (e) {
      console.warn('[Rooms] audio subscribe failed for', user.uid, e)
    }
  }, [])

  // Retry play() on all remote tracks — fixes browser autoplay blocks
  const resumeAudio = useCallback(() => {
    audioTracksRef.current.forEach((track) => {
      try { track.play() } catch { /* ok */ }
    })
  }, [])

  const joinRoom = useCallback(
    async (roomCode: string, userName: string, userGender: string) => {
      if (!APP_ID) {
        setError('Agora App ID not set. Add VITE_AGORA_APP_ID to your .env file.')
        return
      }
      if (clientRef.current) return
      leftRef.current = false

      try {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        client.on('user-joined', () => syncRemoteUsers())

        client.on('user-left', (user) => {
          audioTracksRef.current.delete(String(user.uid))
          syncRemoteUsers()
        })

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'audio') {
            audioTracksRef.current.delete(String(user.uid))
          }
          syncRemoteUsers()
        })

        client.on('user-published', async (user, mediaType) => {
          if (mediaType === 'audio') await subscribeToUser(user)
          syncRemoteUsers()
        })

        client.enableAudioVolumeIndicator()
        client.on('volume-indicator', (volumes) => {
          setSpeakingUids(new Set(volumes.filter(v => v.level > 8).map(v => v.uid)))
        })

        // Join with encoded UID so other users can see our name + gender
        const uid = createUid(userName, userGender)
        await client.join(APP_ID, roomCode, null, uid)
        if (leftRef.current) { client.leave(); return }

        // Subscribe to users already in the room (user-published won't fire for them)
        for (const user of client.remoteUsers) {
          if (user.hasAudio) await subscribeToUser(user)
        }
        syncRemoteUsers()

        const track = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true,  // Acoustic Echo Cancellation
          ANS: true,  // Automatic Noise Suppression
          AGC: true,  // Automatic Gain Control
        })
        trackRef.current = track
        await track.setMuted(true)
        await client.publish([track])

        if (leftRef.current) return

        // Handle audio device changes (buds connect/disconnect)
        const onDeviceChange = async () => {
          // Re-play remote tracks on new output device
          audioTracksRef.current.forEach((track) => {
            try { track.play() } catch { /* ok */ }
          })
          // Recreate local mic track on new input device
          if (trackRef.current && clientRef.current) {
            try {
              const wasMuted = trackRef.current.muted
              await clientRef.current.unpublish(trackRef.current)
              trackRef.current.close()
              const newTrack = await AgoraRTC.createMicrophoneAudioTrack()
              trackRef.current = newTrack
              await newTrack.setMuted(wasMuted)
              await clientRef.current.publish([newTrack])
            } catch { /* ok */ }
          }
        }
        deviceHandlerRef.current = onDeviceChange
        navigator.mediaDevices.addEventListener('devicechange', onDeviceChange)

        setIsConnected(true)
        setError(null)
        syncRemoteUsers()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        clientRef.current = null
        if (msg.includes('OPERATION_ABORTED') || leftRef.current) return

        if (msg.includes('CAN_NOT_GET_GATEWAY_SERVER')) {
          setError(
            'Your Agora project has App Certificate enabled.\n\n' +
            'Fix: go to console.agora.io → your project → App Certificate → click Disable → reload this page.',
          )
        } else if (msg.includes('permission') || msg.includes('NotAllowedError')) {
          setError('Microphone access denied. Allow microphone in browser settings and reload.')
        } else {
          setError(msg)
        }
      }
    },
    [syncRemoteUsers, subscribeToUser],
  )

  const leaveRoom = useCallback(async () => {
    if (leftRef.current) return
    leftRef.current = true
    if (deviceHandlerRef.current) {
      navigator.mediaDevices.removeEventListener('devicechange', deviceHandlerRef.current)
      deviceHandlerRef.current = null
    }
    trackRef.current?.close()
    trackRef.current = null
    await clientRef.current?.leave()
    clientRef.current = null
    audioTracksRef.current.clear()
    setIsConnected(false)
    setIsMuted(true)
    setRemoteUsers([])
    setSpeakingUids(new Set())
  }, [])

  const toggleMic = useCallback(async () => {
    if (!trackRef.current || !isConnected) return
    const newMuted = !isMuted
    await trackRef.current.setMuted(newMuted)
    setIsMuted(newMuted)
  }, [isMuted, isConnected])

  const remoteParticipants: RemoteParticipant[] = remoteUsers.map(u => {
    const { name, gender } = parseUid(u.uid)
    return { uid: u.uid, name, gender, isSpeaking: speakingUids.has(u.uid) }
  })

  return {
    joinRoom,
    leaveRoom,
    toggleMic,
    resumeAudio,
    isConnected,
    isMuted,
    remoteParticipants,
    participantCount: remoteUsers.length + 1,
    maxParticipants: MAX_PARTICIPANTS,
    error,
  }
}
