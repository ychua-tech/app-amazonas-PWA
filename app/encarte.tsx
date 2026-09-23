import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { encarte } from '../src/data/encarte';
import { colors, font, spacing } from '../src/theme';

export default function EncarteScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const larguraPagina = Math.min(width, 700);

  return (
    <>
      <Stack.Screen options={{ title: encarte.titulo }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {encarte.paginas.map((pagina, i) => (
          <Image
            key={i}
            source={pagina}
            contentFit="contain"
            transition={200}
            style={{ width: larguraPagina, aspectRatio: 900 / 1600 }}
          />
        ))}
        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>{encarte.validade}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  rodape: { padding: spacing.lg },
  rodapeTexto: {
    fontSize: font.sizeXs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
