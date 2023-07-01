import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ITrack } from '../Store/Actions/currentTrack.actions'
import { type } from 'os'
import { ImageSourcePropType } from 'react-native'

export type RootStackParamList = {
    Onboarding: undefined,
    Library: undefined,
    Player: { selectedMusic: ITrack }
}

export type OnboardingProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>
export type LibraryProps = NativeStackScreenProps<RootStackParamList, 'Library'>
export type PlayerProps = NativeStackScreenProps<RootStackParamList, 'Player'>


export type DiscoverCardProps = {
    cover: ImageSourcePropType,
    title: string,
    id: number,
    bg: string
}