import { PLAYER_STATE } from '../ReduxConstants';

export function setCurrentPlayerState(state: string): IPlayerStateAction {
  return {
    type: PLAYER_STATE,
    payload: state
  }
}

export interface IPlayerStateAction {
  type: string
  payload: string
}