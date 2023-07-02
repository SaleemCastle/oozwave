import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ITrack } from '../Store/Actions/currentTrack.actions'
import { type } from 'os'
import { ImageSourcePropType } from 'react-native'

export type RootStackParamList = {
    Onboarding: undefined,
    Library: undefined,
    Player: { selectedMusic: ITrack },
    Billboards: { info: IBillboardProps }
}

export type OnboardingProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>
export type LibraryProps = NativeStackScreenProps<RootStackParamList, 'Library'>
export type PlayerProps = NativeStackScreenProps<RootStackParamList, 'Player'>
export type BillboardsProps = NativeStackScreenProps<RootStackParamList, 'Billboards'>


export type DiscoverCardProps = {
    cover: ImageSourcePropType,
    title: string,
    id: number,
    bg: string,
    onPress: () => void
}

export interface IBillboardProps {
    title: string
}

export interface IBillboardCardProps {
    artist: string,
    detail: string,
    last_week: string,
    peak_position: string,
    rank: string,
    title: string,
    weeks_at_no1?: string,
    weeks_on_chart: string
}