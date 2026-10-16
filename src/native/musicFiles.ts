import { NativeModules, Platform } from 'react-native'
import MusicFilesAndroid, {
  Constants as AndroidConstants,
  CoverImage,
  type ITrack,
  type ResponseShape,
  type SongOptions,
} from 'react-native-get-music-files-v3dev-test'

// primeCoverCache is a JS helper in the vendor shim; keep it optional for typings.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { primeCoverCache } = require('react-native-get-music-files-v3dev-test')

const NativeMusicLibrary = NativeModules.MusicLibrary

const normalizeResponse = (payload: any): ResponseShape<ITrack> => {
  if (payload && Array.isArray(payload.results)) {
    return { results: payload.results, length: payload.length ?? payload.results.length }
  }
  if (Array.isArray(payload)) {
    return { results: payload, length: payload.length }
  }
  return { results: [], length: 0 }
}

const primeCoversIfNeeded = (tracks: ITrack[]) => {
  if (!primeCoverCache || !Array.isArray(tracks) || tracks.length === 0) return
  primeCoverCache(tracks.map((t) => ({ path: t.path, cover: t.cover })))
}

const MusicFiles = {
  async getAll(options?: SongOptions): Promise<ResponseShape<ITrack>> {
    if (Platform.OS === 'ios' && NativeMusicLibrary?.getAll) {
      const response = await NativeMusicLibrary.getAll(options ?? {})
      const normalized = normalizeResponse(response)
      primeCoversIfNeeded(normalized.results)
      return normalized
    }
    return MusicFilesAndroid.getAll(options)
  },
  async search(options?: SongOptions): Promise<ResponseShape<ITrack>> {
    if (Platform.OS === 'ios' && NativeMusicLibrary?.search) {
      const response = await NativeMusicLibrary.search(options ?? {})
      const normalized = normalizeResponse(response)
      primeCoversIfNeeded(normalized.results)
      return normalized
    }
    return MusicFilesAndroid.search(options)
  },
  async getAlbums(options?: Record<string, unknown>): Promise<ResponseShape<any>> {
    if (Platform.OS === 'ios' && NativeMusicLibrary?.getAlbums) {
      return normalizeResponse(await NativeMusicLibrary.getAlbums(options ?? {}))
    }
    return MusicFilesAndroid.getAlbums(options)
  },
  async getArtists(): Promise<ResponseShape<Record<string, unknown>>> {
    if (Platform.OS === 'ios' && NativeMusicLibrary?.getArtists) {
      return normalizeResponse(await NativeMusicLibrary.getArtists())
    }
    return MusicFilesAndroid.getArtists()
  },
  async getSongs(): Promise<ResponseShape<ITrack>> {
    if (Platform.OS === 'ios' && NativeMusicLibrary?.getSongs) {
      return normalizeResponse(await NativeMusicLibrary.getSongs())
    }
    return MusicFilesAndroid.getSongs()
  },
  async getSongByPath(options: { path: string }): Promise<Partial<ITrack>> {
    if (Platform.OS === 'ios' && NativeMusicLibrary?.getSongByPath) {
      return NativeMusicLibrary.getSongByPath(options)
    }
    return MusicFilesAndroid.getSongByPath(options)
  },
  async getSongsByPaths(): Promise<ResponseShape<ITrack>> {
    if (Platform.OS === 'ios' && NativeMusicLibrary?.getSongsByPaths) {
      return normalizeResponse(await NativeMusicLibrary.getSongsByPaths())
    }
    return MusicFilesAndroid.getSongsByPaths()
  },
}

export const Constants = AndroidConstants
export { CoverImage }
export type { ITrack, ResponseShape, SongOptions }
export default MusicFiles
