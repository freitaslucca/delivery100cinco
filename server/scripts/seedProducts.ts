import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { Product } from '../models/Product.js';
import { logger } from '../lib/logger.js';

/**
 * Seed inicial — popula a collection products a partir do catálogo histórico
 * que vivia hardcoded no index.html. É idempotente: cria os que faltam e NÃO
 * mexe em nenhum produto já cadastrado (preserva preço e estoque editados).
 *
 * Pra forçar atualização (preço/imagem) num produto existente, rode com:
 *   FORCE_UPDATE=1 npm run seed:products
 */

interface SeedProduct {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantityType: string;
  description?: string;
  category?: string;
  stock?: number;
}

const MIX_ROXO_DESCRIPTION = `
<p>
  Polpa Mista de Uva, Morango, Maçã, Açaí, Beterraba e Gengibre. Ingredientes vindos das frutas e vegetais, na combinação perfeita para o equilíbrio do organismo.
  <br><strong>MINERAIS:</strong> Ácido Fólico | Cálcio | Cobre | Ferro | Fósforo | Magnésio | Manganês | Potássio | Selênio | Sódio | Zinco.
  <br><strong>VITAMINAS:</strong> A | B1 | B2 | B5 | B6 | C | D | E | K.
</p>
<h3>Embalagem Disponível:</h3>
<p>Pacotes com 10 unidades de 100g (cx. 10kg)</p>
`;

