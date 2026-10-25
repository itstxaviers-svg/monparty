import type { MonsterId } from '../types'
import { assetUrl } from './gameData'

export interface Actor {
  id: MonsterId
  name: string
  feeling: string
  character: string
  animation: string
  portrait: string
  voice: string
  welcome: string
  feelingAudio: string
  room: string
  roomBackground: string
  video: string
}

export const originalImages = {
  title: assetUrl('assets/images/original/title.png'),
  nextFrame: assetUrl('assets/images/original/next-frame.png'),
  house: assetUrl('assets/images/original/house.png'),
  deck: assetUrl('assets/images/original/deck.jpg'),
  stage: assetUrl('assets/images/original/monster-stage.jpg'),
  feelings: assetUrl('assets/images/original/feelings.jpg'),
  foodIntro: assetUrl('assets/images/original/food-intro.jpg'),
  foodRoom: assetUrl('assets/images/original/food-room.jpg'),
  raceWordBackground: assetUrl('assets/images/race/word-switcher-bg.jpg'),
  raceWordFrame: assetUrl('assets/images/race/word-frame.png'),
  dobbleBackground: assetUrl('assets/images/race/dobble-bg.jpg'),
  dobbleFrame: assetUrl('assets/images/race/dobble-frame.png'),
  dobbleLife: assetUrl('assets/images/race/dobble-life.png'),
  race: assetUrl('assets/images/original/race.jpg'),
  party: assetUrl('assets/images/original/party-no-right-raven.jpg'),
}

export const actors: Actor[] = [
  {
    id: 'witch', name: 'Witch', feeling: 'OK', room: 'kitchen',
    character: assetUrl('assets/images/characters/witch.webp'), animation: assetUrl('assets/images/characters/witch.webm'), portrait: assetUrl('assets/images/portraits/witch.webp'),
    voice: assetUrl('assets/audio/characters/witch.wav'), welcome: assetUrl('assets/audio/welcome/witch.wav'),
    feelingAudio: assetUrl('assets/audio/feelings/witch-ok.wav'), roomBackground: assetUrl('assets/images/original/room-witch.jpg'),
    video: assetUrl('assets/video/witch.mp4'),
  },
  {
    id: 'skeleton', name: 'Skeleton', feeling: 'GREAT', room: 'bathroom',
    character: assetUrl('assets/images/characters/skeleton.webp'), animation: assetUrl('assets/images/characters/skeleton.webm'), portrait: assetUrl('assets/images/portraits/skeleton.webp'),
    voice: assetUrl('assets/audio/characters/skeleton.wav'), welcome: assetUrl('assets/audio/welcome/skeleton.wav'),
    feelingAudio: assetUrl('assets/audio/feelings/skeleton-great.wav'), roomBackground: assetUrl('assets/images/original/room-skeleton.jpg'),
    video: assetUrl('assets/video/skeleton.mp4'),
  },
  {
    id: 'troll', name: 'Troll', feeling: 'HUNGRY', room: 'basement',
    character: assetUrl('assets/images/characters/troll.webp'), animation: assetUrl('assets/images/characters/troll.webm'), portrait: assetUrl('assets/images/portraits/troll.webp'),
    voice: assetUrl('assets/audio/characters/troll.wav'), welcome: assetUrl('assets/audio/welcome/troll.wav'),
    feelingAudio: assetUrl('assets/audio/feelings/troll-hungry.wav'), roomBackground: assetUrl('assets/images/original/room-troll.jpg'),
    video: assetUrl('assets/video/troll.mp4'),
  },
  {
    id: 'vampire', name: 'Vampire', feeling: 'TIRED', room: 'bedroom',
    character: assetUrl('assets/images/characters/vampire.webp'), animation: assetUrl('assets/images/characters/vampire.webm'), portrait: assetUrl('assets/images/portraits/vampire.webp'),
    voice: assetUrl('assets/audio/characters/vampire.wav'), welcome: assetUrl('assets/audio/welcome/vampire.wav'),
    feelingAudio: assetUrl('assets/audio/feelings/vampire-tired.wav'), roomBackground: assetUrl('assets/images/original/room-vampire.jpg'),
    video: assetUrl('assets/video/vampire.mp4'),
  },
  {
    id: 'ghost', name: 'Ghost', feeling: 'COLD', room: 'living room',
    character: assetUrl('assets/images/characters/ghost.webp'), animation: assetUrl('assets/images/characters/ghost.webm'), portrait: assetUrl('assets/images/portraits/ghost.webp'),
    voice: assetUrl('assets/audio/characters/ghost.wav'), welcome: assetUrl('assets/audio/welcome/ghost.wav'),
    feelingAudio: assetUrl('assets/audio/feelings/ghost-cold.wav'), roomBackground: assetUrl('assets/images/original/room-ghost.jpg'),
    video: assetUrl('assets/video/ghost.mp4'),
  },
  {
    id: 'raven', name: 'Raven', feeling: 'GOOD', room: 'attic',
    character: assetUrl('assets/images/characters/raven.webp'), animation: assetUrl('assets/images/characters/raven.webm'), portrait: assetUrl('assets/images/portraits/raven.webp'),
    voice: assetUrl('assets/audio/characters/raven.wav'), welcome: assetUrl('assets/audio/welcome/raven.wav'),
    feelingAudio: assetUrl('assets/audio/feelings/raven-good.wav'), roomBackground: assetUrl('assets/images/original/room-raven.jpg'),
    video: assetUrl('assets/video/raven.mp4'),
  },
]

