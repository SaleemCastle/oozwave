import React, { useCallback } from 'react'
import { View, Switch, Pressable, StyleSheet } from 'react-native'
import styled from 'styled-components/native'
import { Colors } from '../../Constants'
import { McText } from '../../Components'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import {
  selectSettings,
  setMiniPlayerPlacement,
  setMiniPlayerTabSlot,
  setAutoplayNext,
  setWifiOnlyDownloads,
  setAudioQuality,
  setCrossfadeSeconds,
  setGapless,
  setHaptics,
  setShowLyrics,
  setExplicitContentFilter,
  setTheme,
  setNormalizeVolume,
  persistSettingsToStorage,
} from '../../state/settings'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { colors } from '../../theme/tokens'

type Props = NativeStackScreenProps<RootStackParamList, 'Preferences'>

const Row = styled.View`
  padding: 14px 24px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const SectionHeader = styled(McText)`
  margin: 16px 24px 8px;
`

const RadioOption: React.FC<{
  label: string
  selected: boolean
  onPress: () => void
}> = ({ label, selected, onPress }) => (
  <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={ onPress } style={ styles.radio }>
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      { selected ? <View style={ styles.radioInner } /> : null }
    </View>
    <McText medium size={14} color={ Colors.grey4 }>{ label }</McText>
  </Pressable>
)

const Preferences: React.FC<Props> = () => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)

  const setPlacement = useCallback((p: 'aboveTabBar' | 'mergeWithTabBar' | 'replaceTabBar') => {
    dispatch(setMiniPlayerPlacement(p))
    dispatch(persistSettingsToStorage())
  }, [dispatch])

  const toggle = useCallback(<K extends keyof typeof settings>(key: K) => {
    return (value: boolean) => {
      switch (key) {
        case 'autoplayNext':
          dispatch(setAutoplayNext(value)); break
        case 'wifiOnlyDownloads':
          dispatch(setWifiOnlyDownloads(value)); break
        case 'gapless':
          dispatch(setGapless(value)); break
        case 'haptics':
          dispatch(setHaptics(value)); break
        case 'showLyrics':
          dispatch(setShowLyrics(value)); break
        case 'explicitContentFilter':
          dispatch(setExplicitContentFilter(value)); break
        default:
          break
      }
      dispatch(persistSettingsToStorage())
    }
  }, [dispatch, settings])

  const setQuality = useCallback((q: 'auto' | 'low' | 'normal' | 'high') => {
    dispatch(setAudioQuality(q))
    dispatch(persistSettingsToStorage())
  }, [dispatch])

  const setCrossfade = useCallback((seconds: number) => {
    dispatch(setCrossfadeSeconds(seconds))
    dispatch(persistSettingsToStorage())
  }, [dispatch])

  const setThemePref = useCallback((t: 'system' | 'light' | 'dark') => {
    dispatch(setTheme(t))
    dispatch(persistSettingsToStorage())
  }, [dispatch])

  return (
    <Container>
      <Header>
        <McText extra size={22} color={colors.neonMagenta}>Preferences</McText>
      </Header>
      <SectionHeader medium size={16} color={ Colors.grey3 }>Mini Player Placement</SectionHeader>
      <Row>
        <RadioOption label="Above tab bar" selected={ settings.miniPlayerPlacement === 'aboveTabBar' } onPress={ () => setPlacement('aboveTabBar') } />
      </Row>
      <Row>
        <RadioOption label="Merge with tab bar" selected={ settings.miniPlayerPlacement === 'mergeWithTabBar' } onPress={ () => setPlacement('mergeWithTabBar') } />
      </Row>
      <Row>
        <RadioOption label="Replace tab bar" selected={ settings.miniPlayerPlacement === 'replaceTabBar' } onPress={ () => setPlacement('replaceTabBar') } />
      </Row>

      { settings.miniPlayerPlacement === 'mergeWithTabBar' && (
        <>
          <SectionHeader medium size={16} color={ Colors.grey3 }>Mini Player Tab Slot</SectionHeader>
          <Row>
            <RadioOption label="Current tab" selected={ settings.miniPlayerTabSlot === 'currentTab' } onPress={ () => { dispatch(setMiniPlayerTabSlot('currentTab')); dispatch(persistSettingsToStorage()) } } />
            <RadioOption label="Home tab" selected={ settings.miniPlayerTabSlot === 'homeTab' } onPress={ () => { dispatch(setMiniPlayerTabSlot('homeTab')); dispatch(persistSettingsToStorage()) } } />
          </Row>
        </>
      ) }

      <SectionHeader medium size={16} color={ Colors.grey3 }>Playback</SectionHeader>
      <Row>
        <McText medium size={14} color={ Colors.grey4 }>Autoplay next</McText>
        <Switch value={ settings.autoplayNext } onValueChange={ toggle('autoplayNext') } />
      </Row>
      <Row>
        <McText medium size={14} color={ Colors.grey4 }>Gapless playback</McText>
        <Switch value={ settings.gapless } onValueChange={ toggle('gapless') } />
      </Row>
      <Row>
        <McText medium size={14} color={ Colors.grey4 }>Haptics</McText>
        <Switch value={ settings.haptics } onValueChange={ toggle('haptics') } />
      </Row>

      <SectionHeader medium size={16} color={ Colors.grey3 }>Downloads</SectionHeader>
      <Row>
        <McText medium size={14} color={ Colors.grey4 }>Wi‑Fi only downloads</McText>
        <Switch value={ settings.wifiOnlyDownloads } onValueChange={ toggle('wifiOnlyDownloads') } />
      </Row>

      <SectionHeader medium size={16} color={ Colors.grey3 }>Theme</SectionHeader>
      <Row>
        <RadioOption label="System" selected={ settings.theme === 'system' } onPress={ () => setThemePref('system') } />
        <RadioOption label="Light" selected={ settings.theme === 'light' } onPress={ () => setThemePref('light') } />
        <RadioOption label="Dark" selected={ settings.theme === 'dark' } onPress={ () => setThemePref('dark') } />
      </Row>

      <SectionHeader medium size={16} color={ Colors.grey3 }>Audio Quality</SectionHeader>
      <Row>
        <RadioOption label="Auto" selected={ settings.audioQuality === 'auto' } onPress={ () => setQuality('auto') } />
        <RadioOption label="Low" selected={ settings.audioQuality === 'low' } onPress={ () => setQuality('low') } />
        <RadioOption label="Normal" selected={ settings.audioQuality === 'normal' } onPress={ () => setQuality('normal') } />
        <RadioOption label="High" selected={ settings.audioQuality === 'high' } onPress={ () => setQuality('high') } />
      </Row>

      <SectionHeader medium size={16} color={ Colors.grey3 }>Crossfade</SectionHeader>
      <Row>
        <RadioOption label="Off" selected={ settings.crossfadeSeconds === 0 } onPress={ () => setCrossfade(0) } />
        <RadioOption label={ '3s' } selected={ settings.crossfadeSeconds === 3 } onPress={ () => setCrossfade(3) } />
        <RadioOption label={ '6s' } selected={ settings.crossfadeSeconds === 6 } onPress={ () => setCrossfade(6) } />
        <RadioOption label={ '10s' } selected={ settings.crossfadeSeconds === 10 } onPress={ () => setCrossfade(10) } />
      </Row>

      <SectionHeader medium size={16} color={ Colors.grey3 }>Content</SectionHeader>
      <Row>
        <McText medium size={14} color={ Colors.grey4 }>Show lyrics</McText>
        <Switch value={ settings.showLyrics } onValueChange={ toggle('showLyrics') } />
      </Row>
      <Row>
        <McText medium size={14} color={ Colors.grey4 }>Filter explicit content</McText>
        <Switch value={ settings.explicitContentFilter } onValueChange={ toggle('explicitContentFilter') } />
      </Row>

      <SectionHeader medium size={16} color={ Colors.grey3 }>Advanced Audio</SectionHeader>
      <Row>
        <McText medium size={14} color={ Colors.grey4 }>Normalize volume</McText>
        <Switch value={ settings.normalizeVolume } onValueChange={ (v) => { dispatch(setNormalizeVolume(v)); dispatch(persistSettingsToStorage()) } } />
      </Row>
    </Container>
  )
}

const Container = styled.ScrollView`
  flex: 1;
  background-color: ${Colors.background};
`
const Header = styled.View`
  margin: 16px 24px 18px;
`

const styles = StyleSheet.create({
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
})

export default Preferences
