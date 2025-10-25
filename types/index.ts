import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ImageSourcePropType } from 'react-native'

export type PlaylistsStackParamList = {
    Playlists: undefined
    PlaylistDetail: { playlistId: string }
    PlaylistEditor: { mode: 'create' } | { mode: 'edit'; playlistId: string }
}

export type RootStackParamList = {
    Onboarding: undefined
    Library: undefined
    Player: undefined
    Billboards: { info: IBillboardProps }
    Discover: undefined
    DiscoverSection: { kind: 'recommended' | 'trending' | 'artists' | 'albums' | 'playlists' | 'creators' | 'releases' | 'genres'; title: string }
    Playlists: undefined
    PlaylistDetail: { playlistId: string }
    PlaylistEditor: { mode: 'create' } | { mode: 'edit'; playlistId: string }
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

export interface  IBillboardCardProps {
    artist: string,
    detail: string,
    last_week: string,
    peak_position: string,
    rank: string,
    title: string,
    weeks_at_no1?: string,
    weeks_on_chart: string
}

export enum PermissionStatus {
    GRANTED = 'granted',
    UNDETERMINED = 'undetermined',
    DENIED = 'denied',
}
