import { Casa, Despesa, DespesaAgua, DespesaLuz, RateioAgua, RateioLuz } from '../types';

const TAXA_FIXA_AGUA = 38.0;
const roundMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Datas civis em UTC evitam diferenças de fuso e horário de verão.
function dataCivil(dia?: string): number | null {
  if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null;
  const ms = Date.parse(dia + 'T00:00:00Z');
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === dia ? ms : null;
}

export function calcularProporcionalidadePrimeiraAgua(
  casa: Casa, despesa: DespesaAgua, rateioIntegral: RateioAgua
) {
  const anterior = dataCivil(despesa.dataLeituraAnterior);
  const atual = dataCivil(despesa.dataLeituraAtual);
  const entrada = dataCivil(casa.dataInicioContrato);
  if (anterior === null || atual === null || entrada === null ||
      !(anterior < entrada && entrada < atual)) return null;

  const diasCiclo = (atual - anterior) / 86_400_000;
  const diasOcupacao = (atual - entrada) / 86_400_000;
  const fator = diasOcupacao / diasCiclo;
  const valorIntegral = rateioIntegral.valorTotalPorCasa;
  const valorProporcional = roundMoney(valorIntegral * fator);
  const taxaFixaProporcional = roundMoney(rateioIntegral.taxaFixaCasa * fator);
  return {
    dataEntrada: casa.dataInicioContrato,
    dataLeituraAnterior: despesa.dataLeituraAnterior!,
    dataLeituraAtual: despesa.dataLeituraAtual!,
    diasCiclo,
    diasOcupacao,
    valorIntegral,
    valorProporcional,
    taxaFixaIntegral: rateioIntegral.taxaFixaCasa,
    taxaFixaProporcional,
    valorVariavelProporcional: roundMoney(valorProporcional - taxaFixaProporcional),
  };
}

