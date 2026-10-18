import { useCallback, useEffect, useRef } from 'react'

export function useAudioManager(enabled: boolean, preloadSources: readonly string[] = []) {
  const active = useRef<HTMLAudioElement | null>(null)
  const cache = useRef(new Map<string, HTMLAudioElement>())

  const getAudio = useCallback((source: string) => {
    const cached = cache.current.get(source)
    if (cached) return cached

    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = source
    audio.load()
    cache.current.set(source, audio)
    return audio
  }, [])

  const stop = useCallback(() => {
    if (!active.current) return
    active.current.pause()
    active.current.currentTime = 0
    active.current = null
  }, [])

  const play = useCallback((source: string) => {
    if (!enabled) return
    stop()
    const audio = getAudio(source)
    audio.currentTime = 0
    active.current = audio
    audio.play().catch(() => undefined)
    audio.addEventListener('ended', () => {
      if (active.current === audio) active.current = null
    }, { once: true })
  }, [enabled, getAudio, stop])

  useEffect(() => {
    preloadSources.forEach(getAudio)
  }, [getAudio, preloadSources])

  useEffect(() => () => stop(), [stop])
  useEffect(() => { if (!enabled) stop() }, [enabled, stop])

  return { play, stop }
}
