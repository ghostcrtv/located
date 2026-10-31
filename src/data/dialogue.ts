/**
 * Everything Benny says lives here. Add lines freely — the picker avoids repeating
 * recent lines automatically. Jokes never contain hints, so they can't mislead.
 */
export type Expression =
  | 'happy' | 'curious' | 'thinking' | 'surprised' | 'skeptical' | 'excited' | 'proud' | 'confused'
  | 'celebration' | 'sleepy' | 'explorer' | 'maphelper' | 'travel' | 'lookaround' | 'hero'

export type LineCategory =
  | 'welcome' | 'returning' | 'newGame' | 'roundStart' | 'oneShotIntro' | 'oneShotRound' | 'endlessIntro' | 'endlessMilestone'
  | 'clueCorners' | 'clueDecode' | 'clueProximity' | 'allClues'
  | 'excellent' | 'good' | 'average' | 'poor' | 'wrongContinent' | 'rightCountry' | 'ocean'
  | 'achievement' | 'record' | 'stamp' | 'complete' | 'exhausted' | 'idle' | 'poke' | 'pokeSecret' | 'endOfRoad'
  | 'homeIdle' | 'wake'

export const LINES: Record<LineCategory, string[]> = {
  welcome: [
    'Ready to get lost?',
    'Ready to get lost? I already am. I’m in the hallway.',
    'I’ve been to every country. Mostly in dreams. The dreams were very accurate.',
    'Welcome. I am 40% fluff and 60% opinions.',
    'Big planet today. Bigger than usual. I checked.',
    'Let’s explore the world. I’ll bring the snacks. I ate the snacks.',
  ],
  returning: [
    'Back for more? Excellent.',
    'You came back! I knew you would. I sat by the door the whole time. Metaphorically.',
    'Oh good, you’re here. The planet missed you. I asked it.',
    'Welcome back. I kept your seat warm by lying on it for six hours.',
    'Back again? The Earth hasn’t moved. Much. It does spin.',
  ],
  newGame: [
    'Alright. Fresh planet. Let’s go.',
    'Five rounds. Zero excuses. Several snacks.',
    'If you get this right I will consider sharing one (1) treat.',
    'Passport? Check. Sunglasses? Check. Sense of direction? We’ll see.',
    'I have packed exactly nothing. Let’s go.',
    'Stretch your thumbs. This is a sport now.',
  ],
  roundStart: [
    'Alright. Where are we?',
    'Hmm. Smells like… somewhere.',
    'Look at the details. The road. The plants. The vibes.',
    'Somewhere out there is a squirrel who knows the answer. We must not ask him.',
    'I asked a pigeon. The pigeon said “coo.” Unhelpful.',
    'Statistically, we are either here or not here.',
    'Trust your gut. Mine says “lunch.”',
    'Every place is somewhere. That’s my professional opinion.',
    'Don’t panic. Earth only has about 200 countries. Ish.',
  ],
  oneShotIntro: [
    'One photo. Big planet. Good luck.',
    'No walking around. Just you, a picture, and your inner pigeon.',
    'One Shot. Like a photo finish, but the finish is a continent.',
  ],
  oneShotRound: [
    'Study it like it owes you money.',
    'Zoom in. Read everything. Even the clouds.',
    'This photo knows something. Make it talk.',
    'One frame. Infinite overthinking. Let’s go.',
    'If you squint, every place looks like Belgium. Don’t squint.',
  ],
  endlessIntro: [
    'The world doesn’t stop. Neither does my tail.',
    'Endless mode. Like a walk where nobody says “home.”',
    'We keep going until you say stop. Or I fall asleep. Equal odds.',
  ],
  endlessMilestone: [
    'Ten rounds! I’ve seen more of the world than my vet would allow.',
    'Still going? I respect the commitment. My paws are tired just watching.',
    'At this point we should start charging the planet rent.',
  ],
  clueCorners: [
    'Four countries enter. One country leaves.',
    'Multiple choice. My favorite. I always pick the one that smells best.',
    'Need a little help? Interesting.',
    'Four corners. Like a room. Or a sandwich cut fancy.',
    'Choose wisely. Or randomly. I won’t tell.',
  ],
  clueDecode: [
    'Riddle time. I wrote it myself. With my paws. Be impressed.',
    'A riddle! Read it slowly, like a cat reads a menu.',
    'Decode mode. Put on your thinking hat. I’m wearing mine. It’s my ears.',
    'Need a little help? Interesting.',
    'This one took me three naps to write.',
  ],
  clueProximity: [
    'Drop a test pin. I’ll sniff the air and tell you if it’s warm.',
    'Hot or cold? I’m a dog. I am always warm. But I’ll check.',
    'Test pin incoming. It won’t count, it’s just for science.',
    'One sniff. Make it count.',
  ],
  allClues: [
    'Should I just drive us there?',
    'Should I just drive us there? I can’t reach the pedals, but I believe.',
    'All three clues. Bold. I respect a player who uses every tool in the shed.',
    'At this point the clues are doing the guessing. Not judging. Okay, judging a little.',
  ],
  excellent: [
    'Okay, that was suspiciously good.',
    'Bullseye. I’m going to need to see some ID.',
    'Were you a migrating bird in a past life?',
    'That was so close I can hear your pin breathing.',
    'Benny is checking you for a GPS chip.',
    'Okay, show-off.',
    'I taught you that. I didn’t, but let me have this.',
  ],
  good: [
    'Not bad. I was thinking the same thing.',
    'Nice. Right neighborhood, wrong doorbell.',
    'Solid. Like a good stick.',
    'Close enough to wave at.',
    'Look at you, knowing things.',
  ],
  average: [
    'Hmm. In the general direction of correct.',
    'Not bad. The answer could see your pin with binoculars.',
    'Respectable. Like a sandwich with no mustard.',
    'You were in the right… area code. Of the planet.',
    'Halfway decent. Like my haircut.',
  ],
  poor: [
    'That’s… quite a commute.',
    'That guess is so far away it has its own time zone.',
    'Your pin and the answer are no longer on speaking terms.',
    'I’m not saying it was bad. I’m saying the ocean was surprised.',
    'Bold strategy. Let’s see if it pays off. It did not.',
    'Your pin has applied for a passport of its own.',
    'Hey, at least it was on Earth. Mostly.',
  ],
  wrongContinent: [
    'Well, we’re on the right planet.',
    'Different continent. Same sky though. Probably.',
    'Wrong continent, but the confidence was beautiful.',
  ],
  rightCountry: [
    'Right country! Passport stamp incoming.',
    'Correct country. I’d high-five you but, you know. Paws.',
    'You found the country. Now find me a snack.',
  ],
  ocean: [
    'You guessed the ocean. Fish appreciate the visit.',
    'That pin is swimming. Pins can’t swim.',
    'Wet paws! Nobody lives there except a very confused crab.',
  ],
  achievement: [
    'Achievement unlocked! I’m printing a tiny certificate.',
    'Look at you collecting things. Like me with socks.',
    'Shiny new badge. Don’t let it go to your head. Okay, a little.',
  ],
  record: [
    'New record. I taught you everything.',
    'New personal best! I’m doing zoomies on the inside.',
    'Record broken. Somebody call the newspaper. Or a squirrel.',
  ],
  stamp: [
    'New passport stamp! Smells like adventure. And ink.',
    'Another country in the book. I’m drooling on the page a little.',
    'Stamp! Thunk! I love that sound.',
  ],
  complete: [
    'That’s a wrap. The planet thanks you.',
    'Game over. I need a nap and a map. Mostly the nap.',
    'Great tour. My paws are tired and I didn’t even walk.',
    'Done! Same time tomorrow? I have no other plans. Ever.',
    'And that’s the world. Well, five pieces of it.',
  ],
  exhausted: [
    'We’ve seen every place I know. I’m officially out of postcards.',
  ],
  idle: [
    'Take your time. I’ll just be here. Aging. In dog years.',
    'Psst. The answer is somewhere on Earth. You’re welcome.',
    'Still thinking? Same. I’m thinking about cheese.',
    'If you stare long enough, the photo stares back.',
  ],
  poke: [
    'Do fish know they’re in Portugal?',
    'I have never seen a mountain I didn’t want to bark at.',
    'What if the map is looking at us?',
    'If I sit very still, am I a landmark?',
    'Penguins wear tuxedos everywhere. Overdressed, honestly.',
    'I tried to guess where my tail was. Missed by two inches.',
    'Every country is my favorite country until I smell the next one.',
    'I am technically a small cloud with legs.',
    'Hey. Hey. Boop.',
    'I once licked a map. Tasted like regret and laminate.',
    'My tail points north. Sometimes. Mostly it points at snacks.',
    'Some people call it a globe. I call it a very large ball I’m not allowed to fetch.',
    'Please stop poking me. Kidding. Keep going. Actually, I can’t decide.',
    'I learned geography from smelling other dogs’ suitcases.',
    'If a tree falls in a forest and nobody guesses where, does it count?',
  ],
  pokeSecret: [
    'Okay, okay! You found the secret. There is no secret. Except this: I’m a good boy.',
  ],
  homeIdle: [
    'Zzz… mmm… Belgium…',
    'Zzz… no, the OTHER Georgia…',
    'Zzz… five more continents…',
    'Zzz… who moved Australia…',
  ],
  wake: [
    'I was NOT asleep. I was resting my eyes. Geographically.',
    'Huh? Yes! Paraguay! What was the question?',
    'I’m up. I’m up. Was anyone looking?',
    'I dreamt the map was a sandwich. Anyway. Hi.',
  ],
  endOfRoad: [
    'End of the road. Literally.',
    'That’s as far as the pictures go. Even I can’t walk past the edge of the internet.',
  ],
}

