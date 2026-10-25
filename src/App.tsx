import { useEffect, useMemo, useRef, useState } from 'react'
import { Expand, RotateCcw, Settings, Volume2, VolumeX, X } from 'lucide-react'
import { actorById, actors, cafeScenes, correctAudio, invitationAudio, invitationImages, meetLayout, originalFoods, originalImages, sceneNames, wrongAudio } from './data/originalGame'
import { assetUrl } from './data/gameData'
import { useAudioManager } from './hooks/useAudioManager'
import { useGameSave } from './hooks/useGameSave'
import type { MonsterId } from './types'

const shuffle = <T,>(items: readonly T[]): T[] => [...items].sort(() => Math.random() - 0.5)
const invitationMonsterOrder: MonsterId[] = ['troll', 'skeleton', 'witch', 'vampire', 'ghost', 'raven']
const invitationStartScene = 4
const invitationEndScene = 17
const cafeOrderMonsterByScene: Partial<Record<number, MonsterId>> = {
  26: 'witch', 28: 'ghost', 30: 'raven', 32: 'vampire', 34: 'troll', 36: 'skeleton',
}

interface InvitationRound {
  key: string
  monsterId: MonsterId
  image: string
  audio: string
}

function createInvitationRounds(): InvitationRound[] {
  const firstCycle = shuffle(actors)
  const secondCycle = shuffle(actors)
  if (secondCycle[0].id === firstCycle[firstCycle.length - 1].id) {
    const nextActor = secondCycle[1]
    secondCycle[1] = secondCycle[0]
    secondCycle[0] = nextActor
  }
  return [...firstCycle, ...secondCycle.slice(0, 5)].map((actor, index) => {
    const audio = invitationAudio[actor.id].welcome
    return { key: `${index}-${actor.id}`, monsterId: actor.id, image: invitationImages.cards[actor.id], audio }
  })
}

