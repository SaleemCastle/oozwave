import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
    Pressable,
} from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'

import { ConfirmDialog, McText, NeonButton } from '../../Components'
import tokens from '../../theme/tokens'
import { playlistActions, selectAllPlaylists, selectPlaylistById } from '../../state/playlists'

import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import useId from '../../hooks/useId'
import { PlaylistsStackParamList } from '../../types'
import { generateId } from '../../state/playlists/utils'
import { Colors } from '../../Constants'

const { colors } = tokens

const COLOR_OPTIONS = ['#FF00C8', '#00F5FF', '#8A2EFF', '#00FFA3', '#FF6AD5', '#20C2FF']
const EMOJI_OPTIONS = ['🎧', '🎵', '🎶', '🎹', '🎷', '🎸', '🎼', '🥁']

type PlaylistEditorRoute = RouteProp<PlaylistsStackParamList, 'PlaylistEditor'>

type ModeConfig =
    | { mode: 'create'; playlistId?: undefined }
    | { mode: 'edit'; playlistId: string }

const PlaylistEditorModal: React.FC = () => {
    const navigation = useNavigation()
    const route = useRoute<PlaylistEditorRoute>()
    const params = route.params as ModeConfig
    const dispatch = useAppDispatch()

    const allPlaylists = useAppSelector(selectAllPlaylists)
    const editingPlaylist = useAppSelector(
        params.mode === 'edit' && params.playlistId
            ? selectPlaylistById(params.playlistId)
            : () => undefined,
    )

    const [name, setName] = useState(editingPlaylist?.name ?? '')
    const [description, setDescription] = useState(editingPlaylist?.description ?? '')
    const [color, setColor] = useState<string | undefined>(editingPlaylist?.color ?? COLOR_OPTIONS[0])
    const [emoji, setEmoji] = useState<string | undefined>(editingPlaylist?.emoji ?? EMOJI_OPTIONS[0])
    const [isPublic, setIsPublic] = useState(editingPlaylist?.isPublic ?? false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (params.mode === 'edit' && editingPlaylist) {
            setName(editingPlaylist.name)
            setDescription(editingPlaylist.description ?? '')
            setColor(editingPlaylist.color ?? COLOR_OPTIONS[0])
            setEmoji(editingPlaylist.emoji ?? EMOJI_OPTIONS[0])
            setIsPublic(editingPlaylist.isPublic)
        }
    }, [editingPlaylist, params.mode])

    const createIdRef = useRef<string>()
    if (params.mode === 'create' && !createIdRef.current) {
        createIdRef.current = generateId()
    }

    const title = params.mode === 'create' ? 'New playlist' : 'Edit playlist'

    const hasUnsavedChanges = useMemo(() => {
        if (params.mode === 'create') {
            return Boolean(name.trim() || description.trim())
        }
        if (!editingPlaylist) {
            return false
        }
        return (
            name.trim() !== editingPlaylist.name.trim() ||
            (description.trim() || '') !== (editingPlaylist.description ?? '').trim() ||
            (color ?? '') !== (editingPlaylist.color ?? '') ||
            (emoji ?? '') !== (editingPlaylist.emoji ?? '') ||
            isPublic !== editingPlaylist.isPublic
        )
    }, [color, description, editingPlaylist, emoji, isPublic, name, params.mode])

    const handleDismiss = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowCancelConfirm(true)
        } else {
            navigation.goBack()
        }
    }, [hasUnsavedChanges, navigation])

    const validateName = useCallback(
        (value: string) => {
            const trimmed = value.trim()
            if (!trimmed.length) {
                setError('Name is required')
                return false
            }
            const duplicate = allPlaylists.some((playlist) => {
                if (params.mode === 'edit' && playlist.id === params.playlistId) {
                    return false
                }
                return playlist.name.trim().toLowerCase() === trimmed.toLowerCase()
            })
            if (duplicate) {
                setError('A playlist with this name already exists')
                return false
            }
            setError(null)
            return true
        },
        [allPlaylists, params.mode, params.playlistId],
    )

    useEffect(() => {
        if (name.length) {
            validateName(name)
        }
    }, [name, validateName])

    const handleSave = useCallback(() => {
        const trimmedName = name.trim()
        if (!validateName(trimmedName)) {
            return
        }
        const trimmedDescription = description.trim()

        if (params.mode === 'create') {
            const newId = createIdRef.current ?? generateId()
            dispatch(
                playlistActions.createPlaylist({
                    id: newId,
                    name: trimmedName,
                    description: trimmedDescription,
                    color,
                    emoji,
                    isPublic,
                }),
            )
            navigation.replace('PlaylistDetail', { playlistId: newId })
            return
        }

        if (!params.playlistId) {
            return
        }

        if (trimmedName !== editingPlaylist?.name) {
            dispatch(playlistActions.renamePlaylist({ id: params.playlistId, name: trimmedName }))
        }

        dispatch(
            playlistActions.updatePlaylistMeta({
                id: params.playlistId,
                description: trimmedDescription,
                color,
                emoji,
                isPublic,
            }),
        )
        navigation.goBack()
    }, [
        color,
        description,
        dispatch,
        editingPlaylist?.name,
        emoji,
        isPublic,
        name,
        navigation,
        params.mode,
        params.playlistId,
        validateName,
    ])

    return (
        <KeyboardAvoidingView
            style={ styles.flex }
            behavior={ Platform.OS === 'ios' ? 'padding' : undefined }
        >
            <ScrollView contentContainerStyle={ styles.container } keyboardShouldPersistTaps='handled'>
                <McText extra size={24} color={colors.neonMagenta} style={ styles.title }>{ title }</McText>
                <McText semi color={colors.pureWhite} style={ styles.label }>Name</McText>
                <TextInput
                    value={ name }
                    onChangeText={ setName }
                    placeholder='Enter playlist name'
                    placeholderTextColor='rgb(255,255,255)'
                    style={[styles.input, error ? styles.inputError : null]}
                    returnKeyType='done'
                    autoFocus
                    autoCapitalize='sentences'
                />
                { error ? <Text style={ styles.error }>{ error }</Text> : null }

                <McText semi color={colors.pureWhite} style={ styles.label }>Description</McText>
                <TextInput
                    value={ description }
                    onChangeText={ setDescription }
                    placeholder='Add a vibe or mood'
                    placeholderTextColor='rgb(255,255,255)'
                    style={[styles.input, styles.multiline]}
                    multiline
                    numberOfLines={ 3 }
                    textAlignVertical='top'
                />

                <McText semi color={colors.pureWhite} style={ styles.label }>Accent color</McText>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={ false }
                    contentContainerStyle={ styles.optionsRow }
                    style={ styles.optionsCarousel }
                >
                    { COLOR_OPTIONS.map((option) => (
                        <Pressable
                            key={ option }
                            accessibilityRole='button'
                            accessibilityLabel={`Select color ${option}`}
                            onPress={ () => setColor(option) }
                            style={[styles.colorSwatch, { backgroundColor: option }, color === option ? styles.colorSwatchSelected : null]}
                        />
                    )) }
                </ScrollView>

                <McText semi color={colors.pureWhite} style={ styles.label }>Emoji</McText>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={ false }
                    contentContainerStyle={ styles.optionsRow }
                    style={ styles.optionsCarousel }
                >
                    { EMOJI_OPTIONS.map((option) => (
                        <Pressable
                            key={ option }
                            accessibilityRole='button'
                            accessibilityLabel={`Select emoji ${option}`}
                            onPress={ () => setEmoji(option) }
                            style={[styles.emojiButton, emoji === option ? styles.emojiSelected : null]}
                        >
                            <Text style={ styles.emojiText }>{ option }</Text>
                        </Pressable>
                    )) }
                </ScrollView>

                <View style={ styles.toggleRow }>
                    <McText semi color={colors.pureWhite}>Public playlist</McText>
                    <Switch
                        value={ isPublic }
                        onValueChange={ setIsPublic }
                        thumbColor={ isPublic ? colors.neonMagenta : '#444' }
                        trackColor={{ true: 'rgba(255,0,200,0.45)', false: 'rgba(255,255,255,0.24)' }}
                    />
                </View>

                <View style={ styles.actionsRow }>
                    <NeonButton title='Cancel' variant='ghost' onPress={ handleDismiss } fullWidth style={ styles.actionButton } />
                    <NeonButton
                        title={ params.mode === 'create' ? 'Create playlist' : 'Save changes' }
                        onPress={ handleSave }
                        disabled={ Boolean(error) }
                        fullWidth
                    />
                </View>
            </ScrollView>
            <ConfirmDialog
                visible={ showCancelConfirm }
                title='Discard changes?'
                message='You have unsaved edits. Are you sure you want to close?'
                cancelLabel='Keep editing'
                confirmLabel='Discard'
                destructive
                onCancel={ () => setShowCancelConfirm(false) }
                onConfirm={ () => {
                    setShowCancelConfirm(false)
                    navigation.goBack()
                } }
            />
        </KeyboardAvoidingView>
    )
}

export default PlaylistEditorModal

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        padding: 24,
        paddingBottom: 48,
    },
    title: {
        marginBottom: 12,
    },
    label: {
        marginTop: 20,
        marginBottom: 8,
    },
    input: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,0,200,0.25)',
        backgroundColor: Colors.purple800,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: colors.pureWhite,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#FF7D7D',
    },
    multiline: {
        minHeight: 96,
    },
    optionsCarousel: {
        marginTop: 8,
    },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
        paddingVertical:2,
        paddingLeft:2
    },
    colorSwatch: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.12)',
        marginRight: 12,
        marginBottom: 0,
    },
    colorSwatchSelected: {
        borderColor: colors.pureWhite,
        transform: [{ scale: 1.05 }],
    },
    emojiButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginBottom: 0,
    },
    emojiSelected: {
        borderColor: colors.neonMagenta,
        backgroundColor: 'rgba(255,0,200,0.18)',
    },
    emojiText: {
        fontSize: 24,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    toggleLabel: {
        fontSize: 16,
        color: colors.grey5,
        fontWeight: '600',
    },
    actionsRow: {
        marginTop: 36,
    },
    actionButton: {
        marginBottom: 16,
    },
    error: {
        color: '#FF8080',
        marginTop: 6,
    },
})

