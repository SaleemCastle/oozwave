export const EQ_PRESETS = {
  Flat:    { preamp: 0, bands: [0,0,0,0,0,0,0,0,0,0] },
  Pop:     { preamp: 0, bands: [-1,2,4,4,1,-1,-1,0,1,2] },
  Rock:    { preamp: 0, bands: [4,3,2,0,-1,1,3,4,4,3] },
  Jazz:    { preamp: 0, bands: [0,1,2,2,1,0,1,1,2,2] },
  Classical:{ preamp:0,bands:[2,2,1,0,-1,-1,0,1,2,3] },
  Dance:   { preamp: -1,bands:[5,4,3,1,-1,0,2,4,5,5] },
  'Hip-Hop':{ preamp:-2,bands:[6,5,3,1,-1,0,2,3,4,5] },
  Acoustic:{ preamp: 0,bands:[-1,0,1,2,3,2,1,0,-1,-2] },
  'Vocal Boost':{preamp:0,bands:[-2,-2,-1,1,2,3,2,1,0,0]},
  'Bass Boost': {preamp:-2,bands:[8,6,4,2,0,-1,-2,-3,-4,-5]},
  'Treble Boost':{preamp:-1,bands:[-3,-3,-2,-1,0,1,3,5,6,6]},
  Custom:  { preamp: 0, bands: [0,0,0,0,0,0,0,0,0,0] },
} as const

export type PresetKey = keyof typeof EQ_PRESETS

