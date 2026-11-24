import fs from 'fs';
import readline from 'readline';

async function summarize() {
  const filePath = 'data/consulta_cand_2026/consulta_cand_2026_BRASIL.csv';
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });

  let totalRows = 0;
  const cargos = new Map();
  const ufs = new Map();
  const generos = new Map();
  const racas = new Map();
  const situacoes = new Map();
  let anoEleicao = null;
  let dsEleicao = null;

  for await (const line of rl) {
    if (totalRows === 0) {
      totalRows++;
      continue;
    }
    const vals = line.split(';').map(c => c.replace(/"/g, ''));
    if (vals.length < 50) continue;

    if (!anoEleicao) {
      anoEleicao = vals[2];
      dsEleicao = vals[7];
    }

    const uf = vals[10];
    const cargo = vals[14];
    const genero = vals[39];
    const raca = vals[45];
    const sit = vals[49];

    cargos.set(cargo, (cargos.get(cargo) || 0) + 1);
    ufs.set(uf, (ufs.get(uf) || 0) + 1);
    generos.set(genero, (generos.get(genero) || 0) + 1);
    racas.set(raca, (racas.get(raca) || 0) + 1);
    situacoes.set(sit, (situacoes.get(sit) || 0) + 1);

    totalRows++;
  }

  console.log('Total registros:', totalRows - 1);
  console.log('Ano / Descrição da Eleição:', anoEleicao, dsEleicao);
  console.log('Cargos:', Object.fromEntries(cargos));
  console.log('Gêneros:', Object.fromEntries(generos));
  console.log('Raça/Cor:', Object.fromEntries(racas));
  console.log('Situação:', Object.fromEntries(situacoes));
  console.log('UFs:', ufs.size, 'UFs encontradas');
}

summarize();
