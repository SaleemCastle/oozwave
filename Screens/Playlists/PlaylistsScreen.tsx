import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    FlatList,
    Modal,
    Pressable,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { StackNavigationProp } from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'

import { ConfirmDialog, McText, NeonButton, NeonCard } from '../../Components'
import tokens from '../../theme/tokens'
import {
    playlistActions,
    selectSortedAndFilteredPlaylists,
    selectSelectedPlaylist,
    importPlaylistsFromJson,
    SortBy,
    Playlist,
} from '../../state/playlists'
import { formatRelativeUpdatedAt, generateId } from '../../state/playlists/utils'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { PlaylistsStackParamList } from '../../types'
import { Colors } from '../../Constants'

const { colors, shadows } = tokens

const SORT_OPTIONS: Array<{ label: string; value: SortBy; icon: string }> = [
    { label: 'Recent', value: 'recent', icon: 'clock' },
    { label: 'Name', value: 'name', icon: 'type' },
    { label: 'Size', value: 'size', icon: 'list' },
]

type NavigationProp = StackNavigationProp<PlaylistsStackParamList, 'Playlists'>

const PlaylistsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>()
    const dispatch = useAppDispatch()
    const playlists = useAppSelector(selectSortedAndFilteredPlaylists)
    const selectedPlaylist = useAppSelector(selectSelectedPlaylist)
    const sortBy = useAppSelector((state) => state.playlists.sortBy)
    const searchQuery = useAppSelector((state) => state.playlists.searchQuery)

    const [localQuery, setLocalQuery] = useState(searchQuery)
    const [optionsTarget, setOptionsTarget] = useState<Playlist | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Playlist | null>(null)
    const [sortMenuVisible, setSortMenuVisible] = useState(false)
    const [importVisible, setImportVisible] = useState(false)
    const [importText, setImportText] = useState('')
    const [importError, setImportError] = useState<string | null>(null)
    const [importLoading, setImportLoading] = useState(false)

    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        setLocalQuery(searchQuery)
    }, [searchQuery])

    const handleSearchChange = useCallback(
        (value: string) => {
            setLocalQuery(value)
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
            debounceRef.current = setTimeout(() => {
                dispatch(playlistActions.setSearchQuery(value))
            }, 180)
        },
        [dispatch],
    )

    const handleSelectSort = useCallback(
        (value: SortBy) => {
            dispatch(playlistActions.setSortBy(value))
            setSortMenuVisible(false)
        },
        [dispatch],
    )

    const handleOpenPlaylist = useCallback(
        (playlist: Playlist) => {
            dispatch(playlistActions.setSelectedPlaylist({ id: playlist.id }))
            navigation.navigate('PlaylistDetail', { playlistId: playlist.id })
        },
        [dispatch, navigation],
    )

    const handleCreatePlaylist = useCallback(() => {
        navigation.navigate('PlaylistEditor', { mode: 'create' })
    }, [navigation])

    const handleDuplicate = useCallback(
        (playlist: Playlist) => {
            const newId = generateId()
            dispatch(playlistActions.duplicatePlaylist({ sourceId: playlist.id, id: newId }))
            navigation.navigate('PlaylistDetail', { playlistId: newId })
            setOptionsTarget(null)
        },
        [dispatch, navigation],
    )

    const handleDelete = useCallback(() => {
        if (!showDeleteConfirm) {
            return
        }
        dispatch(playlistActions.deletePlaylist({ id: showDeleteConfirm.id }))
        setShowDeleteConfirm(null)
    }, [dispatch, showDeleteConfirm])

    const handleSharePlaylist = useCallback(async (playlist: Playlist) => {
        try {
            await Share.share({
                title: `${playlist.name} playlist`,
                message: JSON.stringify([playlist], null, 2),
            })
        } catch (error) {
            console.warn('Failed to share playlist', error)
        }
    }, [])

    const handleShareAll = useCallback(async () => {
        try {
            await Share.share({ title: 'Playlists export', message: JSON.stringify(playlists, null, 2) })
        } catch (error) {
            console.warn('Failed to share playlists', error)
        }
    }, [playlists])

    const handleImport = useCallback(async () => {
        if (!importText.trim()) {
            setImportError('Please paste playlist JSON')
            return
        }
        setImportLoading(true)
        setImportError(null)
        try {
            const result = await dispatch(importPlaylistsFromJson(importText)).unwrap()
            if (result.playlists.length === 0) {
                setImportError('No playlists found in JSON')
            } else {
                setImportVisible(false)
                setImportText('')
            }
        } catch (error) {
            setImportError(typeof error === 'string' ? error : 'Unable to import playlists')
        } finally {
            setImportLoading(false)
        }
    }, [dispatch, importText])

    const renderPlaylist = useCallback(
        ({ item }: { item: Playlist }) => {
            const trackCount = item.trackIds.length
            const updatedLabel = formatRelativeUpdatedAt(item.updatedAt)
            const accentColor = item.color ?? colors.neonMagenta
            const isSelected = selectedPlaylist?.id === item.id
            const metaLabel = trackCount === 1 ? '1 track' : `${trackCount} tracks`

            return (
                <NeonCard
                    accentColor={ accentColor }
                    onPress={ () => handleOpenPlaylist(item) }
                    style={[styles.playlistCard, isSelected ? styles.selectedCard : null]}
                >
                    <View style={ styles.cardContent }>
                        <View style={ styles.cardHeader }>
                            <View style={[styles.recordArt, { borderColor: accentColor }] }>
                                { item.emoji ? (
                                    <Text style={ styles.recordEmoji }>{ item.emoji }</Text>
                                ) : (
                                    <LinearGradient
                                        colors={[accentColor, 'rgba(255,255,255,0.2)']}
                                        style={ styles.recordGradient }
                                    >
                                        <View style={ styles.recordLabel } />
                                    </LinearGradient>
                                ) }
                            </View>

                            <Pressable
                                accessibilityRole='button'
                                accessibilityLabel='Open playlist options'
                                hitSlop={ 12 }
                                onPress={ () => setOptionsTarget(item) }
                                style={ styles.cardMenuButton }
                            >
                                <Icon name='more-vertical' size={ 20 } color='rgba(255,255,255,0.7)' />
                            </Pressable>
                        </View>

                        <View style={ styles.cardInfo }>
                            <McText semi style={ styles.cardTitle } numberOfLines={ 1 }>
                                { item.name }
                            </McText>
                            <McText medium style={ styles.cardMeta } numberOfLines={ 1 }>
                                { `${metaLabel} - ${updatedLabel}` }
                            </McText>
                        </View>
                    </View>
                </NeonCard>
            )
        },
        [handleOpenPlaylist, selectedPlaylist?.id],
    )

    const emptyState = useMemo(
        () => (
            <View style={ styles.emptyState }>
                <Text style={ styles.emptyEmoji }>🎵</Text>
                <McText size={22} extra color={colors.neonMagenta}>No playlists yet</McText>
                <McText bold style={ styles.emptySubtitle }>
                    Build your first mix to keep the vibes flowing.
                </McText>
                <NeonButton title='Create playlist' onPress={ handleCreatePlaylist } style={ styles.emptyButton } />
            </View>
        ),
        [handleCreatePlaylist],
    )

    return (
        <View style={ styles.screen }>
            <View style={ styles.header }>
                <McText extra size={28} color={colors.neonMagenta}>Playlists</McText>
                <View style={ styles.headerActions }>
                    <Pressable
                        accessibilityRole='button'
                        accessibilityLabel='Import playlists from JSON'
                        onPress={ () => setImportVisible(true) }
                        style={ styles.headerIconButton }
                        hitSlop={ 12 }
                    >
                        <Icon name='download' size={ 18 } color={ colors.grey5 } />
                    </Pressable>
                    <Pressable
                        accessibilityRole='button'
                        accessibilityLabel='Share playlists JSON'
                        onPress={ handleShareAll }
                        style={ styles.headerIconButton }
                        hitSlop={ 12 }
                    >
                        <Icon name='share-2' size={ 18 } color={ colors.grey5 } />
                    </Pressable>
                </View>
            </View>

            <View style={ styles.searchRow }>
                <Icon name='search' size={ 18 } color='rgb(255,255,255)' />
                <TextInput
                    style={ styles.searchInput }
                    placeholder='Search playlists'
                    placeholderTextColor='rgb(255,255,255)'
                    value={ localQuery }
                    onChangeText={ handleSearchChange }
                    accessibilityLabel='Search playlists'
                />
                <Pressable
                    accessibilityRole='button'
                    accessibilityLabel='Change sort order'
                    onPress={ () => setSortMenuVisible(true) }
                    hitSlop={ 12 }
                    style={ styles.sortPill }
                >
                    <Text style={ styles.sortText }>{ SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Sort' }</Text>
                    <Icon name='chevron-down' size={ 16 } color={ colors.pureWhite } />
                </Pressable>
            </View>

            { playlists.length === 0 ? (
                emptyState
            ) : (
                <FlatList
                    data={ playlists }
                    keyExtractor={ (item) => item.id }
                    renderItem={ renderPlaylist }
                    contentContainerStyle={ styles.list }
                    showsVerticalScrollIndicator={ false }
                />
            ) }

            <Pressable
                style={ styles.fab }
                accessibilityRole='button'
                accessibilityLabel='Create playlist'
                onPress={ handleCreatePlaylist }
            >
                <LinearGradient colors={[colors.neonMagenta, colors.cyanPulse]} style={ styles.fabGradient }>
                    <Icon name='plus' size={ 24 } color={ colors.pureWhite } />
                </LinearGradient>
            </Pressable>

            <OptionsSheet
                playlist={ optionsTarget }
                onClose={ () => setOptionsTarget(null) }
                onRename={ (playlist) => {
                    navigation.navigate('PlaylistEditor', { mode: 'edit', playlistId: playlist.id })
                    setOptionsTarget(null)
                } }
                onDuplicate={ handleDuplicate }
                onDelete={ (playlist) => {
                    setOptionsTarget(null)
                    setShowDeleteConfirm(playlist)
                } }
                onShare={ (playlist) => {
                    setOptionsTarget(null)
                    handleSharePlaylist(playlist)
                } }
                onOpen={ (playlist) => {
                    setOptionsTarget(null)
                    handleOpenPlaylist(playlist)
                } }
            />

            <SortSheet
                visible={ sortMenuVisible }
                current={ sortBy }
                onClose={ () => setSortMenuVisible(false) }
                onSelect={ handleSelectSort }
            />

            <ImportModal
                visible={ importVisible }
                value={ importText }
                loading={ importLoading }
                error={ importError }
                onChange={ setImportText }
                onClose={ () => {
                    setImportVisible(false)
                    setImportError(null)
                } }
                onImport={ handleImport }
            />

            <ConfirmDialog
                visible={ Boolean(showDeleteConfirm) }
                title='Delete playlist?'
                message={`"${showDeleteConfirm?.name ?? ''}" will be removed. You can't undo this.`}
                confirmLabel='Delete'
                destructive
                onConfirm={ handleDelete }
                onCancel={ () => setShowDeleteConfirm(null) }
            />
        </View>
    )
}

