import React from 'react'
import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
    innerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        height:150, 
        justifyContent: 'space-between', 
        marginVertical: 20, 
        marginRight: 24, 
        width: 300, 
        flexDirection: 'row',
        borderRadius: 24, 
        position: 'relative' 
    }
})