# Como configurar CSP no Netlify usando o arquivo _headers

Crie (ou edite) um arquivo chamado **_headers** na raiz do seu projeto (ou na pasta `public/` se usar frameworks como React/Vue).

Exemplo de configuração para liberar conexões com o Supabase:

```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://iafamwvctehdltqmnhyx.supabase.co;
```

## Dicas:

- Se você usa outros serviços do Supabase (storage, functions, etc.), use:
  ```
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co;
  ```
- Se carrega imagens, scripts, fontes ou estilos de outros domínios, adicione as diretivas necessárias, por exemplo:
  ```
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://outro-dominio.com; script-src 'self' https://cdn.jsdelivr.net;
  ```
- **Sempre teste** após alterar o CSP, pois regras muito restritivas podem quebrar funcionalidades do site.

## Como funciona

- O Netlify irá adicionar esse header HTTP em todas as respostas para os caminhos especificados (`/*` = todo o site).
- O header HTTP **sempre prevalece** sobre o `<meta http-equiv="Content-Security-Policy">`.

## Referências

- [Netlify Docs: Custom headers](https://docs.netlify.com/routing/headers/)
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP)