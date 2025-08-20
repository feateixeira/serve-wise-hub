# Sistema de Dados Técnicos - Serve Wise Hub

## Visão Geral

O sistema de dados técnicos foi implementado para permitir que estabelecimentos gerenciem seus custos fixos, variáveis e realizem análises financeiras detalhadas. Esta funcionalidade é essencial para hamburguerias, lanchonetes e outros estabelecimentos que precisam controlar seus custos e precificar produtos adequadamente.

## Funcionalidades Implementadas

### 1. Cadastro de Custos Fixos (CF)

**O que é:** Despesas que não variam com o volume de vendas (ex: aluguel, energia, internet, salários administrativos).

**Campos obrigatórios:**
- Nome do custo
- Valor (R$)
- Data de início
- Recorrência (mensal, anual, único)

**Campos opcionais:**
- Descrição detalhada

**Recorrências:**
- **Mensal:** Custo aplicado todo mês
- **Anual:** Custo dividido por 12 para cálculo mensal
- **Único:** Custo não incluído no cálculo mensal

### 2. Cadastro de Custos Variáveis (CV)

**O que é:** Ingredientes e matéria-prima utilizados na produção dos produtos.

**Campos obrigatórios:**
- Nome do ingrediente
- Quantidade adquirida
- Valor total pago (R$)
- Unidade de medida
- Data da compra

**Campos opcionais:**
- Descrição
- Fornecedor
- Data de validade

**Unidades de medida disponíveis:**
- Unidade
- Quilograma (kg)
- Grama (g)
- Litro (L)
- Mililitro (ml)
- Pacote
- Caixa

**Cálculo automático:** O sistema calcula automaticamente o custo unitário (valor total ÷ quantidade).

### 3. Configuração de Ingredientes dos Produtos

**O que é:** Relaciona produtos com seus ingredientes e quantidades utilizadas.

**Campos obrigatórios:**
- Produto (selecionado da lista de produtos)
- Ingrediente (selecionado da lista de custos variáveis)
- Quantidade utilizada
- Custo unitário no momento

**Cálculo automático:** O sistema calcula o custo total do ingrediente no produto.

### 4. Dashboard Financeiro

**Cards de resumo:**
- **Custos Fixos Mensais:** Soma de todos os custos fixos recorrentes
- **Custos Variáveis:** Total investido em ingredientes
- **Custo Unitário Médio:** Média dos custos unitários dos ingredientes
- **Margem de Lucro:** Percentual configurável para precificação

**Configurações:**
- Margem de lucro ajustável (0-100%)
- Seletor de período (mês atual, mês passado, ano atual)

### 5. Análise de Custos

**Gráficos e visualizações:**
- **Distribuição de Custos:** Comparação entre custos fixos e variáveis
- **Análise de Produtos:** Custo unitário médio e preço sugerido
- **Relatórios:** Histórico de análises por período

**Cálculos automáticos:**
- Custo total = CF + CV
- Custo unitário = (CF ÷ quantidade vendida) + CV unitário
- Preço sugerido = Custo unitário × (1 + margem de lucro)

### 6. Relatórios e Exportação

**Funcionalidades:**
- Visualização de relatórios por período
- Botões para exportar em PDF e Excel (preparados para implementação)
- Histórico de análises de custos

## Como Usar

### Primeiro Acesso

1. **Acesse** a página "Dados Técnicos" no menu lateral
2. **Configure** sua margem de lucro desejada
3. **Cadastre** seus custos fixos (aluguel, contas, etc.)
4. **Cadastre** seus ingredientes com preços e quantidades
5. **Configure** quais ingredientes cada produto utiliza

### Fluxo de Trabalho Diário

1. **Atualize** custos variáveis quando comprar novos ingredientes
2. **Monitore** o dashboard para acompanhar custos totais
3. **Analise** relatórios para tomar decisões de precificação
4. **Ajuste** margens de lucro conforme necessário

### Exemplo Prático

**Cenário:** Lanchonete que vende X-Burguer

1. **Custos Fixos:**
   - Aluguel: R$ 2.000/mês
   - Energia: R$ 300/mês
   - Internet: R$ 100/mês
   - **Total CF mensal: R$ 2.400**

2. **Custos Variáveis (ingredientes):**
   - Pão: 50 unidades por R$ 60 → R$ 1,20/unidade
   - Carne: 10kg por R$ 80 → R$ 8,00/kg
   - Queijo: 2kg por R$ 40 → R$ 20,00/kg

3. **Configuração do X-Burguer:**
   - 1 pão: R$ 1,20
   - 150g carne: R$ 1,20
   - 30g queijo: R$ 0,60
   - **CV unitário: R$ 3,00**

4. **Cálculo de Preço:**
   - Se vender 100 X-Burguers por mês:
   - CF por unidade: R$ 2.400 ÷ 100 = R$ 24,00
   - Custo total: R$ 24,00 + R$ 3,00 = R$ 27,00
   - Com margem de 30%: R$ 27,00 × 1,3 = **R$ 35,10**

## Estrutura do Banco de Dados

### Tabelas Criadas

1. **`fixed_costs`** - Custos fixos do estabelecimento
2. **`variable_costs`** - Ingredientes e custos variáveis
3. **`product_ingredients`** - Relacionamento produtos-ingredientes
4. **`cost_analysis`** - Histórico de análises de custos

### Relacionamentos

- Todas as tabelas estão vinculadas ao `establishment_id`
- Row Level Security (RLS) implementado para isolamento de dados
- Triggers automáticos para atualização de timestamps

## Segurança e Isolamento

- **Multi-tenancy:** Cada estabelecimento vê apenas seus próprios dados
- **RLS Policies:** Políticas de segurança no nível do banco de dados
- **Validação:** Campos obrigatórios e validações de formato
- **Auditoria:** Timestamps de criação e atualização

## Próximos Passos (Funcionalidades Futuras)

1. **Gráficos interativos** com bibliotecas como Chart.js ou Recharts
2. **Exportação real** para PDF e Excel
3. **Alertas** para ingredientes próximos do vencimento
4. **Integração** com sistema de estoque
5. **Relatórios comparativos** entre períodos
6. **Dashboard executivo** com KPIs de rentabilidade

## Suporte Técnico

Para dúvidas ou problemas:
- Verifique os logs do console do navegador
- Confirme se as migrações foram executadas no Supabase
- Valide se o usuário tem permissões adequadas no estabelecimento

## Conclusão

O sistema de dados técnicos fornece uma base sólida para o controle financeiro do estabelecimento, permitindo:
- **Visibilidade total** dos custos operacionais
- **Precificação inteligente** baseada em dados reais
- **Análise histórica** para tomada de decisões
- **Controle granular** de ingredientes e produtos

Esta implementação atende aos requisitos especificados e fornece uma base extensível para futuras melhorias e funcionalidades avançadas.

