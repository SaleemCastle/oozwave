import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'
import { RectButton, Swipeable } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/Feather'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient'

import { ConfirmDialog, McImage, McText, NeonButton, NeonCard } from '../../Components'
import tokens from '../../theme/tokens'
import {
    playlistActions,
    selectAllPlaylists,
    selectPlaylistById,
    selectPlaylistTracks,
    Playlist,
    TrackRef,
} from '../../state/playlists'
import { formatRelativeUpdatedAt, generateId } from '../../state/playlists/utils'
import {
    startPlaylistPlayback,
    enqueuePlayNext,
    enqueueToQueue,
} from '../../state/playerQueue'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { PlaylistsStackParamList } from '../../types'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { Colors, Images } from '../../Constants'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'

const { colors, shadows } = tokens

type DetailRoute = RouteProp<PlaylistsStackParamList, 'PlaylistDetail'>

const PlaylistDetailScreen: React.FC = () => {
    const navigation = useNavigation()
    const route = useRoute<DetailRoute>()
    const { playlistId } = route.params
    const dispatch = useAppDispatch()

    const playlist = useAppSelector(selectPlaylistById(playlistId))
    const tracks = useAppSelector(selectPlaylistTracks(playlistId))
    const allPlaylists = useAppSelector(selectAllPlaylists)
    const libraryTracks = useAppSelector((state) => state.tracks as ITrack[] | undefined)
    const currentTrack = useAppSelector((state) => state.currentTrack as ITrack | undefined)

    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [moveTrackTarget, setMoveTrackTarget] = useState<TrackRef | null>(null)
    const [moveModalVisible, setMoveModalVisible] = useState(false)
    const [addTracksVisible, setAddTracksVisible] = useState(false)
    const [selectedAddIds, setSelectedAddIds] = useState<Set<string>>(new Set())

    const swipeRefs = useRef<Record<string, Swipeable | null>>({})

    useEffect(() => {
        if (!playlist) {
            navigation.goBack()
            return
        }
        dispatch(playlistActions.setSelectedPlaylist({ id: playlistId }))
    }, [dispatch, navigation, playlist, playlistId])

    const handleDuplicate = useCallback(() => {
        if (!playlist) {
            return
        }
        const newId = generateId()
        dispatch(playlistActions.duplicatePlaylist({ sourceId: playlist.id, id: newId }))
        navigation.navigate('PlaylistDetail', { playlistId: newId })
    }, [dispatch, navigation, playlist])

    const handleDeletePlaylist = useCallback(() => {
        dispatch(playlistActions.deletePlaylist({ id: playlistId }))
        setDeleteConfirm(false)
        navigation.goBack()
    }, [dispatch, navigation, playlistId])

    const handleMoveTrack = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (fromIndex === toIndex) {
                return
            }
            dispatch(playlistActions.moveTrack({ playlistId, fromIndex, toIndex }))
        },
        [dispatch, playlistId],
    )

    const closeSwipe = useCallback((id: string) => {
        swipeRefs.current[id]?.close()
    }, [])

    const handleRemoveTrack = useCallback(
        (trackId: string) => {
            dispatch(playlistActions.removeTrack({ playlistId, trackId }))
            closeSwipe(trackId)
        },
        [dispatch, playlistId, closeSwipe],
    )

    const handleOpenMoveModal = useCallback(
        (track: TrackRef) => {
            setMoveTrackTarget(track)
            setMoveModalVisible(true)
            closeSwipe(track.id)
        },
        [closeSwipe],
    )

    const otherPlaylists = useMemo(() => allPlaylists.filter((item) => item.id !== playlistId), [allPlaylists, playlistId])

    const handleMoveToPlaylist = useCallback(
        (targetId: string) => {
            if (!moveTrackTarget) {
                return
            }
            dispatch(playlistActions.removeTrack({ playlistId, trackId: moveTrackTarget.id }))
            dispatch(playlistActions.addTrack({ playlistId: targetId, trackId: moveTrackTarget.id }))
            setMoveModalVisible(false)
            setMoveTrackTarget(null)
        },
        [dispatch, moveTrackTarget, playlistId],
    )

    const handleAddTracks = useCallback(() => {
        const trackIds = Array.from(selectedAddIds)
        if (!trackIds.length) {
            setAddTracksVisible(false)
            return
        }
        dispatch(playlistActions.addTracks({ playlistId, trackIds }))
        setSelectedAddIds(new Set())
        setAddTracksVisible(false)
    }, [dispatch, playlistId, selectedAddIds])

    const handlePlayPlaylist = useCallback(() => {
        if (!tracks.length) {
            Alert.alert('Playlist empty', 'Add some tracks before playing.')
            return
        }
        dispatch(startPlaylistPlayback({ playlistId }))
        navigation.navigate('Player')
    }, [dispatch, navigation, playlistId, tracks.length])

    const handleTrackPress = useCallback(
        (track: TrackRef) => {
            closeSwipe(track.id)
            Alert.alert(
                track.title,
                'Choose what to do with this track.',
                [
                    {
                        text: 'Play from here',
                        onPress: () => {
                            dispatch(startPlaylistPlayback({ playlistId, startTrackId: track.id }))
                            navigation.navigate('Player')
                        },
                    },
                    {
                        text: 'Play next',
                        onPress: () => dispatch(enqueuePlayNext({ trackId: track.id })),
                    },
                    {
                        text: 'Add to queue',
                        onPress: () => dispatch(enqueueToQueue({ trackId: track.id })),
                    },
                    { text: 'Cancel', style: 'cancel' },
                ],
                { cancelable: true },
            )
        },
        [closeSwipe, dispatch, navigation, playlistId],
    )

    const toggleSelectTrack = useCallback((trackId: string) => {
        setSelectedAddIds((prev) => {
            const next = new Set(prev)
            if (next.has(trackId)) {
                next.delete(trackId)
            } else {
                next.add(trackId)
            }
            return next
        })
    }, [])

    const handleAddCurrentTrack = useCallback(() => {
        if (!currentTrack) {
            return
        }
        dispatch(playlistActions.addTrack({ playlistId, trackId: String(currentTrack.id) }))
    }, [currentTrack, dispatch, playlistId])

    const renderTrackItem = useCallback(
        ({ item, index, drag, isActive }: RenderItemParams<TrackRef>) => (
            <Swipeable
                ref={(ref) => {
                    swipeRefs.current[item.id] = ref
                }}
                renderLeftActions={() => (
                    <RectButton style={[styles.swipeAction, styles.moveAction]} onPress={() => handleOpenMoveModal(item)}>
                        <Icon name='folder-plus' size={ 18 } color={ colors.grey5 } />
                        <Text style={ styles.actionText }>Move</Text>
                    </RectButton>
                )}
                renderRightActions={() => (
                    <RectButton style={[styles.swipeAction, styles.deleteAction]} onPress={() => handleRemoveTrack(item.id)}>
                        <Icon name='trash-2' size={ 18 } color='#FFF' />
                        <Text style={ styles.actionText }>Delete</Text>
                    </RectButton>
                )}
            >
                <Pressable
                    onPress={ () => handleTrackPress(item) }
                    onLongPress={ drag }
                    disabled={ isActive }
                    style={[styles.trackRow, isActive ? styles.trackRowActive : null]}
                >
                    <View style={ styles.trackInfo }>
                        <Text style={ styles.trackTitle } numberOfLines={ 1 }>
                            { item.title }
                        </Text>
                        <Text style={ styles.trackMeta } numberOfLines={ 1 }>
                            { item.artist ?? 'Unknown artist' }
                        </Text>
                    </View>
                    <Text style={ styles.trackDuration }>
                        { item.duration ? formatDuration(item.duration) : '' }
                    </Text>
                    <Icon name='menu' size={ 18 } color='rgba(255,255,255,0.5)' />
                </Pressable>
            </Swipeable>
        ),
        [closeSwipe, handleOpenMoveModal, handleRemoveTrack, handleTrackPress],
    )

    if (!playlist) {
        return null
    }

    const trackCountLabel = `${playlist.trackIds.length} ${playlist.trackIds.length === 1 ? 'track' : 'tracks'}`
    const updatedLabel = formatRelativeUpdatedAt(playlist.updatedAt)
    const isCurrentTrackInPlaylist = currentTrack ? playlist.trackIds.includes(String(currentTrack.id)) : false

    return (
        <View style={ styles.screen }>
            <DraggableFlatList
                data={ tracks }
                keyExtractor={(item) => item.id }
                renderItem={ renderTrackItem }
                onDragEnd={({ from, to }) => handleMoveTrack(from, to) }
                activationDistance={ 12 }
                ListHeaderComponent={ (
                    <View style={ styles.headerContainer }>
                        <NeonCard accentColor={ playlist.color ?? colors.neonMagenta } style={ styles.metaCard }>
                            <View style={ styles.metaRow }>
                                <View style={[styles.playlistAvatar, { borderColor: playlist.color ?? colors.neonMagenta }]}>
                                    { playlist.emoji ? (
                                        <Text style={ styles.playlistEmoji }>{ playlist.emoji }</Text>
                                    ) : (
                                        <LinearGradient
                                            colors={[playlist.color ?? colors.neonMagenta, 'rgba(255,255,255,0.12)']}
                                            style={ styles.playlistGradient }
                                        />
                                    ) }
                                </View>
                                <View style={ styles.metaInfo }>
                                    <Text style={ styles.metaTitle } numberOfLines={ 1 }>
                                        { playlist.name }
                                    </Text>
                                    <Text style={ styles.metaSubtitle }>
                                    { trackCountLabel } - { updatedLabel }
                                    </Text>
                                    { playlist.description ? (
                                        <Text style={ styles.metaDescription } numberOfLines={ 2 }>
                                            { playlist.description }
                                        </Text>
                                    ) : null }
                                </View>
                            </View>
                            <View style={ styles.metaFooter }>
                                <Text style={ styles.privacyBadge }>
                                    { playlist.isPublic ? 'Public' : 'Private' }
                                </Text>
                            </View>
                        </NeonCard>
                        <View style={ styles.actionsRow }>
                            <NeonButton
                                title='Play'
                                onPress={ handlePlayPlaylist }
                                style={ styles.actionButton }
                                fullWidth
                                disabled={ !tracks.length }
                            />
                            <NeonButton
                                title='Edit'
                                variant='secondary'
                                onPress={ () => navigation.navigate('PlaylistEditor', { mode: 'edit', playlistId }) }
                                style={ styles.actionButton }
                                fullWidth
                            />
                            <NeonButton
                                title='Add tracks'
                                onPress={ () => setAddTracksVisible(true) }
                                style={ styles.actionButton }
                                fullWidth
                            />
                            <NeonButton
                                title='Duplicate'
                                variant='secondary'
                                onPress={ handleDuplicate }
                                style={ styles.actionButton }
                                fullWidth
                            />
                            <NeonButton
                                title='Delete'
                                variant='danger'
                                onPress={ () => setDeleteConfirm(true) }
                                style={ styles.actionButton }
                                fullWidth
                            />
                        </View>
                    </View>
                ) }
                ListFooterComponent={ (
                    <View style={ styles.footerSpace } />
                ) }
                contentContainerStyle={ styles.listContent }
                showsVerticalScrollIndicator={ false }
            />

            <View style={ styles.addCurrentContainer }>
                <NeonButton
                    title={ currentTrack ? 'Add current track' : 'Nothing playing' }
                    onPress={ handleAddCurrentTrack }
                    disabled={ !currentTrack || isCurrentTrackInPlaylist }
                    fullWidth
                    style={ styles.addCurrentButton }
                />
                { currentTrack && isCurrentTrackInPlaylist ? (
                    <Text style={ styles.helperText }>Current track already in playlist</Text>
                ) : null }
            </View>

            <ConfirmDialog
                visible={ deleteConfirm }
                title='Delete playlist?'
                message='This removes the playlist permanently.'
                confirmLabel='Delete'
                destructive
                onConfirm={ handleDeletePlaylist }
                onCancel={ () => setDeleteConfirm(false) }
            />

            <MoveModal
                visible={ moveModalVisible }
                track={ moveTrackTarget }
                playlists={ otherPlaylists }
                onClose={ () => {
                    setMoveModalVisible(false)
                    setMoveTrackTarget(null)
                } }
                onMove={ handleMoveToPlaylist }
            />

            <AddTracksModal
                visible={ addTracksVisible }
                tracks={ libraryTracks ?? [] }
                selectedIds={ selectedAddIds }
                onToggle={ toggleSelectTrack }
                onConfirm={ handleAddTracks }
                onClose={ () => {
                    setSelectedAddIds(new Set())
                    setAddTracksVisible(false)
                } }
            />
        </View>
    )
}

