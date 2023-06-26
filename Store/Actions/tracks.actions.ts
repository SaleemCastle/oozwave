import { ADD_TRACKS, ADD_TRACKS_ERROR } from '../ReduxConstants';
import { ITrack } from './currentTrack.actions';

export const addTracks = (tracks: ITrack[]) => {
  return {
    type: ADD_TRACKS,
    payload: tracks
  }
}

export const addTracksError = (err: Error) => {
  return {
    type: ADD_TRACKS_ERROR,
    payload: err
  }
}