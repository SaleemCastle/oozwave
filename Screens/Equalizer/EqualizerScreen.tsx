import React, { useCallback } from 'react'
import { ScrollView, Switch } from 'react-native'
import Slider from '@react-native-community/slider'
import styled from 'styled-components/native'

import { Colors } from '../../Constants'
import { McText } from '../../Components'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { EQ_CENTER_FREQS } from '../../src/state/equalizer/eqTypes'
import { equalizerActions, applyBandThunk, applyPreampThunk, applyBypassThunk, applyPresetThunk } from '../../src/state/equalizer/eqSlice'
import { EQ_PRESETS } from '../../src/state/equalizer/eqPresets'

const gainToLabel = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const EqualizerScreen: React.FC = () => {
  const dispatch = useAppDispatch()
  const eq = useAppSelector((s) => (s as any).equalizer)

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

  const disabled = !eq?.available

  return (
    <Container>
      <HeaderRow>
        <McText extra size={22} color={Colors.primary}>Equalizer</McText>
        <Row>
          <McText size={12} color={Colors.grey4} style={{ marginRight: 8 }}>Bypass</McText>
          <Switch value={eq?.bypass} onValueChange={handleToggleBypass} />
        </Row>
      </HeaderRow>

      {!eq?.available && (
        <Notice>
          <McText size={12} color={Colors.grey4}>EQ not available on this device. You can still edit and save your settings.</McText>
        </Notice>
      )}

      <PresetRow horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
        {Object.keys(EQ_PRESETS).map((name) => (
          <Chip key={name} active={eq?.preset === name} onPress={() => handlePreset(name as keyof typeof EQ_PRESETS)}>
            <McText medium size={12} color={eq?.preset === name ? Colors.white : Colors.grey4}>{name}</McText>
          </Chip>
        ))}
      </PresetRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 36 }}>
        <BandColumn>
          <McText medium size={12} color={Colors.grey4} style={{ marginBottom: 8 }}>Preamp</McText>
          <VerticalSlider>
            <Slider
              minimumValue={-12}
              maximumValue={12}
              step={0.5}
              value={clamp(eq?.preamp ?? 0, -12, 12)}
              onValueChange={handlePreamp}
              disabled={disabled}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.grey3}
            />
          </VerticalSlider>
          <McText size={11} color={Colors.grey4} style={{ marginTop: 6 }}>{gainToLabel(eq?.preamp ?? 0)}</McText>
        </BandColumn>

        {EQ_CENTER_FREQS.map((f, i) => (
          <BandColumn key={f}>
            <McText medium size={12} color={Colors.grey4} style={{ marginBottom: 8 }}>{f >= 1000 ? `${f/1000}k` : f}</McText>
            <VerticalSlider>
              <Slider
                minimumValue={-12}
                maximumValue={12}
                step={0.5}
                value={clamp(eq?.bands?.[i] ?? 0, -12, 12)}
                onValueChange={(v) => handleBand(i, v)}
                disabled={disabled}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.grey3}
              />
            </VerticalSlider>
            <McText size={11} color={Colors.grey4} style={{ marginTop: 6 }}>{gainToLabel(eq?.bands?.[i] ?? 0)}</McText>
          </BandColumn>
        ))}
      </ScrollView>
    </Container>
  )
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${Colors.background};
`

const HeaderRow = styled.View`
  margin: 12px 24px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`

const Notice = styled.View`
  margin: 4px 24px 0;
`

const PresetRow = styled.ScrollView`
  margin-top: 8px;
`

const Chip = styled.Pressable<{ active?: boolean }>`
  padding: 8px 12px;
  background-color: ${({ active }) => (active ? Colors.accent : Colors.secondary)};
  border-radius: 999px;
  margin-right: 8px;
`

const BandColumn = styled.View`
  width: 54px;
  align-items: center;
  margin-right: 10px;
`

const VerticalSlider = styled.View`
  height: 220px;
  width: 44px;
  transform: rotate(-90deg);
  justify-content: center;
`

export default EqualizerScreen

