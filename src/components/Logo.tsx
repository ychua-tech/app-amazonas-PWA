import { Image } from 'expo-image';
import { type DimensionValue, StyleSheet, View } from 'react-native';

const LOGO = require('../../assets/logo-header.png');
const RAZAO = 315 / 320; // largura / altura do arquivo

/** Marca do Supermercado Amazonas (badge oficial). */
export function Logo({ altura = 40 }: { altura?: number }) {
  return (
    <View style={styles.wrap}>
      <Image
        source={LOGO}
        contentFit="contain"
        style={{ height: altura, width: (altura * RAZAO) as DimensionValue }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
