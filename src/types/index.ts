export interface Casa {
  id: string;
  nome: string;
  endereco?: string;
  dataInicioContrato: string;
  valorAluguel: number;
  quantidadePessoas: number;
  status: 'ativo' | 'inativo';
}

export type TipoDespesa = 'agua' | 'luz' | 'outras';

export interface DespesaAgua {
  id: string;
  tipo: 'agua';
  mes: string; // formato YYYY-MM
  valorTotal: number;
  imagensComprovantes?: ImagemComprovante[]; // Imagens do comprovante da conta de água
  // Aplica para todas as casas ativas
}

export interface ConsumoKwhPorCasa {
  casaId: string;
  kwh: number;
}

export interface ImagemComprovante {
  id: string;
  casaId: string;
  url: string; // base64 ou URL
  nomeArquivo: string;
  dataUpload: string;
}

export interface DespesaLuz {
  id: string;
  tipo: 'luz';
  casa1Id: string;
  casa2Id: string;
  mes: string; // formato YYYY-MM
  valorTotal: number;
  consumoKwhTotal?: number;
  consumoKwhPorCasa?: ConsumoKwhPorCasa[]; // kWh por cada casa do par
  imagensComprovantes?: ImagemComprovante[]; // Imagens dos comprovantes por casa
  imagemContador?: ImagemComprovante; // Imagem do contador/relógio de luz
  dataLeituraAnterior?: string; // Data real da leitura anterior (YYYY-MM-DD)
  dataLeituraAtual?: string; // Data real da leitura atual (YYYY-MM-DD)
  casasPrimeiraCobrancaProporcional?: string[]; // Casas com opção ativada no relatório
}

export interface DespesaOutras {
  id: string;
  tipo: 'outras';
  casaId: string;
  mes: string; // formato YYYY-MM
  descricao: string;
  valorTotal: number;
  tipoRateio: 'por-pessoa' | 'fixo-casa';
}

export type Despesa = DespesaAgua | DespesaLuz | DespesaOutras;

export interface RateioAgua {
  taxaFixaCasa: number; // R$ 38,00
  valorRestante: number;
  valorPorPessoa: number;
  valorTotalPorInquilino: number;
  valorTotalPorCasa: number; // taxa fixa + (valor por pessoa × quantidade de pessoas)
}

export interface RateioLuz {
  valorPorCasa1: number;
  valorPorCasa2: number;
  valorPorPessoaCasa1: number;
  valorPorPessoaCasa2: number;
}

export interface ItemRelatorio {
  descricao: string;
  valor: number;
}

export interface RelatorioMensal {
  casaId: string;
  casaNome: string;
  mes: string;
  aluguel: number;
  agua: RateioAgua;
  luz: RateioLuz | null;
  outrasDespesas: ItemRelatorio[];
  totalPorInquilino: number;
  totalPorCasa: number;
}

export interface ContadorKwh {
  id: string;
  casaId: string; // Casa associada (obrigatório)
  mes: string; // formato YYYY-MM
  leituraAtual: number;
  leituraAnterior?: number; // Leitura do mês anterior
  consumo: number; // Calculado: leituraAtual - leituraAnterior
  dataLeitura: string; // Data da leitura
}

