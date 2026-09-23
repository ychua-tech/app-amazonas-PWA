/**
 * Gera src/data/produtos.seed.json — catálogo inicial do mercado.
 * Edite as listas abaixo e rode: node scripts/gen-catalogo.mjs
 * É um catálogo-semente; a ideia é expandir/ajustar pelo painel admin depois.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const saida = join(__dirname, '..', 'src', 'data', 'produtos.seed.json');

let n = 0;
const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** p(nome, preco, unidade, extra?) */
function p(nome, preco, unidade, extra = {}) {
  n += 1;
  return {
    id: `pr-${String(n).padStart(4, '0')}-${slug(nome).slice(0, 24)}`,
    nome,
    preco,
    unidade,
    ...extra,
  };
}

const cat = (categoria, itens) => itens.map((i) => ({ ...i, categoria }));

const HORTIFRUTI = cat('Hortifruti', [
  p('Banana Prata', 5.99, 'kg'),
  p('Banana Nanica', 5.49, 'kg'),
  p('Banana Maçã', 6.99, 'kg'),
  p('Maçã Gala', 8.99, 'kg'),
  p('Maçã Fuji', 9.49, 'kg'),
  p('Laranja Pera', 4.49, 'kg'),
  p('Laranja Lima', 5.99, 'kg'),
  p('Mexerica Ponkan', 8.99, 'kg'),
  p('Mamão Formosa', 6.99, 'kg'),
  p('Mamão Papaya', 9.99, 'kg'),
  p('Melancia', 3.29, 'kg'),
  p('Melão Amarelo', 6.99, 'kg'),
  p('Abacaxi Pérola', 8.90, 'un', { modoVenda: 'unidade' }),
  p('Uva Itália', 14.90, 'kg'),
  p('Manga Palmer', 7.99, 'kg'),
  p('Morango', 9.99, 'bandeja 250g', { modoVenda: 'unidade' }),
  p('Abacate', 8.99, 'kg'),
  p('Limão Taiti', 6.99, 'kg'),
  p('Pera Williams', 12.90, 'kg'),
  p('Kiwi', 19.90, 'kg'),
  p('Tomate', 7.99, 'kg'),
  p('Tomate Cereja', 6.49, 'bandeja 300g', { modoVenda: 'unidade' }),
  p('Cebola', 5.99, 'kg'),
  p('Cebola Roxa', 8.99, 'kg'),
  p('Alho', 24.90, 'kg'),
  p('Batata', 6.49, 'kg'),
  p('Batata Doce', 5.99, 'kg'),
  p('Cenoura', 5.49, 'kg'),
  p('Beterraba', 5.99, 'kg'),
  p('Abobrinha', 6.99, 'kg'),
  p('Chuchu', 4.99, 'kg'),
  p('Pepino', 5.49, 'kg'),
  p('Pimentão Verde', 8.99, 'kg'),
  p('Alface Crespa', 3.49, 'un', { modoVenda: 'unidade' }),
  p('Couve Manteiga', 3.99, 'maço', { modoVenda: 'unidade' }),
  p('Cheiro-verde', 3.49, 'maço', { modoVenda: 'unidade' }),
  p('Repolho Verde', 4.99, 'un', { modoVenda: 'unidade' }),
  p('Brócolis', 7.99, 'un', { modoVenda: 'unidade' }),
  p('Mandioca Descascada', 8.99, 'pacote 1kg', { modoVenda: 'unidade' }),
  p('Ovos Brancos', 13.90, 'dúzia', { modoVenda: 'unidade' }),
  p('Ovos Caipira', 18.90, 'dúzia', { modoVenda: 'unidade' }),
]);