export const EXPRESSION_FOR: Partial<Record<LineCategory, Expression>> = {
  welcome: 'happy', returning: 'excited', newGame: 'explorer', roundStart: 'curious', oneShotIntro: 'thinking',
  oneShotRound: 'thinking', endlessIntro: 'travel', endlessMilestone: 'excited', clueCorners: 'skeptical',
  clueDecode: 'thinking', clueProximity: 'maphelper', allClues: 'skeptical', excellent: 'surprised', good: 'happy',
  average: 'thinking', poor: 'confused', wrongContinent: 'confused', rightCountry: 'excited', ocean: 'surprised',
  achievement: 'celebration', record: 'proud', stamp: 'celebration', complete: 'proud', exhausted: 'sleepy',
  idle: 'sleepy', poke: 'happy', pokeSecret: 'proud', endOfRoad: 'lookaround', homeIdle: 'sleepy', wake: 'surprised',
}

/** Categories that still play when Benny is set to "Quiet". */
export const KEY_MOMENTS: LineCategory[] = ['excellent', 'record', 'achievement', 'stamp', 'complete', 'endOfRoad', 'exhausted', 'pokeSecret', 'poke', 'wake']

/** Silly loading lines shown while maps and photos load. */
export const LOADING_LINES = [
  'Unrolling the planet…',
  'Bribing a pigeon for directions…',
  'Rotating the Earth slightly…',
  'Folding the map wrong on purpose…',
  'Sniffing for landmarks…',
  'Calibrating the fluff…',
  'Asking a local squirrel…',
  'Polishing the continents…',
]