function App() {
  const { state, go, patch, reset } = useGameSave()
  const audio = useAudioManager(state.soundOn)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [invitationSession, setInvitationSession] = useState(0)
  const scene = state.scene >= invitationStartScene && state.scene <= invitationEndScene
    ? invitationStartScene
    : Math.min(state.scene, sceneNames.length - 1)
  const usesOriginalFrame = scene <= 42
  const next = () => go(Math.min(scene + 1, sceneNames.length - 1))

  useEffect(() => {
    if (state.scene > invitationStartScene && state.scene <= invitationEndScene) go(invitationStartScene)
  }, [state.scene, go])

  const chooseSlide = (index: number) => {
    if (index >= invitationStartScene && index <= invitationEndScene) {
      setInvitationSession((current) => current + 1)
      go(invitationStartScene)
    } else go(index)
  }

  useEffect(() => {
    let sources: string[] = []
    const cafeMonster = cafeOrderMonsterByScene[scene]
    if (scene === 2) sources = actors.map((actor) => actor.voice)
    else if (scene === 19) sources = actors.map((actor) => actor.feelingAudio)
    else if ([22, 23, 38].includes(scene)) sources = originalFoods.map((food) => food.audio)
    else if (cafeMonster) {
      sources = [
        ...Object.values(invitationAudio).map((sounds) => sounds.wrong),
        invitationAudio[cafeMonster].correct,
      ]
    } else if (scene === 39) sources = [correctAudio, wrongAudio]
    sources.forEach(audio.preload)
  }, [scene, audio.preload])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined)
    else document.documentElement.requestFullscreen().catch(() => undefined)
  }

  return (
    <main className={`game-shell ${usesOriginalFrame ? 'game-shell--source' : ''}`}>
      <nav className="project-slide-menu" aria-label="Choose a slide">
        <div className="project-slide-menu__panel">
          <span>SLIDES</span>
          <div className="project-slide-menu__grid">
            {sceneNames.map((name, index) => index > invitationStartScene && index <= invitationEndScene ? null : <button
              key={`${index}-${name}`}
              type="button"
              className={index === invitationStartScene ? 'project-slide-menu__game' : undefined}
              aria-label={index === invitationStartScene ? 'Slides 5–18: Invitation game' : `Slide ${index + 1}: ${name}`}
              aria-current={scene === index ? 'page' : undefined}
              title={index === invitationStartScene ? 'Invitation game (slides 5–18)' : name}
              onClick={() => chooseSlide(index)}
            >{index === invitationStartScene ? '5–18' : index + 1}</button>)}
          </div>
        </div>
      </nav>
      <section className="game-stage" data-scene={scene}>
        {!usesOriginalFrame && scene < sceneNames.length - 1 && (
          <div className="scene-marker" aria-label={`Scene ${scene + 1} of ${sceneNames.length}`}>
            <span>{String(scene + 1).padStart(2, '0')}</span><i /><small>{sceneNames[scene]}</small>
          </div>
        )}
        {!usesOriginalFrame && <button className="settings-trigger" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Settings /></button>}

        {scene === 0 && <CoverScene onNext={next} />}
        {scene === 1 && <HouseScene onNext={next} />}
        {scene === 2 && <MeetScene play={audio.play} onNext={() => go(3)} />}
        {scene === 3 && <SourceVideoScene source={assetUrl('assets/video/slide-05.mp4')} onNext={() => go(4)} />}
        {scene === invitationStartScene && <InvitationGame key={invitationSession} play={audio.play} preload={audio.preload} onDone={() => go(18)} />}
        {scene === 18 && <SourceVideoScene source={assetUrl('assets/video/slide-19-witch.mp4')} onNext={() => go(19)} layout="transition" />}
        {scene === 19 && <FeelingsChallenge play={audio.play} onDone={() => go(20)} />}
        {scene === 20 && <SourceVideoScene source={assetUrl('assets/video/slide-21-skeleton.mp4')} onNext={() => go(21)} layout="transition" />}
        {scene === 21 && <AutoAdvanceVideoScene source={assetUrl('assets/video/slide-22-cafe.mp4')} onDone={() => go(22)} />}
        {scene === 22 && <FoodVocabulary play={audio.play} onDone={() => go(23)} />}
        {scene === 23 && <FoodMemory play={audio.play} onDone={() => go(24)} />}
        {scene === 24 && <AutoAdvanceVideoScene source={assetUrl('assets/video/cafe/slide-25.mp4')} onDone={() => go(25)} delayMs={7_000} variant="opening" />}
        {scene === 25 && <SourceVideoScene source={assetUrl('assets/video/cafe/slide-26-witch.mp4')} onNext={() => go(26)} layout="transition" />}
        {scene === 26 && <CafeOrderGame key={scene} monsterId="witch" play={audio.play} onDone={() => go(27)} />}
        {scene === 27 && <SourceVideoScene source={assetUrl('assets/video/cafe/slide-28-ghost.mp4')} onNext={() => go(28)} layout="transition" />}
        {scene === 28 && <CafeOrderGame key={scene} monsterId="ghost" play={audio.play} onDone={() => go(29)} />}
        {scene === 29 && <SourceVideoScene source={assetUrl('assets/video/cafe/slide-30-raven.mp4')} onNext={() => go(30)} layout="transition" />}
        {scene === 30 && <CafeOrderGame key={scene} monsterId="raven" play={audio.play} onDone={() => go(31)} />}
        {scene === 31 && <SourceVideoScene source={assetUrl('assets/video/cafe/slide-32-vampire.mp4')} onNext={() => go(32)} layout="transition" />}
        {scene === 32 && <CafeOrderGame key={scene} monsterId="vampire" play={audio.play} onDone={() => go(33)} />}
        {scene === 33 && <SourceVideoScene source={assetUrl('assets/video/cafe/slide-34-troll.mp4')} onNext={() => go(34)} layout="transition" />}
        {scene === 34 && <CafeOrderGame key={scene} monsterId="troll" play={audio.play} onDone={() => go(35)} />}
        {scene === 35 && <SourceVideoScene source={assetUrl('assets/video/cafe/slide-36-skeleton.mp4')} onNext={() => go(36)} layout="transition" />}
        {scene === 36 && <CafeOrderGame key={scene} monsterId="skeleton" play={audio.play} onDone={() => go(37)} />}
        {scene === 37 && <AutoAdvanceVideoScene source={assetUrl('assets/video/cafe/slide-38-full.mp4')} onDone={() => go(38)} delayMs={60_000} variant="closing" />}
        {scene === 38 && <FoodWordSwitcher play={audio.play} onNext={() => go(39)} />}
        {scene === 39 && <DobbleGame play={audio.play} onNext={() => go(40)} />}
        {scene === 40 && <SourceVideoScene source={assetUrl('assets/video/slide-41-troll.mp4')} onNext={() => go(41)} layout="transition" />}
        {scene === 41 && <SourceVideoScene source={assetUrl('assets/video/slide-42-song.mp4')} onNext={() => go(42)} layout="song" autoPlay />}
        {scene === 42 && <FinalScene />}

        {settingsOpen && (
          <SettingsPanel
            soundOn={state.soundOn}
            onSound={() => patch({ soundOn: !state.soundOn })}
            onFullscreen={toggleFullscreen}
            onRestart={() => { reset(); setSettingsOpen(false) }}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </section>
    </main>
  )
}

function NextButton({ onClick, children = 'NEXT', disabled = false }: { onClick: () => void; children?: React.ReactNode; disabled?: boolean }) {
  return <button className="next-plaque" aria-label={typeof children === 'string' ? children : undefined} onClick={onClick} disabled={disabled}><span>{children}</span><b>›</b></button>
}

function SourceNextButton({ onClick, position }: { onClick: () => void; position: 'center' | 'right' }) {
  return <button className={`source-next source-next--${position}`} aria-label="NEXT" onClick={onClick}>
    <img src={originalImages.nextFrame} alt="" /><span>NEXT</span>
  </button>
}

function CoverScene({ onNext }: { onNext: () => void }) {
  return <div className="scene art-scene source-scene" style={{ '--scene-art': `url("${originalImages.title}")` } as React.CSSProperties}>
    <SourceNextButton onClick={onNext} position="center" />
  </div>
}

function HouseScene({ onNext }: { onNext: () => void }) {
  return <div className="scene art-scene source-scene" style={{ '--scene-art': `url("${originalImages.house}")` } as React.CSSProperties}>
    <SourceNextButton onClick={onNext} position="right" />
  </div>
}

function MeetScene({ play, onNext }: { play: (source: string) => void; onNext: () => void }) {
  return <div className="scene art-scene source-scene" style={{ '--scene-art': `url("${originalImages.house}")` } as React.CSSProperties}>
    {meetLayout.map((layout) => {
      const actor = actorById[layout.id]
      return <button
        className="source-character"
        key={actor.id}
        aria-label={`Listen to ${actor.name}`}
        onClick={() => play(actor.voice)}
        style={{
          left: `${layout.left / 10.24}%`, top: `${layout.top / 7.68}%`,
          width: `${layout.width / 10.24}%`, height: `${layout.height / 7.68}%`,
          zIndex: layout.z,
          '--image-left': `${layout.imageLeft}%`, '--image-top': `${layout.imageTop}%`,
          '--image-width': `${layout.imageWidth}%`, '--image-height': `${layout.imageHeight}%`,
        } as React.CSSProperties}
      ><img src={actor.character} alt="" decoding="async" /></button>
    })}
    <SourceNextButton onClick={onNext} position="right" />
  </div>
}

function VideoScene({ source, title, onNext }: { source: string; title: string; onNext: () => void }) {
  return <div className="scene video-scene">
    <div className="video-frame"><p>{title}</p><video src={source} controls playsInline preload="metadata" /></div>
    <NextButton onClick={onNext} />
  </div>
}

function SourceVideoScene({ source, onNext, layout = 'full', autoPlay = false }: { source: string; onNext: () => void; layout?: 'full' | 'transition' | 'song'; autoPlay?: boolean }) {
  return <div className={`scene source-video-scene source-video-scene--${layout}`}>
    <video src={source} controls autoPlay={autoPlay} playsInline preload="metadata" />
    <SourceNextButton onClick={onNext} position="right" />
  </div>
}

function AutoAdvanceVideoScene({ source, onDone, delayMs = 60_000, variant = 'default' }: { source: string; onDone: () => void; delayMs?: number; variant?: 'default' | 'opening' | 'closing' }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, onDone])

  return <div className={`scene source-video-scene source-video-scene--transition source-video-scene--autoplay source-video-scene--autoplay-${variant}`}>
    <video src={source} controls autoPlay playsInline preload="auto" />
  </div>
}

