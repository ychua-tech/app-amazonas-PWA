import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';

export function Botao({
  titulo,
  onPress,
  variante = 'primary',
  carregando,
  disabled,
  style,
}: {
  titulo: string;
  onPress?: () => void;
  variante?: 'primary' | 'outline';
  carregando?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const outline = variante === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || carregando}
      style={({ pressed }) => [
        styles.botao,
        outline ? styles.botaoOutline : styles.botaoPrimary,
        pressed && !outline && { backgroundColor: colors.primaryDark },
        pressed && outline && { backgroundColor: colors.primarySoft },
        (disabled || carregando) && { opacity: 0.6 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={outline ? colors.primary : colors.onPrimary} />
      ) : (
        <Text style={[styles.botaoTexto, outline && { color: colors.primary }]}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

export function Chip({
  texto,
  cor = colors.primarySoft,
  corTexto = colors.primaryDark,
}: {
  texto: string;
  cor?: string;
  corTexto?: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: cor }]}>
      <Text style={[styles.chipTexto, { color: corTexto }]}>{texto}</Text>
    </View>
  );
}

export function Campo({
  rotulo,
  dica,
  style,
  ...props
}: TextInputProps & { rotulo?: string; dica?: string; style?: ViewStyle }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {rotulo && <Text style={styles.rotulo}>{rotulo}</Text>}
      <TextInput
        placeholderTextColor={colors.textSubtle}
        {...props}
        style={[styles.campo, props.multiline && { height: 90, textAlignVertical: 'top' }]}
      />
      {dica && <Text style={styles.dica}>{dica}</Text>}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  botao: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  botaoPrimary: { backgroundColor: colors.primary, ...shadow.sm },
  botaoOutline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.card },
  botaoTexto: {
    color: colors.onPrimary,
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
    letterSpacing: 0.2,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chipTexto: { fontSize: font.sizeXs, fontWeight: font.weightBold, letterSpacing: 0.2 },
  rotulo: { fontSize: font.sizeXs, fontWeight: font.weightBold, color: colors.textMuted },
  dica: { fontSize: font.sizeXs, color: colors.textSubtle },
  campo: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: font.sizeMd,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
});