const CATALOG: SeedProduct[] = [
  { productId: 1,  name: 'Abacaxi',                       price: 31.00, image: 'assets/polpas/abacaxi.png',          quantityType: '10 unid. 100g' },
  { productId: 2,  name: 'Abacaxi com Hortelã',           price: 34.00, image: 'assets/polpas/abacaxichortela.png',  quantityType: '10 unid. 100g' },
  { productId: 3,  name: 'Açaí',                          price: 43.00, image: 'assets/polpas/acai.png',             quantityType: '10 unid. 100g', category: 'Açaí' },
  { productId: 4,  name: 'Acerola',                       price: 27.00, image: 'assets/polpas/acerola.png',          quantityType: '10 unid. 100g' },
  { productId: 5,  name: 'Acerola com Laranja',           price: 32.00, image: 'assets/polpas/acerolaelaranja.png',  quantityType: '10 unid. 100g' },
  { productId: 6,  name: 'Amora',                         price: 44.00, image: 'assets/polpas/amora.png',            quantityType: '10 unid. 100g' },
  { productId: 7,  name: 'Cacau',                         price: 33.00, image: 'assets/polpas/cacau.png',            quantityType: '10 unid. 100g' },
  { productId: 8,  name: 'Cajá',                          price: 34.00, image: 'assets/polpas/caja.png',             quantityType: '10 unid. 100g' },
  { productId: 9,  name: 'Caju',                          price: 28.00, image: 'assets/polpas/caju.png',             quantityType: '10 unid. 100g' },
  { productId: 10, name: 'Coco Verde',                    price: 34.00, image: 'assets/polpas/coco.png',             quantityType: '10 unid. 100g' },
  { productId: 11, name: 'Cupuaçu',                       price: 38.00, image: 'assets/polpas/cucuacu.png',          quantityType: '10 unid. 100g' },
  { productId: 12, name: 'Mix Beta',                      price: 36.00, image: 'assets/polpas/mixbeta.png',          quantityType: '10 unid. 100g', category: 'Mix' },
  { productId: 13, name: 'Mix Roxo',                      price: 36.00, image: 'assets/polpas/mixroxo.png',          quantityType: '10 unid. 100g', category: 'Mix', description: MIX_ROXO_DESCRIPTION },
  { productId: 14, name: 'Mix Verde',                     price: 36.00, image: 'assets/polpas/mixverde.png',         quantityType: '10 unid. 100g', category: 'Mix' },
  { productId: 15, name: 'Framboesa<br>(Sob Encomenda)',  price: 64.00, image: 'assets/polpas/fraboesa.png',         quantityType: 'Pacote 1Kg' },
  { productId: 16, name: 'Frutas Vermelhas',              price: 46.00, image: 'assets/polpas/frutasvermelhas.png',  quantityType: '10 unid. 100g' },
  { productId: 17, name: 'Goiaba',                        price: 28.00, image: 'assets/polpas/goiaba.png',           quantityType: '10 unid. 100g' },
  { productId: 18, name: 'Graviola',                      price: 36.00, image: 'assets/polpas/graviola.png',         quantityType: '10 unid. 100g' },
  { productId: 19, name: 'Kiwi',                          price: 32.00, image: 'assets/polpas/kiwi.png',             quantityType: '10 unid. 100g' },
  { productId: 20, name: 'Laranja',                       price: 39.90, image: 'assets/polpas/laranja.png',          quantityType: '10 unid. 100g' },
  { productId: 21, name: 'Limão',                         price: 22.99, image: 'assets/polpas/limao.png',            quantityType: '10 unid. 100g' },
  { productId: 22, name: 'Mamão com Laranja',             price: 32.00, image: 'assets/polpas/mamaoelaranja.png',    quantityType: '10 unid. 100g' },
  { productId: 23, name: 'Manga',                         price: 28.00, image: 'assets/polpas/manga.png',            quantityType: '10 unid. 100g' },
  { productId: 24, name: 'Maracujá',                      price: 39.00, image: 'assets/polpas/maracuja.png',         quantityType: '10 unid. 100g' },
  { productId: 25, name: 'Melancia',                      price: 27.00, image: 'assets/polpas/melancia.png',         quantityType: '10 unid. 100g' },
  { productId: 26, name: 'Mista<br>(Sob Encomenda)',      price: 27.00, image: 'assets/polpas/bananamamaomaca.png',  quantityType: '10 unid. 100g' },
  { productId: 27, name: 'Morango',                       price: 29.00, image: 'assets/polpas/morango.png',          quantityType: '10 unid. 100g' },
  { productId: 28, name: 'Pêssego',                       price: 32.00, image: 'assets/polpas/pessego.png',          quantityType: '10 unid. 100g' },
  { productId: 30, name: 'Pão de Queijo<br>(Sob Encomenda)', price: 79.00, image: 'assets/paodequeijo.png',          quantityType: 'Balde 4 Kg', category: 'Diversos' },
  { productId: 31, name: 'Tamarindo',                     price: 32.00, image: 'assets/polpas/tamarindo.png',        quantityType: '10 unid. 100g' },
  { productId: 32, name: 'Tangerina<br>(Sob Encomenda)',  price: 34.00, image: 'assets/polpas/tangeirna.png',        quantityType: 'Pacote 1Kg' },
  { productId: 33, name: 'Umbu',                          price: 31.00, image: 'assets/polpas/umbu.png',             quantityType: '10 unid. 100g' },
  { productId: 34, name: 'Uva',                           price: 29.00, image: 'assets/polpas/uva.png',              quantityType: '10 unid. 100g' },
  { productId: 35, name: 'Açaí tradicional<br>com Guaraná', price: 46.80, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/acai_1600g_tradicional_128x171.png', quantityType: 'Pote 1,6 Kg', category: 'Açaí' },
  { productId: 36, name: 'Amora Congelada',               price: 49.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-amora-2.png',     quantityType: 'Pacote 1,02 Kg', category: 'Frutas' },
  { productId: 37, name: 'Mirtilo Congelado',             price: 68.90, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-blueberry-2.png', quantityType: 'Pacote 1,02 Kg', category: 'Frutas' },
  { productId: 38, name: 'Morango Congelado',             price: 29.00, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-morango-2.png',  quantityType: 'Pacote 1,02 Kg', category: 'Frutas' },
  { productId: 40, name: 'Framboesa Congelada<br>(Sob Encomenda)', price: 78.50, image: 'https://www.ricaeli.com.br/arquivos/pics_produto/fruta-cong-framboesa-2.png', quantityType: 'Pacote 1,02 Kg', category: 'Frutas' },
];

// Default 0 — produtos entram "esgotados" no painel. Assim você
// vê tudo destacado em vermelho e só preenche o estoque real.
const DEFAULT_STOCK = 0;
const DEFAULT_LOW_THRESHOLD = 5;

async function run(): Promise<void> {
  const forceUpdate = process.env.FORCE_UPDATE === '1';

  await mongoose.connect(config.MONGODB_URI);
  logger.info('🔌 Conectado ao MongoDB');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [idx, p] of CATALOG.entries()) {
    const existing = await Product.findOne({ productId: p.productId });
    if (existing) {
      if (forceUpdate) {
        existing.name = p.name;
        existing.image = p.image;
        existing.quantityType = p.quantityType;
        existing.price = p.price;
        if (p.description !== undefined) existing.description = p.description;
        if (p.category !== undefined) existing.category = p.category;
        await existing.save();
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    await Product.create({
      productId: p.productId,
      name: p.name,
      image: p.image,
      quantityType: p.quantityType,
      description: p.description ?? '',
      category: p.category ?? '',
      price: p.price,
      stock: p.stock ?? DEFAULT_STOCK,
      lowStockThreshold: DEFAULT_LOW_THRESHOLD,
      active: true,
      sortOrder: idx,
    });
    created++;
  }

  console.log(`\n✅ Seed concluído — criados: ${created} | atualizados: ${updated} | pulados: ${skipped}`);
  if (!forceUpdate && skipped > 0) {
    console.log(`   (rode com FORCE_UPDATE=1 pra sobrescrever campos dos existentes)`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Falha no seed:', err);
  process.exit(1);
});