function InvitationGame({ play, preload, onDone }: { play: (source: string) => void; preload: (source: string) => HTMLAudioElement; onDone: () => void }) {
  const [rounds, setRounds] = useState<InvitationRound[]>(createInvitationRounds)
  const [phase, setPhase] = useState<'mailbox' | 'letter' | 'round' | 'complete'>('mailbox')
  const [roundIndex, setRoundIndex] = useState(0)
  const [heard, setHeard] = useState(false)
  const [wrong, setWrong] = useState<MonsterId | null>(null)
  const [correct, setCorrect] = useState<MonsterId | null>(null)
  const feedbackTimer = useRef<number | null>(null)
  const advanceTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    }
  }, [])

  const current = rounds[roundIndex]
  useEffect(() => {
    if (phase !== 'round') return
    const sounds = invitationAudio[current.monsterId]
    ;[current.audio, sounds.wrong, sounds.correct].forEach(preload)
  }, [current, phase, preload])

  if (phase === 'mailbox') {
    return <div className="scene invitation-mailbox-scene" style={{ '--scene-art': `url("${invitationImages.mailbox}")` } as React.CSSProperties}>
      <button className="mailbox-hotspot" aria-label="Open the mailbox" onClick={() => setPhase('letter')} />
    </div>
  }

  if (phase === 'letter') {
    return <div className="scene invitation-letter-scene" style={{ '--scene-art': `url("${invitationImages.mailboxDim}")` } as React.CSSProperties}>
      <button className="flying-letter" aria-label="Open the invitation" onClick={() => setPhase('round')}>
        <img src={invitationImages.envelope} alt="Invitation envelope" />
      </button>
    </div>
  }

  if (phase === 'complete') {
    const restart = () => {
      setRounds(createInvitationRounds())
      setRoundIndex(0)
      setHeard(false)
      setWrong(null)
      setCorrect(null)
      setPhase('mailbox')
    }
    return <div className="scene invitation-game-over" style={{ '--scene-art': `url("${invitationImages.gameOver}")` } as React.CSSProperties}>
      <button className="game-over-hotspot game-over-hotspot--again" aria-label="Start again" onClick={restart} />
      <button className="game-over-hotspot game-over-hotspot--continue" aria-label="Continue" onClick={onDone} />
    </div>
  }

  const listen = () => {
    play(current.audio)
    setHeard(true)
  }
  const choose = (id: MonsterId) => {
    if (!heard || correct) return
    if (id !== current.monsterId) {
      setWrong(id)
      play(invitationAudio[current.monsterId].wrong)
      if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
      feedbackTimer.current = window.setTimeout(() => setWrong(null), 500)
      return
    }
    setCorrect(id)
    play(invitationAudio[current.monsterId].correct)
    advanceTimer.current = window.setTimeout(() => {
      setHeard(false)
      setWrong(null)
      setCorrect(null)
      if (roundIndex + 1 === rounds.length) setPhase('complete')
      else setRoundIndex(roundIndex + 1)
    }, 650)
  }

  return <div className="scene invitation-round-scene" style={{ '--scene-art': `url("${invitationImages.mailboxDim}")` } as React.CSSProperties}>
    <button className={`invitation-card ${heard ? 'is-heard' : ''}`} aria-label="Listen to the invitation" onClick={listen}>
      <img src={current.image} alt="Monster party invitation" />
    </button>
    <div className={`invitation-monsters ${heard ? 'is-ready' : ''}`}>
      {invitationMonsterOrder.map((id) => {
        const actor = actorById[id]
        return <button
          key={actor.id}
          data-monster={actor.id}
          className={`${wrong === actor.id ? 'is-wrong' : ''} ${correct === actor.id ? 'is-correct' : ''}`}
          aria-label={actor.name}
          disabled={!heard || Boolean(correct)}
          onClick={() => choose(actor.id)}
        ><img src={actor.portrait} alt={actor.name} /></button>
      })}
    </div>
  </div>
}