export default PlaylistDetailScreen

interface MoveModalProps {
    visible: boolean
    track: TrackRef | null
    playlists: Playlist[]
    onClose: () => void
    onMove: (playlistId: string) => void
}

const MoveModal: React.FC<MoveModalProps> = ({ visible, track, playlists, onClose, onMove }) => {
    if (!visible || !track) {
        return null
    }
    return (
        <Modal transparent visible animationType='fade' onRequestClose={ onClose }>
            <View style={ styles.modalOverlay }>
                <View style={ styles.modalCard }>
                    <Text style={ styles.modalTitle }>Move track</Text>
                    <Text style={ styles.modalSubtitle } numberOfLines={ 2 }>
                        { track.title }
                    </Text>
                    <ScrollView style={ styles.modalList }>
                        { playlists.map((playlist) => (
                            <Pressable
                                key={ playlist.id }
                                style={ styles.modalListItem }
                                onPress={ () => onMove(playlist.id) }
                            >
                                <Text style={ styles.modalListText }>{ playlist.name }</Text>
                                <Text style={ styles.modalListMeta }>
                                    { playlist.trackIds.length } tracks
                                </Text>
                            </Pressable>
                        )) }
                    </ScrollView>
                    <NeonButton title='Cancel' variant='ghost' onPress={ onClose } fullWidth />
                </View>
            </View>
        </Modal>
    )
}

