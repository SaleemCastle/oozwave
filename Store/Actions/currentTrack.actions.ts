import { CURRENT_TRACK } from '../ReduxConstants';

export function setCurrentTrack(track: ITrack) {
  return {
    type: CURRENT_TRACK,
    payload: track
  }
}

export interface ITrack {
  album: string,
  artist: string,
  cover?: string | undefined,
  duration: number,
  id: number,
  path: string,
  title: string,
  error?: boolean,
  errorMsg?: Error
}