function VoiceDeck({ play, onDone }: { play: (source: string) => void; onDone: () => void }) {
  const cards = useMemo(() => shuffle([...actors, ...actors]), [])
  const [round, setRound] = useState(0)
  const [drawn, setDrawn] = useState(false)
  const [wrong, setWrong] = useState<MonsterId | null>(null)
  const target = cards[round]
  const draw = () => { setDrawn(true); play(target.voice) }
  const choose = (id: MonsterId) => {
    if (!drawn) return
    if (id !== target.id) { setWrong(id); play(wrongAudio); window.setTimeout(() => setWrong(null), 500); return }
    play(correctAudio)
    window.setTimeout(() => round === cards.length - 1 ? onDone() : (setRound((value) => value + 1), setDrawn(false)), 550)
  }
  return <div className="scene art-scene deck-scene" style={{ '--scene-art': `url("${originalImages.deck}")` } as React.CSSProperties}>
    <div className="score-ribbon"><span>SCORE</span><strong>{round}</strong><i>/</i><b>12</b></div>
    <div className="deck-copy"><span>WHO IS SPEAKING?</span><strong>{drawn ? 'LISTEN AND CHOOSE' : 'DRAW A CARD'}</strong></div>
    <button className={`magic-deck ${drawn ? 'is-drawn' : ''}`} data-target={target.id} onClick={draw} aria-label="Draw and listen to a card"><span>{drawn ? <Volume2 /> : '?'}</span><b>{drawn ? 'LISTEN AGAIN' : 'DRAW'}</b></button>
    <div className={`portrait-choices ${!drawn ? 'is-locked' : ''}`}>
      {actors.map((actor) => <button className={wrong === actor.id ? 'is-wrong' : ''} key={actor.id} onClick={() => choose(actor.id)}><img src={actor.portrait} alt={actor.name} /><span>{actor.name}</span></button>)}
    </div>
  </div>
}