export default PlaylistsScreen

interface OptionsSheetProps {
    playlist: Playlist | null
    onClose: () => void
    onOpen: (playlist: Playlist) => void
    onRename: (playlist: Playlist) => void
    onDuplicate: (playlist: Playlist) => void
    onDelete: (playlist: Playlist) => void
    onShare: (playlist: Playlist) => void
}

const OptionsSheet: React.FC<OptionsSheetProps> = ({ playlist, onClose, onOpen, onRename, onDuplicate, onDelete, onShare }) => {
    if (!playlist) {
        return null
    }

    return (
        <Modal transparent visible onRequestClose={ onClose } animationType='fade'>
            <View style={ styles.sheetOverlay }>
                <Pressable style={ StyleSheet.absoluteFill } onPress={ onClose } />
                <View style={ styles.sheet }>
                    <SheetButton label='View details' icon='music' onPress={ () => onOpen(playlist) } />
                    <SheetButton label='Rename' icon='edit-2' onPress={ () => onRename(playlist) } />
                    <SheetButton label='Duplicate' icon='copy' onPress={ () => onDuplicate(playlist) } />
                    <SheetButton label='Share JSON' icon='share-2' onPress={ () => onShare(playlist) } />
                    <SheetButton
                        label='Delete'
                        icon='trash-2'
                        accentColor='#FF7D7D'
                        onPress={ () => onDelete(playlist) }
                    />
                </View>
            </View>
        </Modal>
    )
}