export const actorById = Object.fromEntries(actors.map((actor) => [actor.id, actor])) as Record<MonsterId, Actor>

export const meetLayout = [
  { id: 'witch', left: 727.269337238273, top: 230.4306460934291, width: 272.0781097147504, height: 289.07841796162614, imageLeft: -25.363537386923355, imageTop: 0, imageWidth: 159.50236643307842, imageHeight: 100, z: 3 },
  { id: 'skeleton', left: 431.0840232596849, top: 17.175282115796563, width: 200.75926698467367, height: 250.18681636446172, imageLeft: -45.84870277380257, imageTop: 0, imageWidth: 187.08280919809882, imageHeight: 100, z: 4 },
  { id: 'vampire', left: 43.56920917215017, top: 242.39534796598485, width: 211.53101075899258, height: 283.20930406803024, imageLeft: -58.99836795713534, imageTop: 0, imageWidth: 200.99189060726685, imageHeight: 100, z: 5 },
  { id: 'troll', left: 399.1488873540724, top: 280.05275275150734, width: 232.69440289028609, height: 245.55189928250775, imageLeft: -24.21811253486469, imageTop: 0, imageWidth: 158.11636321874405, imageHeight: 100, z: 6 },
  { id: 'ghost', left: 226.18336233356135, top: 497.4465298217985, width: 223.05502677966462, height: 261.0991689823604, imageLeft: -52.36688537074401, imageTop: 0, imageWidth: 185.69483294014195, imageHeight: 105.87340693937347, z: 7 },
  { id: 'raven', left: 582.4294927475144, top: 497.4465298217985, width: 302.4309131104773, height: 287.05072221735105, imageLeft: -27.38644488068196, imageTop: 0, imageWidth: 142.37171686504752, imageHeight: 100, z: 8 },
] as const

export const originalFoods = [
  { id: 'melon', label: 'MELON', image: assetUrl('assets/images/food/melon.webp'), audio: assetUrl('assets/audio/food/melon.wav') },
  { id: 'toast', label: 'TOAST', image: assetUrl('assets/images/food/toast.webp'), audio: assetUrl('assets/audio/food/toast.wav') },
  { id: 'bacon', label: 'BACON', image: assetUrl('assets/images/food/bacon.webp'), audio: assetUrl('assets/audio/food/bacon.wav') },
  { id: 'juice', label: 'JUICE', image: assetUrl('assets/images/food/juice.webp'), audio: assetUrl('assets/audio/food/juice.wav') },
  { id: 'peach', label: 'PEACH', image: assetUrl('assets/images/food/peach.webp'), audio: assetUrl('assets/audio/food/peach.wav') },
  { id: 'roll', label: 'ROLL', image: assetUrl('assets/images/food/roll.webp'), audio: assetUrl('assets/audio/food/roll.wav') },
] as const

export const correctAudio = assetUrl('assets/audio/ui/correct.wav')
export const wrongAudio = assetUrl('assets/audio/ui/wrong.wav')