const feelingsLayout = [
  { id: 'witch', left: 156.9245, top: 461.0452, width: 272.0781, height: 289.0784, imageLeft: -25.3635, imageTop: 0, imageWidth: 159.5024, imageHeight: 100, z: 4 },
  { id: 'skeleton', left: 598.4136, top: 494.4937, width: 200.7593, height: 250.1868, imageLeft: -45.8487, imageTop: 0, imageWidth: 187.0828, imageHeight: 100, z: 5 },
  { id: 'vampire', left: 406.2345, top: 302.0019, width: 211.531, height: 283.2093, imageLeft: -58.9984, imageTop: 0, imageWidth: 200.9919, imageHeight: 100, z: 6 },
  { id: 'troll', left: 69.8528, top: 179.2259, width: 239.1302, height: 245.5519, imageLeft: -20.875, imageTop: 0, imageWidth: 153.861, imageHeight: 100, z: 7 },
  { id: 'ghost', left: 711.0102, top: 199.946, width: 223.055, height: 261.0992, imageLeft: -52.3669, imageTop: 0, imageWidth: 185.6948, imageHeight: 105.8734, z: 8 },
  { id: 'raven', left: 350.4337, top: 14.9512, width: 302.4309, height: 287.0507, imageLeft: -27.3864, imageTop: 0, imageWidth: 142.3717, imageHeight: 100, z: 9 },
] as const

function FeelingsChallenge({ play, onDone }: { play: (source: string) => void; onDone: () => void }) {
  return <div className="scene art-scene source-feelings-scene" style={{ '--scene-art': `url("${originalImages.feelings}")` } as React.CSSProperties}>
    <button className="feelings-advance-area" aria-label="Continue" onClick={onDone} />
    {feelingsLayout.map((layout) => {
      const actor = actorById[layout.id]
      return <button
        className="feelings-actor"
        key={actor.id}
        aria-label={`${actor.name}: ${actor.feeling}`}
        onClick={() => play(actor.feelingAudio)}
        style={{
          left: `${layout.left / 10.24}%`, top: `${layout.top / 7.68}%`,
          width: `${layout.width / 10.24}%`, height: `${layout.height / 7.68}%`,
          zIndex: layout.z,
          '--image-left': `${layout.imageLeft}%`, '--image-top': `${layout.imageTop}%`,
          '--image-width': `${layout.imageWidth}%`, '--image-height': `${layout.imageHeight}%`,
        } as React.CSSProperties}
      ><img src={actor.character} alt="" decoding="async" /></button>
    })}
    <SourceNextButton onClick={onDone} position="right" />
  </div>
}

function TimedChallenge({ seconds, source, onNext }: { seconds: number; source: string; onNext: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running || remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [running, remaining])
  return <div className="scene timer-scene">
    <div className="timer-ring"><span>{remaining}</span><small>SECONDS</small></div>
    <div className="timer-card"><h2>{seconds === 7 ? 'QUICK CHALLENGE' : 'WATCH & REMEMBER'}</h2><p>{running ? 'Watch carefully. The clock is ticking!' : `You have ${seconds} seconds.`}</p><video src={source} controls playsInline preload="metadata" />{!running && <button className="gold-button" onClick={() => setRunning(true)}>START TIMER</button>}</div>
    <NextButton onClick={onNext}>{remaining === 0 ? 'FINISH' : 'NEXT'}</NextButton>
  </div>
}

const foodLayout = [
  { id: 'toast', left: 169.095, top: 44.3128, width: 136.8769, height: 148.6925 },
  { id: 'juice', left: 47.5251, top: 244.5307, width: 136.8769, height: 186.2344 },
  { id: 'melon', left: 806.5249, top: 214.4972, width: 154.0389, height: 148.6925 },
  { id: 'roll', left: 664.2849, top: 34.6592, width: 164.7651, height: 148.6925 },
  { id: 'bacon', left: 145.1341, top: 484.7989, width: 205.5249, height: 148.6925 },
  { id: 'peach', left: 705.0447, top: 457.9832, width: 136.8769, height: 148.6925 },
] as const

function FoodVocabulary({ play, onDone }: { play: (source: string) => void; onDone: () => void }) {
  return <div className="scene art-scene source-food-scene" style={{ '--scene-art': `url("${originalImages.foodIntro}")` } as React.CSSProperties}>
    {foodLayout.map((layout) => {
      const food = originalFoods.find((item) => item.id === layout.id)!
      return <button
        className="source-food"
        key={food.id}
        aria-label={food.label}
        onClick={() => play(food.audio)}
        style={{ left: `${layout.left / 10.24}%`, top: `${layout.top / 7.68}%`, width: `${layout.width / 10.24}%`, height: `${layout.height / 7.68}%` }}
      ><img src={food.image} alt={food.label} /></button>
    })}
    <SourceNextButton onClick={onDone} position="right" />
  </div>
}

type FoodId = (typeof originalFoods)[number]['id']

const foodOwner: Record<FoodId, MonsterId> = {
  toast: 'ghost',
  juice: 'vampire',
  melon: 'skeleton',
  roll: 'troll',
  bacon: 'raven',
  peach: 'witch',
}

