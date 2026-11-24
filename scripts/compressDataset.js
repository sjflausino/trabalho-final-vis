import fs from 'fs';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';

async function compress() {
  const src = 'public/data/candidaturas_historico_limpo.csv';
  const dest = 'public/data/candidaturas_historico_limpo.csv.gz';
  console.log('Iniciando compressão de ' + src + '...');
  const t0 = Date.now();
  await pipeline(
    fs.createReadStream(src),
    zlib.createGzip({ level: 9 }),
    fs.createWriteStream(dest)
  );
  const origMB = (fs.statSync(src).size / (1024 * 1024)).toFixed(2);
  const gzMB = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
  console.log(`Concluído em ${((Date.now() - t0) / 1000).toFixed(1)}s! Tamanho original: ${origMB} MB -> Gzip: ${gzMB} MB`);
}

compress().catch(err => {
  console.error(err);
  process.exit(1);
});