/** Little captions under each score tier. */
export const TIER_QUIPS: Record<string, string[]> = {
  incredible: ['Benny is checking you for a GPS chip.', 'Basically teleportation.', 'Are you secretly a satellite?'],
  target: ['Nose-to-the-ground good.', 'A pigeon would be proud.', 'Very nearly there. Like, wave-at-it near.'],
  close: ['Same neighborhood. Different snacks.', 'Right region, keep sniffing.', 'Warm. Toasty, even.'],
  notbad: ['Points are points.', 'In the general direction of correct.', 'A respectable wander.'],
  far: ['Your pin has applied for its own passport.', 'Scenic route.', 'Hey, it was on Earth. Mostly.'],
}

const recentByCat = new Map<string, string[]>()
/** Random line that avoids the last few used in the same category. */
export function pickLine(cat: LineCategory, rng: () => number = Math.random): string {
  const pool = LINES[cat]
  const recent = recentByCat.get(cat) ?? []
  const fresh = pool.filter((l) => !recent.includes(l))
  const choices = fresh.length ? fresh : pool
  const line = choices[Math.floor(rng() * choices.length)]
  recentByCat.set(cat, [...recent, line].slice(-Math.min(4, Math.max(1, pool.length - 1))))
  return line
}

export function pickFrom<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Benny is ~30 cm nose to tail. Distance in Bennys, for science. */
export function bennys(km: number): string {
  const n = (km * 1000) / 0.3
  if (n < 1000) return `${Math.round(n).toLocaleString('en-US')} Bennys`
  if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)} thousand Bennys`
  if (n < 1e9) return `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} million Bennys`
  return `${(n / 1e9).toFixed(1)} billion Bennys`
}
