import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { AppText } from '@/components/mira/app-text';
import { Colors } from '@/constants/theme';

type Props = {
  currentDay: number;
  cycleLength: number;
  size?: number;
};

/** Radial progress ring showing how far into the cycle today is. */
export function CycleRing({ currentDay, cycleLength, size = 130 }: Props) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(currentDay / cycleLength, 1);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.35)" strokeWidth={strokeWidth} fill="none" />
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#FFFFFF"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <AppText variant="h1" color={Colors.textOnPrimary}>
          {currentDay}
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.85)">
          of {cycleLength} days
        </AppText>
      </View>
    </View>
  );
}