interface AddTracksModalProps {
    visible: boolean
    tracks: ITrack[]
    selectedIds: Set<string>
    onToggle: (trackId: string) => void
    onConfirm: () => void
    onClose: () => void
}

const AddTracksModal: React.FC<AddTracksModalProps> = ({ visible, tracks, selectedIds, onToggle, onConfirm, onClose }) => {
    if (!visible) {
        return null
    }
    return (
        <Modal transparent visible animationType='slide' onRequestClose={ onClose }>
            <View style={ styles.modalOverlay }>
                <View style={ styles.addModalCard }>
                    <McText semi style={ styles.modalTitle }>Select tracks</McText>
                    <ScrollView style={ styles.modalList }>
                        { tracks.map((track) => {
                            const id = String(track.id)
                            const selected = selectedIds.has(id)
                            return (
                                <Pressable
                                    key={ id }
                                    style={[styles.addTrackRow, selected ? styles.addTrackRowSelected : null]}
                                    onPress={ () => onToggle(id) }
                                >
                                    <View style={{flexDirection: 'row', columnGap: 12}}>
                                        <CoverImage
                                            // @ts-ignore - library expects file path string
                                            source={ track.path }
                                            placeHolder={ Images.DefaultMusicIcon }
                                            width={ 40 }
                                            height={ 40 }
                                            style={styles.coverImage}
                                        />
                                        <View>
                                            <McText medium  style={ styles.addTrackTitle } numberOfLines={ 1 }>
                                                { track.title }
                                            </McText>
                                            <McText style={ styles.addTrackMeta } numberOfLines={ 1 }>
                                                { track.artist ?? 'Unknown artist' }
                                            </McText>
                                        </View>
                                    </View>
                                    { selected ? (
                                        <Icon name='check' size={ 18 } color={ colors.neonMagenta } />
                                    ) : null }
                                </Pressable>
                            )
                        }) }
                    </ScrollView>
                    <View style={ styles.modalActions }>
                        <NeonButton title='Cancel' variant='ghost' onPress={ onClose } style={ styles.modalActionButton } fullWidth />
                        <NeonButton
                            title='Add to playlist'
                            onPress={ onConfirm }
                            disabled={ !selectedIds.size }
                            fullWidth
                        />
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const formatDuration = (seconds: number) => {
    const total = Math.floor(seconds)
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    metaCard: {
        marginBottom: 24,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playlistAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 18,
    },
    playlistEmoji: {
        fontSize: 32,
    },
    playlistGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 36,
    },
    metaInfo: {
        flex: 1,
    },
    metaTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.grey5,
    },
    metaSubtitle: {
        marginTop: 6,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    metaDescription: {
        marginTop: 8,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    metaFooter: {
        marginTop: 16,
    },
    privacyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: colors.grey5,
        fontWeight: '600',
        fontSize: 12,
    },
    actionsRow: {
        flexDirection: 'column',
    },
    actionButton: {
        marginBottom: 12,
    },
    listContent: {
        paddingBottom: 140,
    },
    trackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(16,0,32,0.75)',
    },
    trackRowActive: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    trackInfo: {
        flex: 1,
        marginRight: 12,
    },
    trackTitle: {
        color: colors.grey5,
        fontSize: 16,
        fontWeight: '600',
    },
    trackMeta: {
        marginTop: 4,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
    },
    trackDuration: {
        marginRight: 12,
        color: 'rgba(255,255,255,0.6)',
        fontVariant: ['tabular-nums'],
    },
    swipeAction: {
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    moveAction: {
        backgroundColor: 'rgba(0,245,255,0.25)',
    },
    deleteAction: {
        backgroundColor: 'rgba(255,0,120,0.8)',
    },
    actionText: {
        color: '#FFF',
        marginLeft: 6,
        fontWeight: '600',
    },
    addCurrentContainer: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 36,
        ...shadows.neonPill,
    },
    addCurrentButton: {
        alignSelf: 'stretch',
    },
    helperText: {
        marginTop: 8,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        textAlign: 'center',
    },
    footerSpace: {
        height: 180,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: 'rgba(18,0,32,0.95)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        padding: 24,
    },
    modalTitle: {
        color: colors.pureWhite,
        marginBottom: 6
    },
    modalSubtitle: {
        marginTop: 8,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
    },
    modalList: {
        maxHeight: 460,
        marginBottom: 24,
    },
    modalListItem: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalListText: {
        color: colors.grey5,
        fontSize: 16,
        fontWeight: '600',
    },
    modalListMeta: {
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    addModalCard: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(18,0,32,0.95)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        padding: 24,
    },
    coverImage: {
        borderRadius: 6
    },
    addTrackRow: {
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4
        
    },
    addTrackRowSelected: {
        backgroundColor: 'rgba(255,0,200,0.12)',
        borderRadius: 4
    },
    addTrackTitle: {
        color: colors.lavenderFog,
        fontSize: 16,
    },
    addTrackMeta: {
        color: colors.glowMagenta,
        fontSize: 13,
        marginVertical: 4,
    },
    modalActions: {
        marginTop: 24,
    },
    modalActionButton: {
        marginBottom: 12,
    },
})