const ACOUGUE = cat('Açougue', [
  p('Picanha Bovina', 74.90, 'kg'),
  p('Alcatra Bovina', 44.90, 'kg'),
  p('Contrafilé', 46.90, 'kg'),
  p('Coxão Mole', 42.90, 'kg'),
  p('Coxão Duro', 38.90, 'kg'),
  p('Patinho Moído', 34.90, 'kg'),
  p('Acém', 27.90, 'kg'),
  p('Músculo', 29.90, 'kg'),
  p('Costela Bovina', 32.90, 'kg'),
  p('Fraldinha', 44.90, 'kg'),
  p('Maminha', 45.90, 'kg'),
  p('Cupim', 39.90, 'kg'),
  p('Lombo Suíno', 24.90, 'kg'),
  p('Pernil Suíno', 19.90, 'kg'),
  p('Costela Suína', 22.90, 'kg'),
  p('Bisteca Suína', 21.90, 'kg'),
  p('Linguiça Toscana', 18.90, 'kg'),
  p('Linguiça Calabresa', 24.90, 'kg'),
  p('Frango Inteiro Congelado', 12.90, 'kg'),
  p('Peito de Frango', 16.90, 'kg'),
  p('Coxa e Sobrecoxa', 13.90, 'kg'),
  p('Asa de Frango', 15.90, 'kg'),
  p('Sobrecoxa Seara IQF', 15.99, 'pacote 1kg', { modoVenda: 'unidade' }),
  p('Filé de Peito Sadia', 22.90, 'pacote 1kg', { modoVenda: 'unidade' }),
  p('Carne Seca', 59.90, 'kg'),
  p('Bacon em Pedaço', 34.90, 'kg'),
]);

const PADARIA = cat('Padaria', [
  p('Pão Francês', 15.90, 'kg'),
  p('Pão de Forma Tradicional', 8.99, 'un', { modoVenda: 'unidade', marca: 'Pullman' }),
  p('Pão de Forma Integral', 9.99, 'un', { modoVenda: 'unidade', marca: 'Pullman' }),
  p('Pão de Hambúrguer', 7.49, 'pacote 4un', { modoVenda: 'unidade' }),
  p('Pão de Hot Dog', 6.99, 'pacote 8un', { modoVenda: 'unidade' }),
  p('Pão Doce', 24.90, 'kg'),
  p('Pão de Queijo Congelado', 18.90, 'pacote 1kg', { modoVenda: 'unidade' }),
  p('Bolo Caseiro Fatiado', 16.90, 'un', { modoVenda: 'unidade' }),
  p('Rosca de Coco', 12.90, 'un', { modoVenda: 'unidade' }),
  p('Sonho', 4.50, 'un', { modoVenda: 'unidade' }),
  p('Croissant', 5.90, 'un', { modoVenda: 'unidade' }),
  p('Baguete', 6.90, 'un', { modoVenda: 'unidade' }),
  p('Torrada Tradicional', 6.49, 'pacote 160g', { modoVenda: 'unidade', marca: 'Bauducco' }),
  p('Bolo de Chocolate', 22.90, 'un', { modoVenda: 'unidade' }),
  p('Panetone', 24.90, 'un', { modoVenda: 'unidade', marca: 'Bauducco' }),
]);

const FRIOS = cat('Frios e Laticínios', [
  p('Queijo Mussarela', 42.90, 'kg'),
  p('Queijo Prato', 44.90, 'kg'),
  p('Queijo Coalho', 46.90, 'kg'),
  p('Queijo Parmesão', 69.90, 'kg'),
  p('Presunto Cozido', 32.90, 'kg'),
  p('Apresuntado', 22.90, 'kg'),
  p('Mortadela', 18.90, 'kg'),
  p('Salame', 59.90, 'kg'),
  p('Peito de Peru Defumado', 49.90, 'kg'),
  p('Queijo Minas Frescal', 34.90, 'un', { modoVenda: 'unidade' }),
  p('Leite Integral', 4.99, 'un', { marca: 'Italac' }),
  p('Leite Desnatado', 5.29, 'un', { marca: 'Italac' }),
  p('Leite Semidesnatado', 5.09, 'un', { marca: 'Italac' }),
  p('Iogurte Natural', 6.49, 'pote 500g', { marca: 'Nestlé' }),
  p('Iogurte Morango', 4.99, 'bandeja 6un', { modoVenda: 'unidade', marca: 'Danone' }),
  p('Bebida Láctea', 3.49, 'garrafa 900g', { marca: 'Itambé' }),
  p('Manteiga com Sal', 12.90, 'pote 200g', { marca: 'Aviação' }),
  p('Margarina', 8.99, 'pote 500g', { marca: 'Qualy' }),
  p('Requeijão Cremoso', 8.49, 'copo 200g', { marca: 'Catupiry' }),
  p('Creme de Leite', 3.29, 'caixa 200g', { marca: 'Nestlé' }),
  p('Leite Condensado', 6.99, 'lata 395g', { marca: 'Moça' }),
  p('Cream Cheese', 11.90, 'pote 150g', { marca: 'Philadelphia' }),
  p('Queijo Ralado', 6.99, 'pacote 50g' ),
  p('Nata', 9.90, 'pote 300g'),
  p('Ovo de Codorna em Conserva', 8.99, 'vidro 200g', { modoVenda: 'unidade' }),
]);

