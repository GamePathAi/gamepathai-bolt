# Exemplo Prático de `_headers` para Netlify com CSP

Coloque este arquivo chamado **_headers** na raiz do seu projeto (ou em `public/` se seu framework copiar arquivos estáticos de lá).

**Conteúdo recomendado:**
```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://iafamwvctehdltqmnhyx.supabase.co;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

Se você usa outros serviços do Supabase, pode usar:
```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

---

## Checklist para garantir que o CSP está funcionando

1. **Arquivo `_headers` está na raiz do projeto** (ou em `public/` se necessário).
2. **Nome do arquivo é exatamente `_headers`** (sem extensão, sem ponto no início).
3. **Conteúdo do arquivo é texto puro** (sem markdown, sem crases, sem aspas).
4. **Deploy feito no Netlify** após a alteração.
5. **Verifique no navegador:**
   - Abra DevTools → Network → clique em `/` → Response Headers.
   - O header `content-security-policy` deve aparecer e conter o domínio do Supabase.
6. **Teste a integração**: O erro de CSP deve sumir e as requisições para o Supabase funcionar normalmente.

---

## Dicas Extras

- Se usar outros domínios externos (APIs, imagens, scripts), adicione-os nas diretivas apropriadas (`connect-src`, `img-src`, etc.).
- Sempre teste após cada alteração para garantir que não quebrou nenhuma funcionalidade do site.
- Se continuar com problemas, envie aqui:
  - O caminho e conteúdo do seu `_headers`
  - Estrutura do seu projeto (top-level folders/files)

---

**Referências:**
- [Netlify Docs: Custom headers](https://docs.netlify.com/routing/headers/)
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP)