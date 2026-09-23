import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import type { Categoria } from '../data/types';
import { colors } from '../theme';

const ICONE: Record<Categoria, keyof typeof Ionicons.glyphMap> = {
  Hortifruti: 'leaf-outline',
  Açougue: 'restaurant-outline',
  Padaria: 'cafe-outline',
  Mercearia: 'basket-outline',
  Bebidas: 'wine-outline',
  Limpeza: 'sparkles-outline',
  Higiene: 'happy-outline',
  Pet: 'paw-outline',
  'Frios e Laticínios': 'snow-outline',
};

const BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

/** Mostra a foto do produto ou, se não houver, um placeholder por categoria. */
export function ProdutoImagem({
  uri,
  categoria,
  height,
  width = '100%',
  radius: r = 0,
  iconeTamanho = 40,
}: {
  uri?: string | number;
  categoria: Categoria;
  height: DimensionValue;
  width?: DimensionValue;
  radius?: number;
  iconeTamanho?: number;
}) {
  if (uri) {
    return (
      <Image
        source={uri}
        placeholder={BLURHASH}
        transition={200}
        contentFit="contain"
        style={[styles.img, { height, width, borderRadius: r }]}
      />
    );
  }
  return (
    <View style={[styles.img, styles.placeholder, { height, width, borderRadius: r }]}>
      <Ionicons name={ICONE[categoria]} size={iconeTamanho} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.surface },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