function CafeOrderGame({ monsterId, play, onDone }: { monsterId: MonsterId; play: (source: string) => void; onDone: () => void }) {
  const scene = cafeScenes[monsterId]
  const [wrong, setWrong] = useState<FoodId | null>(null)
  const [correct, setCorrect] = useState(false)

  const choose = (foodId: FoodId) => {
    if (correct) return
    if (foodId !== scene.correctFood) {
      setWrong(foodId)
      play(invitationAudio[foodOwner[foodId]].wrong)
      window.setTimeout(() => setWrong(null), 520)
      return
    }
    setCorrect(true)
    play(invitationAudio[monsterId].correct)
  }

  return <div className="scene art-scene source-food-scene cafe-order-scene" style={{ '--scene-art': `url("${scene.background}")` } as React.CSSProperties}>
    {foodLayout.map((layout) => {
      const food = originalFoods.find((item) => item.id === layout.id)!
      return <button
        className={`source-food cafe-food-choice ${wrong === food.id ? 'is-feedback-wrong' : ''} ${correct && food.id === scene.correctFood ? 'is-feedback-correct' : ''}`}
        key={food.id}
        aria-label={food.label}
        disabled={correct}
        onClick={() => choose(food.id)}
        style={{ left: `${layout.left / 10.24}%`, top: `${layout.top / 7.68}%`, width: `${layout.width / 10.24}%`, height: `${layout.height / 7.68}%` }}
      ><img src={food.image} alt={food.label} /></button>
    })}
    {correct && <video className="cafe-reaction" src={scene.reaction} autoPlay loop muted playsInline preload="auto" />}
    <SourceNextButton onClick={onDone} position="right" />
  </div>
}

function FoodWordSwitcher({ play, onNext }: { play: (source: string) => void; onNext: () => void }) {
  const [wordId, setWordId] = useState<FoodId | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [switchOn, setSwitchOn] = useState(false)
  const selectedFood = originalFoods.find((food) => food.id === wordId)

  const chooseWord = () => {
    if (spinning) return
    const choices = originalFoods.filter((food) => food.id !== wordId)
    const nextFood = choices[Math.floor(Math.random() * choices.length)]
    setSpinning(true)
    setSwitchOn((value) => !value)
    window.setTimeout(() => {
      setWordId(nextFood.id)
      setSpinning(false)
      play(nextFood.audio)
    }, 320)
  }

  return <div className="scene art-scene food-word-switcher" style={{ '--scene-art': `url("${originalImages.raceWordBackground}")` } as React.CSSProperties}>
    <header className="food-word-heading"><h1>RACE</h1><p>PRESS THE SWITCH AND LISTEN</p></header>
    <div className={`food-word-display ${selectedFood ? 'has-word' : ''} ${spinning ? 'is-spinning' : ''}`}>
      <img src={originalImages.raceWordFrame} alt="" />
      <span aria-live="polite">{spinning ? '…' : selectedFood?.label ?? '?'}</span>
    </div>
    <button className={`food-word-toggle ${switchOn ? 'is-on' : ''}`} aria-label="Choose a food word" onClick={chooseWord} disabled={spinning}>
      <span className="food-word-toggle__track"><i /></span>
      <b>NEW WORD</b>
    </button>
    <SourceNextButton onClick={onNext} position="right" />
  </div>
}

type DobbleSymbol = { id: string; label: string; image: string }
type DobbleRound = { shared: DobbleSymbol; left: DobbleSymbol[]; right: DobbleSymbol[]; rotations: Record<string, number> }

const dobbleSymbols: DobbleSymbol[] = [
  ...actors.map((actor) => ({ id: actor.id, label: actor.name, image: actor.portrait })),
  ...originalFoods.map((food) => ({ id: food.id, label: food.label, image: food.image })),
]

function createDobbleRounds(): DobbleRound[] {
  return shuffle(dobbleSymbols).slice(0, 5).map((shared, roundIndex) => {
    const available = shuffle(dobbleSymbols.filter((symbol) => symbol.id !== shared.id))
    const left = shuffle([shared, ...available.slice(0, 4)])
    const right = shuffle([shared, ...available.slice(4, 8)])
    const rotations = Object.fromEntries([...left, ...right].map((symbol, index) => [
      `${index < 5 ? 'left' : 'right'}-${symbol.id}`,
      ((roundIndex * 37 + index * 29) % 31) - 15,
    ]))
    return { shared, left, right, rotations }
  })
}

