import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useSeasonalTheme } from '@/context/seasonal-theme';

type Props = {
  size?: number;
  floating?: boolean;
  waving?: boolean;
  mood?: 'happy' | 'wink';
};

/** Yumi's cartoon blood-drop mascot: a friendly face with a waving hand. Purely decorative. */
export function Mascot({ size = 140, floating = true, waving = true, mood = 'happy' }: Props) {
  const { christmas } = useSeasonalTheme();
  const floatY = useSharedValue(0);
  const waveRotate = useSharedValue(0);

  useEffect(() => {
    if (floating) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }
    if (waving) {
      waveRotate.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(22, { duration: 260, easing: Easing.out(Easing.quad) }),
            withTiming(-6, { duration: 260, easing: Easing.inOut(Easing.quad) }),
            withTiming(18, { duration: 240, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 900 }),
          ),
          -1,
          false,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floating, waving]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotate.value}deg` }],
    transformOrigin: '18% 85%',
  }));

  const handSize = size * 0.42;

  return (
    <Animated.View style={[{ width: size, height: size * 1.08 }, floatStyle]}>
      <Svg width={size} height={size * 1.05} viewBox="0 0 100 105">
        {/* body */}
        <Path
          d="M50,3 C50,3 18,48 18,66 A32,32 0 1,0 82,66 C82,48 50,3 50,3 Z"
          fill={Colors.primary}
        />
        {/* shine */}
        <Ellipse cx="34" cy="46" rx="8" ry="15" fill="#FFFFFF" opacity={0.28} transform="rotate(-18 34 46)" />
        {/* blush */}
        <Ellipse cx="27" cy="78" rx="6.5" ry="3.6" fill="#FFD8DF" opacity={0.85} />
        <Ellipse cx="73" cy="78" rx="6.5" ry="3.6" fill="#FFD8DF" opacity={0.85} />
        {/* eyes */}
        {mood === 'happy' ? (
          <>
            <Circle cx="39" cy="68" r="3.6" fill="#1A1A1A" />
            <Circle cx="61" cy="68" r="3.6" fill="#1A1A1A" />
          </>
        ) : (
          <>
            <Path d="M35,68 Q39,64 43,68" stroke="#1A1A1A" strokeWidth={3} strokeLinecap="round" fill="none" />
            <Circle cx="61" cy="68" r="3.6" fill="#1A1A1A" />
          </>
        )}
        {/* smile */}
        <Path d="M40,80 Q50,90 60,80" stroke="#1A1A1A" strokeWidth={3.2} strokeLinecap="round" fill="none" />
        {christmas ? <ChristmasOutfit withCandyCane /> : null}
      </Svg>

      {/* waving hand */}
      {waving && (
        <Animated.View
          style={[styles.hand, { width: handSize, height: handSize, top: size * 0.22, right: -size * 0.02 }, waveStyle]}
          pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 40 40">
            <Path d="M8,32 L24,14" stroke={Colors.primary} strokeWidth={6.5} strokeLinecap="round" />
            <Circle cx="27" cy="11" r="9.5" fill={Colors.primaryLight} stroke={Colors.primary} strokeWidth={1.5} />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** Tiny static mascot head used in headers/lists where motion would be distracting. */
export function MascotMini({ size = 32 }: { size?: number }) {
  const { christmas } = useSeasonalTheme();
  return (
    <View style={{ width: size, height: size * 1.05 }}>
      <Svg width={size} height={size * 1.05} viewBox="0 0 100 105">
        <Path d="M50,3 C50,3 18,48 18,66 A32,32 0 1,0 82,66 C82,48 50,3 50,3 Z" fill={Colors.primary} />
        <Circle cx="39" cy="68" r="4.2" fill="#FFFFFF" />
        <Circle cx="61" cy="68" r="4.2" fill="#FFFFFF" />
        <Path d="M40,80 Q50,88 60,80" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        {christmas ? <ChristmasOutfit /> : null}
      </Svg>
    </View>
  );
}

/**
 * Yumi's Christmas outfit, drawn in the same 0 0 100 105 viewBox as the body: a Santa hat with
 * holly on the tip, a striped green scarf below the smile, and (full-size mascot only) a candy
 * cane by her side. Only rendered in Christmas mode.
 */
function ChristmasOutfit({ withCandyCane = false }: { withCandyCane?: boolean }) {
  return (
    <>
      {withCandyCane ? (
        <>
          <Path d="M10,103 L10,70 Q10,61 4.5,61 Q0,61 0,67" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path
            d="M10,103 L10,70 Q10,61 4.5,61 Q0,61 0,67"
            stroke="#E53935"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="4 4"
            fill="none"
          />
        </>
      ) : null}
      {/* scarf */}
      <Path d="M23,88 Q50,99 77,88 L79,95 Q50,107 21,95 Z" fill="#1E7A4C" />
      <Path d="M24,92 Q50,103 76,92" stroke="#FFFFFF" strokeWidth={1.6} strokeDasharray="5 4" fill="none" />
      <Rect x="58" y="96" width="9" height="9" rx="2" fill="#1E7A4C" transform="rotate(-12 62 100)" />
      {/* Santa hat */}
      <Path d="M33,25 Q39,7 63,6 Q56,14 67,25 Z" fill="#E53935" />
      <Rect x="29" y="20" width="42" height="10" rx="5" fill="#FFFFFF" />
      <Circle cx="65" cy="7" r="5.5" fill="#FFFFFF" />
      {/* holly on the brim */}
      <Ellipse cx="31" cy="21" rx="5" ry="2.6" fill="#1E7A4C" transform="rotate(-25 31 21)" />
      <Ellipse cx="38" cy="18.5" rx="5" ry="2.6" fill="#2E8B57" transform="rotate(20 38 18.5)" />
      <Circle cx="34" cy="21.5" r="2" fill="#C41E3A" />
      <Circle cx="36.5" cy="23" r="1.8" fill="#C41E3A" />
    </>
  );
}

const styles = StyleSheet.create({
  hand: { position: 'absolute' },
});
