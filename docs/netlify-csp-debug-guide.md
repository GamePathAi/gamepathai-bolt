# Debug: Content Security Policy no Netlify

## 1. **Verifique o arquivo `_headers`**

O arquivo deve estar na **raiz do projeto** (ou na pasta `public/` se usar frameworks como React/Vue).

Exemplo correto:

```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://iafamwvctehdltqmnhyx.supabase.co;
```

> **Atenção:** Não use crase (\`) ou markdown dentro do arquivo `_headers`, apenas texto puro.

---

## 2. **Faça o Deploy e Limpe o Cache**

- Faça deploy no Netlify.
- Limpe o cache do navegador ou use uma janela anônima.

---

## 3. **Confirme o Header na Resposta**

- Abra o site publicado.
- No DevTools, vá em **Network** > clique em qualquer requisição (ex: `/`).
- Em **Response Headers**, procure por `content-security-policy`.

**Se não aparecer, o Netlify não está aplicando o header!**

---

## 4. **Possíveis Motivos para o Header não aparecer**

- O arquivo está com nome errado (`_headers` e não `.headers` ou `headers.txt`).
- O arquivo está na pasta errada.
- O build do framework sobrescreve a pasta `public/` (em alguns casos, mova o `_headers` para a raiz do projeto).
- Algum plugin de build remove ou sobrescreve headers.

---

## 5. **Exemplo Completo de `_headers`**

```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://iafamwvctehdltqmnhyx.supabase.co;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

---

## 6. **Se precisar liberar todos os serviços do Supabase:**

```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co;
```

---

## 7. **Referências**

- [Netlify Docs: Custom headers](https://docs.netlify.com/routing/headers/)
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP)

---

## 8. **Resumo**

- O erro só vai sumir quando o header `Content-Security-Policy` **aparecer nas respostas HTTP** do seu site.
- O `<meta http-equiv="Content-Security-Policy">` **não resolve** se o header HTTP não estiver correto.
- Se continuar com problemas, envie o conteúdo do seu `_headers` e o caminho onde ele está no projeto para revisão.