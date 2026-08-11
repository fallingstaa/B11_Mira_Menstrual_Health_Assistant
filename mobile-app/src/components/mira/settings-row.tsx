import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { Colors, Spacing } from '@/constants/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  tint?: string;
  label: string;
  value?: string;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
};

/** One row inside a Profile/Settings list: icon, label, and a value, chevron, or switch. */
export function SettingsRow({ icon, color = Colors.primary, tint = Colors.tint50, label, value, toggle, onToggle, onPress, destructive }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={toggle !== undefined}>
      <IconCircle color={tint} size={38}>
        <Ionicons name={icon} size={17} color={destructive ? Colors.primary : color} />
      </IconCircle>
      <AppText variant="bodyMedium" color={destructive ? Colors.primary : Colors.text} style={styles.label}>
        {label}
      </AppText>
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.tint300 }}
          thumbColor={toggle ? Colors.primary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.rightWrap}>
          {value ? (
            <AppText variant="small" style={{ marginRight: 4 }}>
              {value}
            </AppText>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  label: { flex: 1 },
  rightWrap: { flexDirection: 'row', alignItems: 'center' },
});
