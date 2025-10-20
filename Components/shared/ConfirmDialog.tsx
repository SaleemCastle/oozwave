import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import tokens from '../../theme/tokens'
import NeonButton from './NeonButton'

const { colors, radii } = tokens

interface ConfirmDialogProps {
    visible: boolean
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
    onConfirm: () => void
    onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    onConfirm,
    onCancel,
}) => (
    <Modal
        animationType='fade'
        transparent
        visible={ visible }
        onRequestClose={ onCancel }
    >
        <View style={ styles.overlay }>
            <Pressable
                accessibilityRole='button'
                accessibilityLabel='Dismiss dialog'
                onPress={ onCancel }
                style={ StyleSheet.absoluteFill }
            />
            <View style={ styles.dialog }>
                { title ? <Text style={ styles.title }>{ title }</Text> : null }
                <Text style={ styles.message }>{ message }</Text>
                <View style={ styles.actions }>
                    <NeonButton
                        title={ cancelLabel }
                        onPress={ onCancel }
                        variant='ghost'
                        accessibilityLabel='Cancel dialog'
                        style={ styles.actionButton }
                        fullWidth
                    />
                    <NeonButton
                        title={ confirmLabel }
                        onPress={ onConfirm }
                        variant={ destructive ? 'danger' : 'primary' }
                        accessibilityLabel='Confirm action'
                        style={[styles.actionButton, styles.lastActionButton]}
                        fullWidth
                    />
                </View>
            </View>
        </View>
    </Modal>
)

export default ConfirmDialog

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    dialog: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: 'rgba(20, 0, 40, 0.95)',
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.neonMagentaSoft,
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.pureWhite,
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.88)',
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'column',
    },
    actionButton: {
        marginBottom: 12,
    },
    lastActionButton: {
        marginBottom: 0,
    },
})
