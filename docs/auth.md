# Autenticação e segurança (Auth.js + JWT)

Regras a seguir em qualquer alteração a autenticação, sessões, perfis, permissões ou `proxy.ts`.

## Versão e compatibilidade

- `next-auth` com versão exata no `package.json`, sem `^` nem `~`. Mínimo: `5.0.0-beta.32`.
- Antes de atualizar, confirmar a versão atual e se há avisos de segurança novos.
- No Next.js 16 o ficheiro é `proxy.ts` (não `middleware.ts`) e exporta uma função `proxy` ou um default.

## Configuração

- `session: { strategy: "jwt" }` com provider Credentials (email + palavra-passe).
- Configuração dividida em `auth.config.ts` (compatível com Edge, sem acesso à base de dados) e `auth.ts` (com Prisma).
- Sem adapter: `User` modelado diretamente em Prisma, sem tabelas Account/Session/VerificationToken.
- O JWT leva apenas `userId`, `companyId` e `role`, com `maxAge` curto (8 a 12 horas), porque um JWT não pode ser revogado antes de expirar.
- Cookies seguros em produção (httpOnly, secure, sameSite). `AUTH_SECRET` só em variáveis de ambiente.

## Palavras-passe

- Hash forte (bcrypt) e política mínima de palavra-passe.
- Limite de tentativas por email e por IP.
- Mensagens de erro de início de sessão genéricas, sem revelar se o email existe.
- Recuperação de palavra-passe fica fora de âmbito até haver uma fase própria.

## Autorização

- `requireUser()` em cada Server Action, route handler e página protegida. Lê o utilizador na base de dados e valida se está ativo, o `companyId` e o `role` atual; não confia só no conteúdo do token.
- Desativar um utilizador ou mudar-lhe o perfil tem efeito imediato.
- `proxy.ts` serve só para redirecionar utilizadores sem sessão (UX). Não é uma fronteira de segurança.
- Toda a query a dados de empresa filtra por `companyId` obtido do utilizador validado, nunca de input do cliente.

## Testes de segurança a repetir

Acesso entre empresas, escalada de perfil, token de utilizador desativado, ações sem sessão e tentativas repetidas de início de sessão.