function DobbleGame({ play, onNext }: { play: (source: string) => void; onNext: () => void }) {
  const [gameKey, setGameKey] = useState(0)
  const rounds = useMemo(createDobbleRounds, [gameKey])
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const [scores, setScores] = useState<[number, number]>([0, 0])
  const [lives, setLives] = useState<[number, number]>([2, 2])
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState<{ player: 0 | 1; type: 'correct' | 'wrong' } | null>(null)
  const [finished, setFinished] = useState(false)
  const current = rounds[round]

  const finishOrAdvance = (nextLives: [number, number]) => {
    window.setTimeout(() => {
      if (round === rounds.length - 1 || (nextLives[0] === 0 && nextLives[1] === 0)) {
        setFinished(true)
        setFeedback(null)
        setLocked(false)
        return
      }
      setRound((value) => value + 1)
      setFeedback(null)
      setLocked(false)
    }, 950)
  }

  const choose = (player: 0 | 1, symbolId: string) => {
    if (!started || locked || finished || lives[player] === 0) return
    const isCorrect = symbolId === current.shared.id
    const opponent = player === 0 ? 1 : 0
    const nextScores: [number, number] = [...scores]
    const nextLives: [number, number] = [...lives]
    setLocked(true)
    setFeedback({ player, type: isCorrect ? 'correct' : 'wrong' })
    if (isCorrect) {
      nextScores[player] += 1
      play(correctAudio)
    } else {
      nextLives[player] = Math.max(0, nextLives[player] - 1)
      nextScores[opponent] += 1
      play(wrongAudio)
    }
    setScores(nextScores)
    setLives(nextLives)
    finishOrAdvance(nextLives)
  }

  const restart = () => {
    setGameKey((value) => value + 1)
    setStarted(false)
    setRound(0)
    setScores([0, 0])
    setLives([2, 2])
    setLocked(false)
    setFeedback(null)
    setFinished(false)
  }

  const result = scores[0] === scores[1] ? 'DRAW!' : `PLAYER ${scores[0] > scores[1] ? 1 : 2} WINS!`

  return <div className="scene art-scene dobble-scene" style={{ '--scene-art': `url("${originalImages.dobbleBackground}")` } as React.CSSProperties}>
    <div className="dobble-score dobble-score--one"><span>PLAYER 1</span><strong>{scores[0]}</strong></div>
    <div className="dobble-round"><span>ROUNDS</span><strong>{finished ? 0 : started ? Math.max(rounds.length - round, 0) : rounds.length}</strong></div>
    <div className="dobble-score dobble-score--two"><span>PLAYER 2</span><strong>{scores[1]}</strong></div>

    {[0, 1].map((player) => <div className={`dobble-lives dobble-lives--${player === 0 ? 'one' : 'two'}`} key={player} aria-label={`Player ${player + 1}: ${lives[player as 0 | 1]} lives`}>
      {[0, 1].map((life) => <img key={life} className={life >= lives[player as 0 | 1] ? 'is-lost' : ''} src={originalImages.dobbleLife} alt="" />)}
    </div>)}

    {([0, 1] as const).map((player) => {
      const symbols = player === 0 ? current.left : current.right
      const side = player === 0 ? 'left' : 'right'
      return <section className={`dobble-card dobble-card--${side} ${started ? 'is-active' : ''} ${lives[player] === 0 ? 'is-out' : ''}`} aria-label={`Player ${player + 1} card`} key={side}>
        <img className="dobble-card__frame" src={originalImages.dobbleFrame} alt="" />
        {started && !finished && symbols.map((symbol, index) => {
          const revealed = Boolean(feedback) && symbol.id === current.shared.id
          const dimmed = Boolean(feedback) && !revealed
          return <button
            className={`dobble-symbol dobble-symbol--${index} ${revealed ? 'is-match' : ''} ${dimmed ? 'is-dimmed' : ''}`}
            style={{ '--symbol-turn': `${current.rotations[`${side}-${symbol.id}`]}deg` } as React.CSSProperties}
            key={symbol.id}
            data-symbol={symbol.id}
            aria-label={`Player ${player + 1}: ${symbol.label}`}
            disabled={locked || lives[player] === 0}
            onClick={() => choose(player, symbol.id)}
          ><img src={symbol.image} alt={symbol.label} /></button>
        })}
        {lives[player] === 0 && !finished && <div className="dobble-player-out">OUT</div>}
        {feedback?.player === player && <div className={`dobble-feedback dobble-feedback--${feedback.type}`}>{feedback.type === 'correct' ? '✓' : '×'}</div>}
      </section>
    })}

    {!started && <button className="dobble-start" onClick={() => setStarted(true)}><span>START</span><b>GAME</b></button>}
    {finished && <div className="dobble-result" role="status">
      <small>GAME OVER</small><h2>{result}</h2><p>{scores[0]} — {scores[1]}</p>
      <button className="dobble-restart" onClick={restart}><RotateCcw /> PLAY AGAIN</button>
    </div>}
    {finished && <SourceNextButton onClick={onNext} position="right" />}
  </div>
}

type MemoryCard = { key: string; pair: string; kind: 'picture' | 'word'; image?: string; label: string }

