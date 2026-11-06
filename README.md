# Gestão de Casas de Aluguel

Aplicação web para gestão de casas de aluguel com controle de despesas e rateios automáticos.

## Funcionalidades

### 1. Cadastro de Casas
- Nome ou identificação da casa
- Endereço (opcional)
- Data de início do contrato
- Valor do aluguel
- Quantidade de pessoas que moram na casa
- Status do contrato (ativo/inativo)

### 2. Cadastro de Despesas
Permite cadastrar despesas mensais por tipo:
- **Água**: Taxa fixa de R$ 38,00 por casa + rateio do restante por pessoa
- **Luz**: Dividida entre duas casas, depois proporcionalmente por pessoa
- **Outras despesas**: Descrição livre com opção de rateio por pessoa ou fixo por casa

### 3. Regras de Rateio

#### Água
- Taxa fixa mensal de R$ 38,00 por casa
- O valor restante é dividido igualmente pelo número de pessoas
- Cálculo automático do valor total por inquilino

#### Luz
- A conta é compartilhada entre duas casas (50% cada)
- Em cada casa, o valor é dividido proporcionalmente pelo número de pessoas
- Exibe o valor final por pessoa e por casa

#### Outras Despesas
- Pode ser dividida igualmente por pessoa ou valor fixo por casa

### 4. Relatórios Mensais
- Resumo mensal por casa contendo:
  - Aluguel
  - Água (taxa fixa + rateio)
  - Luz (rateio entre casas e pessoas)
  - Outras despesas
  - **Valor total por inquilino**
- Detalhamento dos cálculos de água e luz

## Tecnologias

- React 18
- TypeScript
- Vite
- React Router
- LocalStorage (armazenamento local)

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse a aplicação em `http://localhost:5173`

## Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist`.

## Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── CasaForm.tsx
│   ├── CasasList.tsx
│   └── DespesaForm.tsx
├── pages/           # Páginas da aplicação
│   ├── CasasPage.tsx
│   ├── DespesasPage.tsx
│   └── RelatorioPage.tsx
├── services/        # Serviços e lógica de negócio
│   ├── storage.ts
│   └── rateioService.ts
├── types/           # Tipos TypeScript
│   └── index.ts
├── App.tsx          # Componente principal
├── App.css          # Estilos globais
└── main.tsx         # Ponto de entrada
```

## Uso

1. **Cadastre as casas**: Vá para a página "Casas" e adicione as casas com suas informações
2. **Lance as despesas**: Na página "Despesas", adicione as despesas mensais (água, luz, outras)
3. **Visualize os relatórios**: Na página "Relatório", selecione o mês e a casa para ver o resumo completo

## Armazenamento

Os dados são armazenados localmente no navegador usando LocalStorage. Os dados persistem mesmo após fechar o navegador, mas são específicos do navegador e dispositivo.

## Licença

Este projeto é de uso livre.