const MERCEARIA = cat('Mercearia', [
  p('Arroz Branco Tipo 1', 22.90, 'pacote 5kg', { marca: 'Tio João' }),
  p('Arroz Parboilizado', 24.90, 'pacote 5kg', { marca: 'Tio João' }),
  p('Arroz Integral', 9.99, 'pacote 1kg', { marca: 'Camil' }),
  p('Feijão Carioca', 8.49, 'pacote 1kg', { marca: 'Kicaldo' }),
  p('Feijão Preto', 8.99, 'pacote 1kg', { marca: 'Camil' }),
  p('Açúcar Refinado', 4.99, 'pacote 1kg', { marca: 'União' }),
  p('Açúcar Cristal', 4.49, 'pacote 1kg', { marca: 'Caravelas' }),
  p('Café Torrado e Moído', 15.90, 'pacote 500g', { marca: 'Pilão' }),
  p('Café em Cápsula', 24.90, 'caixa 10un', { modoVenda: 'unidade', marca: 'Três Corações' }),
  p('Óleo de Soja', 7.49, 'garrafa 900ml', { marca: 'Soya' }),
  p('Óleo de Girassol', 12.90, 'garrafa 900ml', { marca: 'Liza' }),
  p('Azeite de Oliva Extravirgem', 27.90, 'garrafa 500ml', { marca: 'Gallo' }),
  p('Vinagre de Álcool', 3.49, 'garrafa 750ml', { marca: 'Castelo' }),
  p('Sal Refinado', 2.99, 'pacote 1kg', { marca: 'Cisne' }),
  p('Macarrão Espaguete', 4.49, 'pacote 500g', { marca: 'Galo' }),
  p('Macarrão Parafuso', 4.49, 'pacote 500g', { marca: 'Renata' }),
  p('Macarrão Instantâneo', 2.29, 'un', { marca: 'Nissin' }),
  p('Molho de Tomate', 2.99, 'sachê 340g', { marca: 'Fugini' }),
  p('Extrato de Tomate', 3.79, 'sachê 300g', { marca: 'Elefante' }),
  p('Milho Verde em Conserva', 3.99, 'lata 170g', { marca: 'Quero' }),
  p('Ervilha em Conserva', 3.99, 'lata 170g', { marca: 'Quero' }),
  p('Seleta de Legumes', 4.99, 'lata 170g', { marca: 'Quero' }),
  p('Atum Ralado em Óleo', 7.99, 'lata 170g', { marca: 'Gomes da Costa' }),
  p('Sardinha em Óleo', 6.49, 'lata 125g', { marca: 'Coqueiro' }),
  p('Farinha de Trigo', 5.49, 'pacote 1kg', { marca: 'Dona Benta' }),
  p('Farinha de Mandioca', 6.99, 'pacote 1kg', { marca: 'Yoki' }),
  p('Fubá Mimoso', 4.29, 'pacote 1kg', { marca: 'Yoki' }),
  p('Amido de Milho', 6.49, 'caixa 500g', { marca: 'Maizena' }),
  p('Fermento em Pó', 5.99, 'lata 100g', { marca: 'Royal' }),
  p('Aveia em Flocos', 7.49, 'pacote 250g', { marca: 'Quaker' }),
  p('Leite em Pó Integral', 17.90, 'pacote 400g', { marca: 'Ninho' }),
  p('Achocolatado em Pó', 8.99, 'pacote 400g', { marca: 'Nescau' }),
  p('Biscoito Recheado Chocolate', 3.49, 'pacote 130g', { marca: 'Trakinas' }),
  p('Biscoito Cream Cracker', 4.29, 'pacote 400g', { marca: 'Vitarella' }),
  p('Biscoito Maisena', 3.99, 'pacote 400g', { marca: 'Piraquê' }),
  p('Bolacha Água e Sal', 4.29, 'pacote 400g', { marca: 'Marilan' }),
  p('Gelatina Sabor Morango', 2.49, 'caixa 85g', { marca: 'Dr. Oetker' }),
  p('Pudim em Pó', 3.29, 'caixa 100g', { marca: 'Fleischmann' }),
  p('Tempero Completo', 6.99, 'pote 300g', { marca: 'Sazón' }),
  p('Caldo de Galinha', 4.49, 'caixa 12 cubos', { modoVenda: 'unidade', marca: 'Knorr' }),
  p('Orégano', 3.99, 'pote 10g'),
  p('Colorau', 3.49, 'pacote 100g'),
  p('Batata Palha', 6.99, 'pacote 105g', { marca: 'Yoki' }),
  p('Amendoim Torrado', 7.49, 'pacote 400g', { marca: 'Dori' }),
  p('Salgadinho de Milho', 6.99, 'pacote 120g', { marca: 'Fandangos' }),
  p('Batata Chips', 8.99, 'pacote 96g', { marca: 'Ruffles' }),
  p('Pipoca de Micro-ondas', 4.49, 'un', { marca: 'Yoki' }),
  p('Chocolate ao Leite', 7.99, 'barra 90g', { marca: 'Lacta' }),
  p('Bombom Sortido', 15.90, 'caixa 250g', { modoVenda: 'unidade', marca: 'Garoto' }),
  p('Doce de Leite', 9.90, 'pote 400g'),
  p('Mel', 18.90, 'pote 300g'),
  p('Geleia de Morango', 12.90, 'pote 230g', { marca: 'Queensberry' }),
]);

