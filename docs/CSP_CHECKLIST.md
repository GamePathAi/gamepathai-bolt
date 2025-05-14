# Checklist: Ajustes de Segurança/CSP em GamePathAI

## 1. CSP via Header HTTP (Netlify)
- [x] netlify.toml já implementa CSP completa, incluindo `connect-src` para Supabase.

## 2. index.html
- [ ] Remover `<meta http-equiv="Content-Security-Policy" ...>` para evitar conflito/redundância.

## 3. public/service-worker.js
- [ ] Remover função `addSecurityHeaders` e todas as suas chamadas.  
- [ ] Retornar o objeto `response` puro nas rotas, sem tentar setar CSP pelo SW.

## 4. Downloads (/downloads/*)
- [x] netlify.toml já implementa headers apropriados para downloads.

---

**Após aplicar todos os ajustes, faça:**
- Deploy do site para garantir policy CSP correta.
- Teste navegação, logins, requests para Supabase.
- Verifique pelo DevTools que o header `Content-Security-Policy` aparece no HTML carregado.
- Veja se os erros de bloqueio sumiram.

Se precisar de códigos/patches exatos para esses passos, é só pedir!