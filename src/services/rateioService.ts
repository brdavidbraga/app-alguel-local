import { Casa, Despesa, DespesaAgua, DespesaLuz, RateioAgua, RateioLuz } from '../types';

const TAXA_FIXA_AGUA = 38.0;

export const rateioService = {
  calcularRateioAgua(despesa: DespesaAgua, casa: Casa, todasCasasAtivas: Casa[]): RateioAgua {
    const taxaFixaCasa = TAXA_FIXA_AGUA;
    const totalTaxaFixa = taxaFixaCasa * todasCasasAtivas.length;
    const valorRestante = Math.max(0, despesa.valorTotal - totalTaxaFixa);
    
    // Total de pessoas em todas as casas ativas
    const totalPessoas = todasCasasAtivas.reduce((sum, c) => sum + c.quantidadePessoas, 0);
    
    // Valor por pessoa (proporcional)
    const valorPorPessoaGlobal = totalPessoas > 0 ? valorRestante / totalPessoas : 0;
    
    // Valor por pessoa nesta casa específica
    const valorPorPessoa = valorPorPessoaGlobal;
    const valorTotalPorInquilino = taxaFixaCasa + valorPorPessoa;
    
    // Valor total que a casa paga (taxa fixa + valor por pessoa × quantidade de pessoas)
    const valorTotalPorCasa = taxaFixaCasa + (valorPorPessoa * casa.quantidadePessoas);

    return {
      taxaFixaCasa,
      valorRestante: valorRestante, // Valor restante total
      valorPorPessoa,
      valorTotalPorInquilino,
      valorTotalPorCasa,
    };
  },

  calcularRateioLuz(despesa: DespesaLuz, casa1: Casa, casa2: Casa): RateioLuz {
    let valorPorCasa1 = 0;
    let valorPorCasa2 = 0;

    const temKwhPorCasa = despesa.consumoKwhPorCasa && despesa.consumoKwhPorCasa.length > 0;
    let kwhCasa1 = temKwhPorCasa
      ? (despesa.consumoKwhPorCasa!.find(c => c.casaId === casa1.id)?.kwh ?? 0)
      : 0;
    let kwhCasa2 = temKwhPorCasa
      ? (despesa.consumoKwhPorCasa!.find(c => c.casaId === casa2.id)?.kwh ?? 0)
      : 0;

    const totalKwhInformado =
      despesa.consumoKwhTotal && despesa.consumoKwhTotal > 0;
    if (totalKwhInformado && (kwhCasa1 === 0 || kwhCasa2 === 0)) {
      const totalKwhVal = despesa.consumoKwhTotal!;
      if (kwhCasa1 === 0) kwhCasa1 = Math.max(0, totalKwhVal - kwhCasa2);
      if (kwhCasa2 === 0) kwhCasa2 = Math.max(0, totalKwhVal - kwhCasa1);
    }
    const totalKwh = totalKwhInformado ? despesa.consumoKwhTotal! : kwhCasa1 + kwhCasa2;

    // Luz rateada pelo kWh consumido pela casa
    if (temKwhPorCasa && totalKwh > 0) {
      valorPorCasa1 = (despesa.valorTotal * kwhCasa1) / totalKwh;
      valorPorCasa2 = (despesa.valorTotal * kwhCasa2) / totalKwh;
    } else {
      valorPorCasa1 = despesa.valorTotal / 2;
      valorPorCasa2 = despesa.valorTotal / 2;
    }

    // Luz é rateada pelo kWh consumido pela casa, não por pessoas
    const valorPorPessoaCasa1 = valorPorCasa1;
    const valorPorPessoaCasa2 = valorPorCasa2;

    return {
      valorPorCasa1,
      valorPorCasa2,
      valorPorPessoaCasa1,
      valorPorPessoaCasa2,
    };
  },

  gerarRelatorioMensal(
    casaId: string,
    mes: string,
    casas: Casa[],
    despesas: Despesa[]
  ) {
    const casa = casas.find(c => c.id === casaId);
    if (!casa) return null;

    const despesasMes = despesas.filter(d => d.mes === mes);

    // Aluguel
    const aluguel = casa.valorAluguel;

    // Água - aplica para todas as casas ativas
    const despesaAgua = despesasMes.find(
      d => d.tipo === 'agua'
    ) as DespesaAgua | undefined;

    const casasAtivas = casas.filter(c => c.status === 'ativo');

    const agua = despesaAgua
      ? this.calcularRateioAgua(despesaAgua, casa, casasAtivas)
      : {
          taxaFixaCasa: 0,
          valorRestante: 0,
          valorPorPessoa: 0,
          valorTotalPorInquilino: 0,
          valorTotalPorCasa: 0,
        };

    // Luz
    const despesaLuz = despesasMes.find(
      d =>
        d.tipo === 'luz' &&
        ('casa1Id' in d || 'casa2Id' in d) &&
        (('casa1Id' in d && d.casa1Id === casaId) ||
          ('casa2Id' in d && d.casa2Id === casaId))
    ) as DespesaLuz | undefined;

    let luz: RateioLuz | null = null;
    if (despesaLuz) {
      const casa1 = casas.find(c => c.id === despesaLuz.casa1Id);
      const casa2 = casas.find(c => c.id === despesaLuz.casa2Id);
      if (casa1 && casa2) {
        luz = this.calcularRateioLuz(despesaLuz, casa1, casa2);
      }
    }

    // Outras despesas
    const outrasDespesas = despesasMes
      .filter(
        d =>
          d.tipo === 'outras' &&
          'casaId' in d &&
          d.casaId === casaId
      )
      .map(d => {
        const despesa = d as any;
        let valorPorInquilino = 0;
        if (despesa.tipoRateio === 'por-pessoa') {
          valorPorInquilino = despesa.valorTotal / casa.quantidadePessoas;
        } else {
          valorPorInquilino = despesa.valorTotal;
        }
        return {
          descricao: despesa.descricao,
          valor: valorPorInquilino,
        };
      });

    // Total por inquilino
    // Usar valor total por casa da água e valor por casa da luz (SEM dividir por pessoas)
    let valorLuzPorCasa = 0;
    if (luz && despesaLuz) {
      valorLuzPorCasa =
        casaId === despesaLuz.casa1Id
          ? luz.valorPorCasa1
          : luz.valorPorCasa2;
    }

    // Outras despesas já estão calculadas por inquilino
    const outrasDespesasTotal = outrasDespesas.reduce((sum, item) => sum + item.valor, 0);

    // Total por inquilino = Aluguel + Água valor total por casa + Luz valor por casa + outras despesas
    // NOTA: Água e Luz são valores totais da casa, não divididos por pessoas
    const totalPorInquilino =
      aluguel +
      agua.valorTotalPorCasa +
      valorLuzPorCasa +
      outrasDespesasTotal;

    // Log detalhado do cálculo
    console.log('=== CÁLCULO TOTAL POR INQUILINO ===');
    console.log(`Casa: ${casa.nome} (ID: ${casaId})`);
    console.log(`Mês: ${mes}`);
    console.log(`Quantidade de Pessoas: ${casa.quantidadePessoas}`);
    console.log('');
    console.log('VALORES BASE:');
    console.log(`  Aluguel (por inquilino): R$ ${aluguel.toFixed(2)}`);
    console.log(`  Água - Valor Total por Casa: R$ ${agua.valorTotalPorCasa.toFixed(2)}`);
    console.log(`  Água - Taxa Fixa: R$ ${agua.taxaFixaCasa.toFixed(2)}`);
    console.log(`  Água - Valor por Pessoa: R$ ${agua.valorPorPessoa.toFixed(2)}`);
    if (luz) {
      console.log(`  Luz - Valor por Casa: R$ ${valorLuzPorCasa.toFixed(2)}`);
    } else {
      console.log(`  Luz - Valor por Casa: R$ 0.00 (sem despesa de luz)`);
    }
    console.log(`  Outras Despesas (por inquilino): R$ ${outrasDespesasTotal.toFixed(2)}`);
    console.log('');
    console.log('SOMA FINAL (SEM DIVIDIR ÁGUA E LUZ):');
    console.log(`  R$ ${aluguel.toFixed(2)} (Aluguel por inquilino)`);
    console.log(`  + R$ ${agua.valorTotalPorCasa.toFixed(2)} (Água - valor total da casa)`);
    console.log(`  + R$ ${valorLuzPorCasa.toFixed(2)} (Luz - valor total da casa)`);
    console.log(`  + R$ ${outrasDespesasTotal.toFixed(2)} (Outras despesas por inquilino)`);
    console.log(`  = R$ ${totalPorInquilino.toFixed(2)} (TOTAL POR INQUILINO)`);
    console.log('=====================================');

    return {
      casaId: casa.id,
      casaNome: casa.nome,
      mes,
      aluguel,
      agua,
      luz,
      outrasDespesas,
      totalPorInquilino,
    };
  },
};

