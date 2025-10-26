import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Switch, Animated, Easing, Pressable, Alert, AccessibilityInfo } from 'react-native'
import styled from 'styled-components/native'
import EqBandSlider from './components/EqBandSlider'
import EqFader from './components/EqFader'
import { Colors } from '../../Constants'
import { McText, McVectorIcon } from '../../Components'
import { colors as themeColors } from '../../theme/tokens'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { EQ_CENTER_FREQS } from '../../src/state/equalizer/eqTypes'
import { equalizerActions, applyBandThunk, applyPreampThunk, applyBypassThunk, applyPresetThunk } from '../../src/state/equalizer/eqSlice'
import { EQ_PRESETS } from '../../src/state/equalizer/eqPresets'

const formatFreq = (hz: number): string => (hz >= 1000 ? `${Math.round(hz/1000)}K` : `${hz}`)

const EqualizerScreen: React.FC = () => {
  const dispatch = useAppDispatch()
  const eq = useAppSelector((s) => (s as any).equalizer)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const bassBoost = eq?.bassBoost ?? 0
  const [presetOpen, setPresetOpen] = useState(false)
  const sheetY = useRef(new Animated.Value(300)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (mounted) setReducedMotion(!!v) })
    const sub: any = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setReducedMotion(!!v))
    return () => { mounted = false; sub?.remove?.() }
  }, [])

  const handleToggleBypass = useCallback((val: boolean) => {
    dispatch(equalizerActions.setBypass(val))
    dispatch(applyBypassThunk(val))
  }, [dispatch])

  const handlePreamp = useCallback((val: number) => {
    const snapped = Math.abs(val) < 0.25 ? 0 : val
    dispatch(equalizerActions.setPreamp(snapped))
    dispatch(applyPreampThunk(snapped))
  }, [dispatch])

  const handleBand = useCallback((index: number, val: number) => {
    const snapped = Math.abs(val) < 0.25 ? 0 : val
    dispatch(equalizerActions.setBand({ index, gainDb: snapped }))
    dispatch(applyBandThunk({ index, gainDb: snapped }))
  }, [dispatch])

  const handlePreset = useCallback((name: keyof typeof EQ_PRESETS) => {
    dispatch(applyPresetThunk(name))
  }, [dispatch])

  const onBassBoostChange = useCallback((v: number) => {
    dispatch(equalizerActions.setBassBoost(v))
    const idxs = [0,1]
    idxs.forEach((i) => {
      const base = (eq?.bands?.[i] ?? 0)
      const next = base + v
      dispatch(equalizerActions.setBand({ index: i, gainDb: next }))
      dispatch(applyBandThunk({ index: i, gainDb: next }))
    })
  }, [dispatch, eq?.bands])

  const disabled = !!eq?.bypass
  const bandsToShow = useMemo(() => EQ_CENTER_FREQS.slice(0, 7), [])

  const openPresetSheet = () => {
    setPresetOpen(true)
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start()
  }
  const closePresetSheet = () => {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 300, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) setPresetOpen(false) })
  }
  const handleSelectPreset = (name: keyof typeof EQ_PRESETS) => {
    handlePreset(name)
    closePresetSheet()
  }

  return (
    <Container>
      <Header>
        <McText extra size={22} color={themeColors.neonMagenta}>Equalizer</McText>
      </Header>

      <Row style={{ marginHorizontal: 24, marginBottom: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <PresetDropdown onPress={openPresetSheet}>
          <McText medium size={12} color={themeColors.neonMagenta}>
            {eq?.preset || 'Preset'}
          </McText>
          <McVectorIcon type="Feather" name="chevron-down" color={themeColors.neonMagenta} size={16} />
        </PresetDropdown>
        <Row>
          <McText size={12} color={themeColors.neonMagenta} style={{ marginRight: 8 }}>Bypass</McText>
          <Switch value={!!eq?.bypass} onValueChange={handleToggleBypass} />
        </Row>
      </Row>

      {/* Integrate grid directly into background (no card) */}
      <GridArea pointerEvents={disabled ? 'none' : 'auto'} style={{ opacity: disabled ? 0.5 : 1 }}>
        {bandsToShow.map((_, i) => (
          <GridLine key={`v-${i}`} style={{ left: `${(i+0.5) * (100 / bandsToShow.length)}%` }} />
        ))}
        <ZeroLine />
        <BandsRow>
          {bandsToShow.map((f, i) => (
            <EqBandSlider
              key={f}
              index={i}
              value={eq?.bands?.[i] ?? 0}
              min={-12}
              max={12}
              label={['50','100','200','250','500','1K','2K'][i] || formatFreq(f)}
              onChange={(v) => handleBand(i, v)}
              onRelease={() => void 0}
              disabled={false}
              active={activeIndex === i}
              onActiveChange={(a) => setActiveIndex(a ? i : null)}
              height={220}
              reducedMotion={reducedMotion}
            />
          ))}
        </BandsRow>
      </GridArea>

      <Section>
        <McText medium size={14} color={themeColors.neonMagenta} style={{ marginBottom: 8 }}>Bass boost</McText>
        <EqFader
          value={bassBoost}
          min={-6}
          max={6}
          onChange={onBassBoostChange}
          onRelease={() => void 0}
          title={''}
          disabled={disabled}
          width={300}
        />
      </Section>

      <Section>
        <McText medium size={14} color={themeColors.neonMagenta} style={{ marginBottom: 8 }}>Preamp</McText>
        <EqFader
          value={eq?.preamp ?? 0}
          min={-12}
          max={12}
          onChange={handlePreamp}
          onRelease={() => void 0}
          title={''}
          disabled={disabled}
          width={300}
        />
      </Section>

      {presetOpen && (
        <PresetBackdrop as={Animated.View} style={{ opacity: backdropOpacity }}>
          <Pressable style={{ flex: 1 }} onPress={closePresetSheet} />
          <Animated.View style={{ transform: [{ translateY: sheetY }] }}>
            <PresetSheet>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <McText medium size={14} color={themeColors.neonMagenta}>Presets</McText>
                <Pressable onPress={() => Alert.alert('Create preset', 'Coming soon') } hitSlop={8}>
                  <McVectorIcon type="Feather" name="plus-circle" color={themeColors.neonMagenta} size={18} />
                </Pressable>
              </Row>
              <PresetList>
                {Object.keys(EQ_PRESETS).map((name) => (
                  <PresetItem key={name} onPress={() => handleSelectPreset(name as keyof typeof EQ_PRESETS)}>
                    <Row>
                      <McText medium size={12} color={eq?.preset === name ? themeColors.neonMagenta : Colors.grey4}>
                        {name}
                      </McText>
                    </Row>
                    {eq?.preset === name && (
                      <McVectorIcon type="Feather" name="check" color={Colors.accent} size={16} />
                    )}
                  </PresetItem>
                ))}
              </PresetList>
            </PresetSheet>
          </Animated.View>
        </PresetBackdrop>
      )}
    </Container>
  )
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${Colors.background};
`

const Header = styled.View`
  margin: 16px 24px 8px;
  align-items: center;
`

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`

const GridOverlay = styled.View`
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
`

const GridLine = styled.View`
  position: absolute;
  width: 1px;
  top: 0; bottom: 0;
  background-color: rgba(255,255,255,0.08);
`

const ZeroLine = styled.View`
  position: absolute;
  left: 0; right: 0;
  top: 50%;
  height: 1px;
  background-color: rgba(255,255,255,0.2);
`

const BandsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
`

const GridArea = styled.View`
  margin: 0 24px;
  height: 260px;
  position: relative;
  justify-content: flex-end;
`

const Section = styled.View`
  margin: 20px 24px 0px;
`

const PresetDropdown = styled.Pressable`
  flex-direction: row;
  align-items: center;
  column-gap: 6px;
  background-color: rgba(20,0,40,0.66);
  border: 1px solid rgba(255,255,255,0.14);
  padding: 8px 12px;
  border-radius: 12px;
`

const PresetBackdrop = styled.View`
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  justify-content: flex-end;
`

const PresetSheet = styled.View`
  background-color: rgba(20,0,40,0.9);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border-top-width: 1px;
  border-color: rgba(255,255,255,0.14);
  padding: 16px;
`

const PresetList = styled.ScrollView`
  max-height: 280px;
`

const PresetItem = styled.Pressable`
  padding: 12px 4px;
  border-bottom-width: 1px;
  border-color: rgba(255,255,255,0.08);
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

export default EqualizerScreen