function FoodMemory({ play, onDone }: { play: (source: string) => void; onDone: () => void }) {
  const cards = useMemo<MemoryCard[]>(() => shuffle(originalFoods.flatMap((food) => [
    { key: `${food.id}-picture`, pair: food.id, kind: 'picture' as const, image: food.image, label: food.label },
    { key: `${food.id}-word`, pair: food.id, kind: 'word' as const, label: food.label },
  ])), [])
  const [open, setOpen] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const flip = (card: MemoryCard) => {
    if (locked || open.includes(card.key) || matched.includes(card.pair)) return
    if (card.kind === 'word') {
      const food = originalFoods.find((item) => item.id === card.pair)
      if (food) play(food.audio)
    }
    const nextOpen = [...open, card.key]; setOpen(nextOpen)
    if (nextOpen.length < 2) return
    setLocked(true)
    const first = cards.find((item) => item.key === nextOpen[0])!
    if (first.pair === card.pair && first.kind !== card.kind) {
      setFeedback('correct')
      window.setTimeout(() => { setMatched((values) => [...values, card.pair]); setOpen([]); setLocked(false); setFeedback(null) }, 650)
    } else {
      setFeedback('wrong')
      window.setTimeout(() => { setOpen([]); setLocked(false); setFeedback(null) }, 850)
    }
  }
  return <div className="scene art-scene source-memory-scene" style={{ '--scene-art': `url("${originalImages.foodRoom}")` } as React.CSSProperties}>
    <div className="source-memory-grid">{cards.map((card, index) => {
      const revealed = open.includes(card.key) || matched.includes(card.pair)
      return <button
        key={card.key}
        className={`${revealed ? 'is-open' : ''} ${matched.includes(card.pair) ? 'is-matched' : ''}`}
        aria-label={revealed ? card.label : `Card ${index + 1}`}
        onClick={() => flip(card)}
      ><span className="source-card-back">{index + 1}</span><span className="source-card-front">{card.kind === 'picture' ? <img src={card.image} alt={card.label} /> : <b>{card.label}</b>}</span></button>
    })}</div>
    {feedback && <img className={`memory-feedback memory-feedback--${feedback}`} src={assetUrl(`assets/images/memory/${feedback}.png`)} alt="" />}
    <SourceNextButton onClick={onDone} position="right" />
  </div>
}

function InvitationJourney({ play, onDone }: { play: (source: string) => void; onDone: () => void }) {
  const [round, setRound] = useState(0)
  const [wrong, setWrong] = useState<MonsterId | null>(null)
  const [movie, setMovie] = useState(false)
  const target = actors[round]
  const choose = (id: MonsterId) => {
    if (id !== target.id) { setWrong(id); play(wrongAudio); window.setTimeout(() => setWrong(null), 450); return }
    play(correctAudio); setMovie(true)
  }
  const advance = () => round === actors.length - 1 ? onDone() : (setRound((value) => value + 1), setMovie(false))
  return <div className="scene art-scene invitation-scene" style={{ '--scene-art': `url("${target.roomBackground}")` } as React.CSSProperties}>
    {!movie ? <><div className="invitation-copy"><small>INVITATION {round + 1} / 6</small><h2>WHO LIVES IN THE<br />{target.room.toUpperCase()}?</h2><button className="listen-button" data-target={target.id} onClick={() => play(target.welcome)}><Volume2 /> LISTEN</button></div>
      <div className="invitation-options">{actors.map((actor) => <button className={wrong === actor.id ? 'is-wrong' : ''} key={actor.id} onClick={() => choose(actor.id)}><img src={actor.portrait} alt={actor.name} /><span>{actor.name}</span></button>)}</div></> :
      <div className="room-movie"><img src={target.character} alt={target.name} /><div><small>WELCOME, {target.name.toUpperCase()}!</small><video src={target.video} controls autoPlay playsInline /><button className="gold-button" onClick={advance}>{round === 5 ? 'GO TO THE RACE' : 'NEXT INVITATION'}</button></div></div>}
  </div>
}

function FinalScene() {
  return <div className="scene art-scene final-scene" style={{ '--scene-art': `url("${originalImages.party}")` } as React.CSSProperties} aria-label="Welcome to Monsters' House" />
}

function SettingsPanel({ soundOn, onSound, onFullscreen, onRestart, onClose }: { soundOn: boolean; onSound: () => void; onFullscreen: () => void; onRestart: () => void; onClose: () => void }) {
  return <div className="modal-backdrop"><section className="settings-card" role="dialog" aria-modal="true" aria-label="Settings"><button className="modal-close" aria-label="Close settings" onClick={onClose}><X /></button><small>MONSTERS' PARTY</small><h2>SETTINGS</h2><button onClick={onSound}>{soundOn ? <Volume2 /> : <VolumeX />} SOUND {soundOn ? 'ON' : 'OFF'}</button><button onClick={onFullscreen}><Expand /> FULLSCREEN</button><button onClick={onRestart}><RotateCcw /> START AGAIN</button></section></div>
}

export default App