const BEBIDAS = cat('Bebidas', [
  p('Refrigerante Cola', 9.99, 'garrafa 2L', { marca: 'Coca-Cola' }),
  p('Refrigerante Cola Zero', 9.99, 'garrafa 2L', { marca: 'Coca-Cola' }),
  p('Refrigerante Guaraná', 8.49, 'garrafa 2L', { marca: 'Antarctica' }),
  p('Refrigerante Laranja', 7.99, 'garrafa 2L', { marca: 'Fanta' }),
  p('Refrigerante Limão', 7.99, 'garrafa 2L', { marca: 'Sprite' }),
  p('Refrigerante Lata', 3.99, 'lata 350ml', { marca: 'Coca-Cola' }),
  p('Água Mineral sem Gás', 2.49, 'garrafa 1,5L', { marca: 'Crystal' }),
  p('Água Mineral com Gás', 2.99, 'garrafa 1,5L', { marca: 'Crystal' }),
  p('Água Mineral Copo', 12.90, 'fardo 48un', { modoVenda: 'unidade' }),
  p('Suco de Uva Integral', 16.90, 'garrafa 1,5L', { marca: 'Aurora' }),
  p('Suco de Laranja', 9.99, 'garrafa 900ml', { marca: 'Del Valle' }),
  p('Néctar de Maracujá', 6.49, 'caixa 1L', { marca: 'Maguary' }),
  p('Suco em Pó Laranja', 1.49, 'un', { marca: 'Tang' }),
  p('Refresco Concentrado', 5.99, 'garrafa 500ml', { marca: 'Tang' }),
  p('Chá Gelado Pêssego', 6.99, 'garrafa 1,5L', { marca: 'Lipton' }),
  p('Energético', 8.99, 'lata 250ml', { marca: 'Red Bull' }),
  p('Isotônico', 6.49, 'garrafa 500ml', { marca: 'Gatorade' }),
  p('Cerveja Pilsen Lata', 3.79, 'lata 350ml', { marca: 'Skol' }),
  p('Cerveja Pilsen Long Neck', 5.49, 'garrafa 355ml', { marca: 'Heineken' }),
  p('Cerveja Pilsen 1L', 8.99, 'garrafa 1L', { marca: 'Brahma' }),
  p('Vinho Tinto Suave', 24.90, 'garrafa 750ml', { marca: 'Pérgola' }),
  p('Espumante Moscatel', 34.90, 'garrafa 750ml', { marca: 'Salton' }),
  p('Vodka', 39.90, 'garrafa 900ml', { marca: 'Smirnoff' }),
  p('Cachaça', 14.90, 'garrafa 965ml', { marca: 'Velho Barreiro' }),
  p('Café Solúvel', 16.90, 'pote 100g', { marca: 'Nescafé' }),
  p('Água de Coco', 7.99, 'caixa 1L', { marca: 'Kero Coco' }),
]);

