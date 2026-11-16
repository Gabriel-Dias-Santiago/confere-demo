# Publicar o Confere. no GitHub

**Repositório planejado:** `https://github.com/Gabriel-Dias-Santiago/confere-demo`.

A URL acima **não está ativa até que o projeto seja enviado**.

## Método automático (GitHub CLI)

1. Instale o [GitHub CLI](https://cli.github.com/) e o Git.
2. Entre na sua conta com `gh auth login`.
3. Extraia o ZIP e abra o terminal na pasta do projeto.
4. Rode:

```bash
bash publicar-no-github.sh
```

O script cria um repositório público `Gabriel-Dias-Santiago/confere-demo` e publica todo o conteúdo (README, código, capturas e vídeo). Ele interrompe a execução se esse repositório já existir ou se a pasta já tiver um histórico Git.

## Método manual

Se preferir, crie primeiro um repositório público **vazio** com nome `confere-demo` em https://github.com/new. Na pasta extraída do projeto:

```bash
git init -b main
git add .
git commit -m "feat: publicar Confere demo"
git remote add origin https://github.com/Gabriel-Dias-Santiago/confere-demo.git
git push -u origin main
```

Depois de confirmar os arquivos em `https://github.com/Gabriel-Dias-Santiago/confere-demo`, copie a legenda de `docs/social/LEGENDA_LINKEDIN.md` e poste as cinco imagens do carrossel.

### Demonstração opcional via GitHub Pages

Após publicar, em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`. Como o projeto é estático, não requer build. Só anuncie a URL de demonstração depois de verificar que foi publicada.

**Nota de escopo:** somente dados fictícios; nenhuma ação bancária real ocorre no protótipo.
