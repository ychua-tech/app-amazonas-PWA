import type { ImageSourcePropType } from 'react-native';

/**
 * Páginas do encarte da semana (o "panfleto" digital).
 * Trocar estas imagens a cada campanha — mesmas dimensões (900x1600).
 */
export const encarte: {
  titulo: string;
  validade: string;
  paginas: ImageSourcePropType[];
} = {
  titulo: 'Ofertão da Independência',
  validade: 'Ofertas válidas de 04/09 a 07/09 ou enquanto durarem os estoques',
  paginas: [
    require('../../assets/encarte/pagina-1.jpg'),
    require('../../assets/encarte/pagina-2.jpg'),
    require('../../assets/encarte/pagina-3.jpg'),
    require('../../assets/encarte/pagina-4.jpg'),
  ],
};