const LIMPEZA = cat('Limpeza', [
  p('Detergente Líquido Neutro', 2.79, 'un', { marca: 'Ypê' }),
  p('Lava-louças Concentrado', 9.99, 'un', { marca: 'Limpol' }),
  p('Sabão em Pó', 16.90, 'caixa 1,6kg', { marca: 'Omo' }),
  p('Sabão Líquido', 19.90, 'un', { marca: 'Omo' }),
  p('Sabão em Barra', 7.99, 'pacote 5un', { modoVenda: 'unidade', marca: 'Ypê' }),
  p('Amaciante Concentrado', 13.99, 'un', { marca: 'Downy' }),
  p('Amaciante Diluído', 9.99, 'un', { marca: 'Comfort' }),
  p('Água Sanitária', 4.49, 'un', { marca: 'Qboa' }),
  p('Desinfetante', 6.99, 'un', { marca: 'Pinho Sol' }),
  p('Limpador Multiuso', 5.49, 'un', { marca: 'Veja' }),
  p('Limpa Vidros', 7.99, 'un', { marca: 'Veja' }),
  p('Limpador Perfumado', 8.49, 'un', { marca: ' Deo' }),
  p('Cloro Gel', 8.99, 'un', { marca: 'Qboa' }),
  p('Sapólio Cremoso', 3.99, 'un', { marca: 'Cif' }),
  p('Lustra-móveis', 9.90, 'un', { marca: 'Poliflor' }),
  p('Inseticida Aerossol', 12.90, 'un', { marca: 'SBP' }),
  p('Esponja Multiuso', 2.49, 'pacote 4un', { modoVenda: 'unidade', marca: 'Scotch-Brite' }),
  p('Pano de Chão', 6.99, 'pacote 2un', { modoVenda: 'unidade' }),
  p('Pano Multiuso', 9.99, 'rolo 50 panos', { modoVenda: 'unidade', marca: 'Perfex' }),
  p('Saco de Lixo 50L', 8.99, 'pacote 30un', { modoVenda: 'unidade' }),
  p('Saco de Lixo 100L', 12.90, 'pacote 20un', { modoVenda: 'unidade' }),
  p('Papel Toalha', 6.49, 'pacote 2 rolos', { modoVenda: 'unidade', marca: 'Mili' }),
  p('Guardanapo de Papel', 3.99, 'pacote 50un', { modoVenda: 'unidade' }),
  p('Álcool 70%', 6.99, 'un', { marca: 'Itajá' }),
  p('Álcool em Gel', 8.99, 'un', { marca: 'Itajá' }),
]);

