import { createSelector } from '@reduxjs/toolkit'
import type { ITrack } from '../../Store/Actions/currentTrack.actions'
import type { RootState } from '../../Store/store'

export type AlbumGroup = {
  album: string
  artist?: string
  count: number
  sample?: ITrack
  maxId: number
}

export type ArtistGroup = {
  artist: string
  count: number
  sample?: ITrack
  maxId: number
}

type SortCollection = 'alpha' | 'size' | 'recent'

const buildAlbumGroups = (tracks: ITrack[]): AlbumGroup[] => {
  const groups = new Map<string, AlbumGroup>()
  tracks.forEach((t) => {
    const key = (t.album || 'Unknown').trim()
    const idNum = Number(t.id)
    const existing = groups.get(key) || { album: key, artist: t.artist, count: 0, sample: t, maxId: -Infinity }
    existing.count += 1
    existing.artist = existing.artist || t.artist
    existing.sample = existing.sample || t
    existing.maxId = Math.max(existing.maxId, isNaN(idNum) ? -Infinity : idNum)
    groups.set(key, existing)
  })
  return Array.from(groups.values())
}

const buildArtistGroups = (tracks: ITrack[]): ArtistGroup[] => {
  const groups = new Map<string, ArtistGroup>()
  tracks.forEach((t) => {
    const key = (t.artist || 'Unknown').trim()
    const idNum = Number(t.id)
    const existing = groups.get(key) || { artist: key, count: 0, sample: t, maxId: -Infinity }
    existing.count += 1
    existing.sample = existing.sample || t
    existing.maxId = Math.max(existing.maxId, isNaN(idNum) ? -Infinity : idNum)
    groups.set(key, existing)
  })
  return Array.from(groups.values())
}

const sortAlbums = (items: AlbumGroup[], sort: SortCollection): AlbumGroup[] => {
  switch (sort) {
    case 'size':
      return [...items].sort((a, b) => b.count - a.count)
    case 'recent':
      return [...items].sort((a, b) => b.maxId - a.maxId)
    case 'alpha':
    default:
      return [...items].sort((a, b) => a.album.localeCompare(b.album, undefined, { sensitivity: 'base' }))
  }
}

const sortArtists = (items: ArtistGroup[], sort: SortCollection): ArtistGroup[] => {
  switch (sort) {
    case 'size':
      return [...items].sort((a, b) => b.count - a.count)
    case 'recent':
      return [...items].sort((a, b) => b.maxId - a.maxId)
    case 'alpha':
    default:
      return [...items].sort((a, b) => a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' }))
  }
}

export const selectAlbumGroups = createSelector(
  [
    (_state: RootState, props: { tracks: ITrack[]; sort: SortCollection }) => props.tracks,
    (_state: RootState, props: { tracks: ITrack[]; sort: SortCollection }) => props.sort,
  ],
  (tracks, sort) => sortAlbums(buildAlbumGroups(tracks), sort),
)

export const selectArtistGroups = createSelector(
  [
    (_state: RootState, props: { tracks: ITrack[]; sort: SortCollection }) => props.tracks,
    (_state: RootState, props: { tracks: ITrack[]; sort: SortCollection }) => props.sort,
  ],
  (tracks, sort) => sortArtists(buildArtistGroups(tracks), sort),
)