interface SheetButtonProps {
    label: string
    icon: string
    onPress: () => void
    accentColor?: string
}

const SheetButton: React.FC<SheetButtonProps> = ({ label, icon, onPress, accentColor = colors.grey5 }) => (
    <Pressable style={ styles.sheetButton } onPress={ onPress }>
        <Icon name={ icon } size={ 18 } color={ accentColor } />
        <Text style={[styles.sheetLabel, { color: accentColor }]}>{ label }</Text>
    </Pressable>
)

interface SortSheetProps {
    visible: boolean
    current: SortBy
    onSelect: (value: SortBy) => void
    onClose: () => void
}

const SortSheet: React.FC<SortSheetProps> = ({ visible, current, onSelect, onClose }) => {
    if (!visible) {
        return null
    }
    return (
        <Modal transparent visible animationType='fade' onRequestClose={ onClose }>
            <View style={ styles.sheetOverlay }>
                <Pressable style={ StyleSheet.absoluteFill } onPress={ onClose } />
                <View style={ styles.sheet }>
                    { SORT_OPTIONS.map((option) => (
                        <Pressable
                            key={ option.value }
                            style={ styles.sheetButton }
                            onPress={ () => onSelect(option.value) }
                        >
                            <Icon
                                name={ option.value === current ? 'check' : option.icon }
                                size={ 18 }
                                color={ option.value === current ? colors.neonMagenta : 'rgba(255,255,255,0.6)' }
                            />
                            <Text
                                style={[
                                    styles.sheetLabel,
                                    option.value === current ? styles.sheetLabelActive : null,
                                ]}
                            >
                                { option.label }
                            </Text>
                        </Pressable>
                    )) }
                </View>
            </View>
        </Modal>
    )
}