const HIGIENE = cat('Higiene', [
  p('Papel Higiênico Folha Dupla', 21.90, 'pacote 12 rolos', { modoVenda: 'unidade', marca: 'Neve' }),
  p('Papel Higiênico Folha Simples', 14.90, 'pacote 12 rolos', { modoVenda: 'unidade', marca: 'Mili' }),
  p('Sabonete em Barra', 2.99, 'un', { marca: 'Dove' }),
  p('Sabonete Líquido', 12.90, 'un', { marca: 'Protex' }),
  p('Shampoo', 14.90, 'un', { marca: 'Seda' }),
  p('Condicionador', 14.90, 'un', { marca: 'Seda' }),
  p('Creme para Pentear', 9.99, 'pote 300g', { marca: 'Salon Line' }),
  p('Creme Dental', 5.99, 'un', { marca: 'Colgate' }),
  p('Escova de Dente', 8.99, 'pacote 3un', { modoVenda: 'unidade', marca: 'Oral-B' }),
  p('Enxaguante Bucal', 15.90, 'un', { marca: 'Listerine' }),
  p('Fio Dental', 6.99, 'un', { marca: 'Oral-B' }),
  p('Desodorante Aerossol', 12.90, 'un', { marca: 'Rexona' }),
  p('Desodorante Roll-on', 10.90, 'un', { marca: 'Nivea' }),
  p('Absorvente com Abas', 7.99, 'pacote 8un', { modoVenda: 'unidade', marca: 'Always' }),
  p('Protetor Diário', 8.99, 'pacote 15un', { modoVenda: 'unidade', marca: 'Always' }),
  p('Fralda Descartável M', 44.90, 'pacote 30un', { modoVenda: 'unidade', marca: 'Pampers' }),
  p('Fralda Descartável G', 46.90, 'pacote 28un', { modoVenda: 'unidade', marca: 'Pampers' }),
  p('Lenço Umedecido', 12.90, 'pacote 96un', { modoVenda: 'unidade', marca: 'Huggies' }),
  p('Aparelho de Barbear', 11.90, 'pacote 2un', { modoVenda: 'unidade', marca: 'Gillette' }),
  p('Cotonetes', 5.49, 'caixa 75un', { modoVenda: 'unidade', marca: 'Johnson' }),
  p('Algodão', 4.99, 'pacote 100g', { marca: 'Nívea' }),
  p('Hidratante Corporal', 18.90, 'un', { marca: 'Nívea' }),
  p('Protetor Solar FPS 30', 34.90, 'un', { marca: 'Sundown' }),
]);

const PET = cat('Pet', [
  p('Ração para Cães Adultos', 41.99, 'pacote 7kg', { modoVenda: 'unidade', marca: 'Pedigree' }),
  p('Ração para Cães Filhotes', 39.90, 'pacote 3kg', { modoVenda: 'unidade', marca: 'Golden' }),
  p('Ração para Gatos', 38.90, 'pacote 3kg', { modoVenda: 'unidade', marca: 'Whiskas' }),
  p('Sachê para Cães', 3.49, 'un', { marca: 'Pedigree' }),
  p('Sachê para Gatos', 2.99, 'un', { marca: 'Whiskas' }),
  p('Areia Higiênica para Gatos', 22.90, 'pacote 4kg', { modoVenda: 'unidade' }),
  p('Petisco para Cães', 12.90, 'pacote 150g', { modoVenda: 'unidade', marca: 'Dentastix' }),
  p('Osso de Couro', 8.99, 'pacote 3un', { modoVenda: 'unidade' }),
  p('Tapete Higiênico', 34.90, 'pacote 30un', { modoVenda: 'unidade' }),
  p('Shampoo para Cães', 16.90, 'un', { marca: 'Sanol' }),
]);

const produtos = [
  ...HORTIFRUTI,
  ...ACOUGUE,
  ...PADARIA,
  ...FRIOS,
  ...MERCEARIA,
  ...BEBIDAS,
  ...LIMPEZA,
  ...HIGIENE,
  ...PET,
].map((x) => {
  const out = {
    id: x.id,
    nome: x.nome,
    categoria: x.categoria,
    unidade: x.unidade,
    preco: x.preco,
  };
  if (x.marca) out.marca = x.marca;
  if (x.modoVenda) out.modoVenda = x.modoVenda;
  return out;
});

writeFileSync(
  saida,
  JSON.stringify(
    { _comentario: 'Catálogo-semente do mercado. Gerado por scripts/gen-catalogo.mjs — expandir/ajustar pelo painel admin.', produtos },
    null,
    1,
  ),
);
console.log(`produtos.seed.json: ${produtos.length} produtos`);
