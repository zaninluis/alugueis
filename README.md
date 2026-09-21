# Apartamentos — controle de aluguel de veraneio

MVP para acompanhar quem está em cada um dos 12 apartamentos, quantas pessoas e por qual período.

## Rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

## O que tem

- **Hoje**: 12 cards, um por apartamento. Ocupado (colorido) mostra hóspede, nº de pessoas, período e "sai em X dias". Livre (tracejado) mostra a próxima reserva ou o atalho pra criar uma.
- **Calendário**: linha do tempo — apartamentos nas linhas, dias nas colunas, barras coloridas por reserva. Toque num espaço vazio pra criar, numa barra pra editar.
- **Reserva**: apartamento, hóspede, pessoas, entrada/saída, telefone e observações (opcionais). Bloqueia conflito de datas no mesmo apartamento.

## Banco de dados (Supabase)

Pra várias pessoas verem e editarem as mesmas reservas em celulares/computadores diferentes:

1. Crie uma conta gratuita em https://supabase.com e um projeto novo (região: South America / São Paulo).
2. No projeto, abra **SQL Editor > New query**, cole o conteúdo de [supabase/schema.sql](supabase/schema.sql) e clique em **Run**.
3. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
4. Copie `.env.example` para `.env` e preencha os dois valores.
5. Reinicie o `npm run dev`. O aviso amarelo "Modo demonstração" some.

Mudanças feitas num aparelho aparecem nos outros em tempo real.

Sem `.env`, o app roda em **modo demonstração**: dados só no `localStorage` deste navegador, com dados de exemplo na primeira abertura.

> Segurança: não há login. Qualquer pessoa com o link do app (e a chave anon, que fica no código do site) consegue ver e editar as reservas. Pra um grupo pequeno de família isso costuma bastar; se precisar restringir, o próximo passo é ativar Supabase Auth e trocar as policies em `schema.sql`.

## Publicar (Vercel)

```bash
npx vercel
```

Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do projeto na Vercel.