export const rateioService = {
  calcularRateioAgua(despesa: DespesaAgua, casa: Casa, todasCasasAtivas: Casa[]): RateioAgua {
    if (!todasCasasAtivas.some(c => c.id === casa.id)) throw new Error('Casa não está ativa no rateio de água.');
    if (!Number.isFinite(despesa.valorTotal) || despesa.valorTotal < 0) throw new Error('Valor de água inválido.');
    if (todasCasasAtivas.some(c => !Number.isInteger(c.quantidadePessoas) || c.quantidadePessoas < 1)) throw new Error('Quantidade de moradores inválida.');
    const taxaFixaCasa = TAXA_FIXA_AGUA;
    const totalTaxaFixa = taxaFixaCasa * todasCasasAtivas.length;
    if (despesa.valorTotal < totalTaxaFixa) throw new Error('Conta de água inferior às taxas fixas das casas.');
    const valorRestante = despesa.valorTotal - totalTaxaFixa;
    
    // Total de pessoas em todas as casas ativas
    const totalPessoas = todasCasasAtivas.reduce((sum, c) => sum + c.quantidadePessoas, 0);
    
    // Valor por pessoa (proporcional)
    const valorPorPessoaGlobal = totalPessoas > 0 ? valorRestante / totalPessoas : 0;
    
    // Valor por pessoa nesta casa específica
    const valorPorPessoa = valorPorPessoaGlobal;
    const valorTotalPorInquilino = taxaFixaCasa + valorPorPessoa;
    
    // Valor total que a casa paga (taxa fixa + valor por pessoa × quantidade de pessoas)
    // Distribuição em centavos; a última casa absorve o arredondamento residual.
    const index = todasCasasAtivas.findIndex(c => c.id === casa.id);
    const previous = todasCasasAtivas.slice(0, index).reduce((sum, c) => sum + roundMoney(taxaFixaCasa + valorPorPessoaGlobal * c.quantidadePessoas), 0);
    const valorTotalPorCasa = index === todasCasasAtivas.length - 1
      ? roundMoney(despesa.valorTotal - previous)
      : roundMoney(taxaFixaCasa + valorPorPessoa * casa.quantidadePessoas);

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
    // Consumo zero explícito é válido; não inferir leitura ausente como zero.
    if (temKwhPorCasa && (!despesa.consumoKwhPorCasa!.some(c => c.casaId === casa1.id) ||
        !despesa.consumoKwhPorCasa!.some(c => c.casaId === casa2.id))) {
      throw new Error('Informe as leituras das duas casas.');
    }
    const totalKwh = totalKwhInformado ? despesa.consumoKwhTotal! : kwhCasa1 + kwhCasa2;
    if (!Number.isFinite(despesa.valorTotal) || despesa.valorTotal < 0) throw new Error('Valor de energia inválido.');
    if (temKwhPorCasa && (!Number.isFinite(kwhCasa1) || !Number.isFinite(kwhCasa2) || kwhCasa1 < 0 || kwhCasa2 < 0)) throw new Error('Consumo de energia inválido.');
    if (temKwhPorCasa && totalKwhInformado && Math.abs(kwhCasa1 + kwhCasa2 - totalKwh) > 0.001) throw new Error('A soma dos consumos por casa difere do consumo total.');

    // Luz rateada pelo kWh consumido pela casa
    if (temKwhPorCasa && totalKwh <= 0) throw new Error('Informe consumo de energia maior que zero.');
    if (temKwhPorCasa && totalKwh > 0) {
      valorPorCasa1 = roundMoney((despesa.valorTotal * kwhCasa1) / totalKwh);
      valorPorCasa2 = roundMoney(despesa.valorTotal - valorPorCasa1);
    } else {
      valorPorCasa1 = roundMoney(despesa.valorTotal / 2);
      valorPorCasa2 = roundMoney(despesa.valorTotal - valorPorCasa1);
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
    const aluguel = casa.valorAluguel; // Valor total da casa

    // Água - aplica para todas as casas ativas
    const despesasAgua = despesasMes.filter((d): d is DespesaAgua => d.tipo === 'agua');
    const despesaAgua = despesasAgua.length ? { ...despesasAgua[0], valorTotal: roundMoney(despesasAgua.reduce((sum, d) => sum + d.valorTotal, 0)) } : undefined;

    const casasAtivas = casas.filter(c => c.status === 'ativo');

    let agua = despesaAgua && casa.status === 'ativo'
      ? this.calcularRateioAgua(despesaAgua, casa, casasAtivas)
      : {
          taxaFixaCasa: 0,
          valorRestante: 0,
          valorPorPessoa: 0,
          valorTotalPorInquilino: 0,
          valorTotalPorCasa: 0,
        };

    // A redução vale apenas para a casa selecionada e somente no ciclo de entrada.
    // As demais casas preservam seu rateio integral; a diferença não é redistribuída.
    const proporcionalidadeAgua = despesaAgua?.casasPrimeiraCobrancaProporcional?.includes(casaId)
      ? calcularProporcionalidadePrimeiraAgua(casa, despesaAgua, agua)
      : null;
    if (proporcionalidadeAgua) {
      const fator = proporcionalidadeAgua.diasOcupacao / proporcionalidadeAgua.diasCiclo;
      agua = {
        ...agua,
        taxaFixaCasa: proporcionalidadeAgua.taxaFixaProporcional,
        valorPorPessoa: roundMoney(agua.valorPorPessoa * fator),
        valorTotalPorInquilino: roundMoney(agua.valorTotalPorInquilino * fator),
        valorTotalPorCasa: proporcionalidadeAgua.valorProporcional,
        valorVariavelPorCasa: proporcionalidadeAgua.valorVariavelProporcional,
      };
    }

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
          valorPorInquilino = despesa.valorTotal;
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

    // Outras despesas exibidas como total por casa
    // A despesa cadastrada representa sempre o valor total da casa.
    const outrasDespesasTotal = despesasMes.filter(d => d.tipo === 'outras' && d.casaId === casaId)
      .reduce((sum, d) => sum + d.valorTotal, 0);

    // Total por inquilino = Aluguel + Água valor total por casa + Luz valor por casa + outras despesas
    // NOTA: Água e Luz são valores totais da casa, não divididos por pessoas
    const totalPorCasa = roundMoney(aluguel + agua.valorTotalPorCasa + valorLuzPorCasa + outrasDespesasTotal);
    const totalPorInquilino = casa.quantidadePessoas > 0 ? roundMoney(totalPorCasa / casa.quantidadePessoas) : 0;

    return {
      casaId: casa.id,
      casaNome: casa.nome,
      mes,
      aluguel,
      agua,
      luz,
      proporcionalidadeAgua,
      outrasDespesas,
      totalPorInquilino,
      totalPorCasa,
    };
  },
};