export const invitationImages = {
  mailbox: assetUrl('assets/images/invitation/mailbox.jpg'),
  mailboxDim: assetUrl('assets/images/invitation/mailbox-dim.jpg'),
  envelope: assetUrl('assets/images/invitation/envelope.webp'),
  background: assetUrl('assets/images/invitation/round-bg.jpg'),
  gameOver: assetUrl('assets/images/invitation/game-over.jpg'),
  cards: {
    skeleton: assetUrl('assets/images/invitation/skeleton.webp'),
    troll: assetUrl('assets/images/invitation/troll.webp'),
    witch: assetUrl('assets/images/invitation/witch.webp'),
    vampire: assetUrl('assets/images/invitation/vampire.webp'),
    ghost: assetUrl('assets/images/invitation/ghost.webp'),
    raven: assetUrl('assets/images/invitation/raven.webp'),
  } satisfies Record<MonsterId, string>,
}

export interface InvitationAudioSet {
  wrong: string
  correct: string
  welcome: string
}

const invitationAudioFile = (file: string) => assetUrl(`assets/audio/invitation/${file}`)

export const invitationAudio: Record<MonsterId, InvitationAudioSet> = {
  skeleton: { wrong: invitationAudioFile('skeleton-boo.wav'), correct: invitationAudioFile('skeleton-br.wav'), welcome: invitationAudioFile('skeleton-welcome.wav') },
  troll: { wrong: invitationAudioFile('troll-boo.wav'), correct: invitationAudioFile('troll-br.wav'), welcome: invitationAudioFile('troll-welcome.wav') },
  witch: { wrong: invitationAudioFile('witch-boo.wav'), correct: invitationAudioFile('witch-br.wav'), welcome: invitationAudioFile('witch-welcome.wav') },
  vampire: { wrong: invitationAudioFile('vampire-boo.wav'), correct: invitationAudioFile('vampire-br.wav'), welcome: invitationAudioFile('vampire-welcome.wav') },
  ghost: { wrong: invitationAudioFile('ghost-boo.wav'), correct: invitationAudioFile('ghost-br.wav'), welcome: invitationAudioFile('ghost-welcome.wav') },
  raven: { wrong: invitationAudioFile('raven-boo.wav'), correct: invitationAudioFile('raven-br.wav'), welcome: invitationAudioFile('raven-welcome.wav') },
}

export const cafeScenes = {
  witch: {
    background: assetUrl('assets/images/cafe/witch.jpg'),
    reaction: assetUrl('assets/video/cafe/food-reaction-wi.mp4'),
    correctFood: 'peach',
  },
  ghost: {
    background: assetUrl('assets/images/cafe/ghost.jpg'),
    reaction: assetUrl('assets/video/cafe/food-reaction-gh.mp4'),
    correctFood: 'toast',
  },
  raven: {
    background: assetUrl('assets/images/cafe/raven.jpg'),
    reaction: assetUrl('assets/video/cafe/food-reaction-r.mp4'),
    correctFood: 'bacon',
  },
  vampire: {
    background: assetUrl('assets/images/cafe/vampire.jpg'),
    reaction: assetUrl('assets/video/cafe/food-reaction-v.mp4'),
    correctFood: 'juice',
  },
  troll: {
    background: assetUrl('assets/images/cafe/troll.jpg'),
    reaction: assetUrl('assets/video/cafe/food-reaction-tr.mp4'),
    correctFood: 'roll',
  },
  skeleton: {
    background: assetUrl('assets/images/cafe/skeleton.jpg'),
    reaction: assetUrl('assets/video/cafe/food-reaction-sk.mp4'),
    correctFood: 'melon',
  },
} as const satisfies Record<MonsterId, { background: string; reaction: string; correctFood: (typeof originalFoods)[number]['id'] }>

export const sceneNames = [
  'Welcome', 'The house', 'Meet the monsters', 'Monsters video', 'The mailbox',
  'The letter', 'Invitation 1', 'Invitation 2', 'Invitation 3', 'Invitation 4',
  'Invitation 5', 'Invitation 6', 'Invitation 7', 'Invitation 8', 'Invitation 9',
  'Invitation 10', 'Invitation 11', 'Game over', 'Witch video', 'How are you?',
  'Skeleton video', 'Cafe video', 'Food words', 'Memory game', 'Cafe transition',
  'Witch order', 'Witch chooses', 'Ghost order', 'Ghost chooses', 'Raven order',
  'Raven chooses', 'Vampire order', 'Vampire chooses', 'Troll order', 'Troll chooses',
  'Skeleton order', 'Skeleton chooses', 'Cafe scene', 'Race word switcher', 'Dobble',
  'Troll video', 'Monsters song', 'Final',
] as const
