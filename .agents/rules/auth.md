# Regras de autenticação e segurança (Auth.js + JWT)

Aplica estas regras sempre que mexeres em autenticação, sessões, perfis, permissões ou middleware/proxy.

## Versão e compatibilidade

- Instala com `next-auth@beta` e fixa a versão exata no package.json (sem ^ nem ~). Mínimo: 5.0.0-beta.32.
- Antes de implementar, confirma a versão atual e se há avisos de segurança novos. Diz-me o que encontraste.
- Confirma a compatibilidade com a versão do Next.js em uso. No Next.js 16 o ficheiro é `proxy.ts` (não `middleware.ts`) e tem de exportar uma função `proxy` ou um default.

## Configuração

- `session: { strategy: "jwt" }` com provider Credentials (email + palavra-passe).
- Configuração dividida em `auth.config.ts` (compatível com Edge, sem acesso à base de dados) e `auth.ts` (com Prisma).
- Se só usarmos Credentials, não uses o adapter: modela `User` diretamente em Prisma, sem tabelas Account/Session/VerificationToken sem uso.
- O JWT leva apenas `userId`, `companyId` e `role`, com `maxAge` curto (8 a 12 horas), porque um token JWT não pode ser revogado antes de expirar.
- Cookies seguros em produção (httpOnly, secure, sameSite). `AUTH_SECRET` só em variáveis de ambiente.

## Palavras-passe

- Hash forte (argon2 ou bcrypt) e política mínima de palavra-passe.
- Limite de tentativas por email e por IP.
- Mensagens de erro de início de sessão genéricas (não revelar se o email existe).
- Recuperação de palavra-passe fica fora de âmbito até haver uma fase própria.

## Autorização

- Cria e usa um helper de servidor `requireUser()` em cada Server Action, route handler e página protegida. Lê o utilizador na base de dados e valida: ativo? mesmo `companyId`? `role` atual? Não confies só no conteúdo do token.
- Desativar um utilizador ou mudar-lhe o perfil tem de ter efeito imediato.
- O `proxy.ts` serve só para redirecionar utilizadores sem sessão (UX). Não é uma fronteira de segurança.
- Toda a query a dados de empresa filtra por `companyId` obtido do utilizador validado, nunca de input do cliente.

## Revisão no fim da Fase 2

Testa e reporta: acesso entre empresas, escalada de perfil, token de utilizador desativado, ações sem sessão e tentativas repetidas de início de sessão.