interface ImportModalProps {
    visible: boolean
    value: string
    loading: boolean
    error: string | null
    onChange: (value: string) => void
    onImport: () => void
    onClose: () => void
}

const ImportModal: React.FC<ImportModalProps> = ({ visible, value, loading, error, onChange, onImport, onClose }) => {
    if (!visible) {
        return null
    }
    return (
        <Modal transparent visible animationType='fade' onRequestClose={ onClose }>
            <View style={ styles.importOverlay }>
                <View style={ styles.importCard }>
                    <Text style={ styles.importTitle }>Import playlists</Text>
                    <Text style={ styles.importHint }>Paste JSON exported from another device.</Text>
                    <TextInput
                        value={ value }
                        onChangeText={ onChange }
                        style={ styles.importInput }
                        placeholder='[ { "id": "...", "name": "" } ]'
                        placeholderTextColor='rgba(255,255,255,0.35)'
                        multiline
                        numberOfLines={ 6 }
                        textAlignVertical='top'
                    />
                    { error ? <Text style={ styles.importError }>{ error }</Text> : null }
                    <View style={ styles.importActions }>
                        <NeonButton title='Cancel' variant='ghost' onPress={ onClose } style={ styles.importButton } fullWidth />
                        <NeonButton
                            title={ loading ? 'Importing...' : 'Import' }
                            onPress={ onImport }
                            disabled={ loading }
                            fullWidth
                        />
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.neonMagenta,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    searchInput: {
        flex: 1,
        marginHorizontal: 12,
        paddingVertical: 12,
        color: colors.grey5,
    },
    sortPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    sortText: {
        color: colors.pureWhite,
        fontWeight: '600',
        marginRight: 6,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 160,
    },
    playlistCard: {
        width: 150,
        height: 150,
        marginBottom: 24,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    recordArt: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    recordEmoji: {
        fontSize: 20,
    },
    recordGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordLabel: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.75)',
        opacity: 0.9,
    },
    cardInfo: {
        marginTop: 'auto',
    },
    cardTitle: {
        color: colors.pureWhite,
        fontSize: 18,
        marginBottom: 6,
    },
    cardMeta: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
    },
    cardMenuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.12)',
    },
    selectedCard: {
        borderColor: colors.neonMagenta,
        // borderWidth: 2,
    },
    fab: {
        position: 'absolute',
        bottom: 36,
        right: 24,
        ...shadows.neonPill,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 22,
        color: colors.neonMagenta
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        alignSelf: 'stretch',
    },
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: 'rgba(18, 0, 32, 0.96)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    sheetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    sheetLabel: {
        marginLeft: 12,
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16,
        fontWeight: '600',
    },
    sheetLabelActive: {
        color: colors.neonMagenta,
    },
    importOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    importCard: {
        width: '100%',
        backgroundColor: 'rgba(18,0,32,0.95)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        padding: 24,
    },
    importTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.grey5,
        marginBottom: 8,
    },
    importHint: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
    },
    importInput: {
        minHeight: 140,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: 16,
        color: colors.grey5,
        fontSize: 14,
    },
    importError: {
        color: '#FF8080',
        marginTop: 12,
    },
    importActions: {
        marginTop: 24,
    },
    importButton: {
        marginBottom: 12,
    },
})
