import { ImageSourcePropType } from 'react-native'
import { Images } from '../Constants'

export type PlaylistBrief = { id: string; name: string; tracks: number; thumbnail: ImageSourcePropType }
export type ArtistBrief = { id: string; name: string; avatar?: ImageSourcePropType; followers?: number }
export type AlbumBrief = { id: string; name: string; artist: string; cover: ImageSourcePropType }

export type CreatorBrief = { id: string; name: string; avatar?: ImageSourcePropType }
export type ReleaseBrief = { id: string; title: string; artist: string; cover: ImageSourcePropType }
export type GenreBrief = { id: string; name: string }

export type DiscoverHomeResponse = {
  recommendedPlaylists: PlaylistBrief[]
  trendingPlaylists: PlaylistBrief[]
  topArtists: ArtistBrief[]
  topAlbums: AlbumBrief[]
  creators: CreatorBrief[]
  newReleases: ReleaseBrief[]
  genres: GenreBrief[]
}

const covers = [
  Images.SampleCoverA,
  Images.SampleCoverB,
  Images.SampleCoverC,
  Images.SampleCoverD,
  Images.SampleCoverE,
  Images.SampleCoverF,
  Images.SampleCoverG,
  Images.SampleCoverH,
  Images.SampleCoverI,
  Images.SampleCoverJ,
  Images.SampleCoverK,
]

const makePlaylists = (prefix: string, count: number): PlaylistBrief[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}_${i + 1}`,
    name: `${prefix} ${i + 1}`,
    tracks: Math.floor(Math.random() * 40) + 5,
    thumbnail: covers[i % covers.length],
  }))

const makeArtists = (count: number): ArtistBrief[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `artist_${i + 1}`,
    name: `Artist ${i + 1}`,
  }))

const makeAlbums = (count: number): AlbumBrief[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `album_${i + 1}`,
    name: `Album ${i + 1}`,
    artist: `Artist ${((i % 8) + 1)}`,
    cover: covers[i % covers.length],
  }))

const makeCreators = (count: number): CreatorBrief[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `creator_${i + 1}`,
    name: `Creator ${i + 1}`,
  }))

const makeReleases = (count: number): ReleaseBrief[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `release_${i + 1}`,
    title: `New Track ${i + 1}`,
    artist: `Artist ${((i % 10) + 1)}`,
    cover: covers[i % covers.length],
  }))

const makeGenres = (count: number): GenreBrief[] =>
  Array.from({ length: count }).map((_, i) => ({ id: `genre_${i+1}`, name: ['Pop','R&B','Hip-hop','EDM','Rock','Indie','Afrobeats','Jazz','Classical','Lo-fi'][i%10] }))

export const fetchDiscoverHome = async (): Promise<DiscoverHomeResponse> => {
  await new Promise((r) => setTimeout(r, 900))
  return {
    recommendedPlaylists: makePlaylists('Recommended', 12),
    trendingPlaylists: makePlaylists('Trending', 12),
    topArtists: makeArtists(12),
    topAlbums: makeAlbums(12),
    creators: makeCreators(12),
    newReleases: makeReleases(12),
    genres: makeGenres(12),
  }
}

export const fetchDiscoverSection = async (
  kind: 'recommended' | 'trending' | 'artists' | 'albums' | 'playlists' | 'creators' | 'releases' | 'genres',
): Promise<PlaylistBrief[] | ArtistBrief[] | AlbumBrief[] | CreatorBrief[] | ReleaseBrief[] | GenreBrief[]> => {
  await new Promise((r) => setTimeout(r, 900))
  if (kind === 'artists') return makeArtists(40)
  if (kind === 'albums') return makeAlbums(40)
  if (kind === 'creators') return makeCreators(30)
  if (kind === 'releases') return makeReleases(30)
  if (kind === 'genres') return makeGenres(24)
  return makePlaylists(kind === 'trending' ? 'Trending' : 'Playlist', 40)
}
