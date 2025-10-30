import React, { useEffect, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, G } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors } from '../../Constants';

type WaveformLoaderProps = {
  width?: number;
  height?: number;
  speedMs?: number;
  bars?: number;           // allow caller to override bar count
  reducedMotion?: boolean; // respects motion prefs if you pass it down
};

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const BAR_WIDTH = 6;
const GAP = 4;

const Bar: React.FC<{
  t: Animated.SharedValue<number>;
  x: number;
  height: number;
  minH: number;
  maxH: number;
  phase: number;
  grad: string;
}> = React.memo(({ t, x, height, minH, maxH, phase, grad }) => {
  const animatedProps = useAnimatedProps(() => {
    // worklet
    const w = t.value * Math.PI * 2;
    const s1 = Math.sin(w + phase);
    const s2 = Math.sin(w * 1.7 + phase * 1.3);
    const mix = (s1 * 0.6 + s2 * 0.4 + 2) / 3;  // ~0..1
    const hVal = minH + mix * (maxH - minH);
    const y = height - hVal;
    return { y, height: hVal } as any;
  });

  return (
    <G>
      <AnimatedRect animatedProps={animatedProps} x={x} width={BAR_WIDTH} rx={BAR_WIDTH / 2} fill={grad} opacity={0.22} />
      <AnimatedRect animatedProps={animatedProps} x={x} width={BAR_WIDTH} rx={BAR_WIDTH / 2} fill={grad} />
    </G>
  );
});

const WaveformLoader: React.FC<WaveformLoaderProps> = ({
  width = Dimensions.get('window').width,
  height = 56,
  speedMs = 1400,
  bars, // optional override
  reducedMotion = false,
}) => {
  const t = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    t.value = withRepeat(withTiming(1, { duration: speedMs, easing: Easing.inOut(Easing.quad) }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, speedMs]);

  // compute once per size
  const count = useMemo(() => {
    const maxPossible = Math.max(8, Math.floor((width + GAP) / (BAR_WIDTH + GAP)));
    return bars ?? Math.min(maxPossible, 28); // cap to keep it smooth
  }, [bars, width]);

  const positions = useMemo(() => Array.from({ length: count }, (_, i) => i * (BAR_WIDTH + GAP)), [count]);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => (i * 0.77) % (Math.PI * 2)), [count]);

  const minH = Math.max(6, height * 0.15);
  const maxH = height * 0.92;

  const [c1, c2] = Colors.linearGradient1;
  const [c3, c4] = Colors.linearGradient2;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="neonGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={c1} stopOpacity={1} />
            <Stop offset="100%" stopColor={c2} stopOpacity={1} />
          </SvgLinearGradient>
          <SvgLinearGradient id="neonGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={c3} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={c4} stopOpacity={0.9} />
          </SvgLinearGradient>
        </Defs>

        {positions.map((x, i) => (
          <Bar
            key={i}
            t={t}
            x={x}
            height={height}
            minH={minH}
            maxH={maxH}
            phase={seeds[i]}
            grad={i % 2 === 0 ? 'url(#neonGrad1)' : 'url(#neonGrad2)'}
          />
        ))}
      </Svg>
    </View>
  );
};

export default WaveformLoader;
