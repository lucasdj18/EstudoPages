# EstudoPages

Site estático de estudo: um card por matéria, os textos e as questões na ordem do material, correção na hora e,
no fim, o resumo do que acertei e do que errei. As respostas ficam gravadas no navegador.

## Abrir

Precisa ser servido por http (o navegador não deixa a página ler os JSONs aberta direto do disco):

- **Para testar:** Live Server no VS Code → http://127.0.0.1:5500
- **Publicado:** GitHub Pages

## Matérias

Cada matéria é um JSON de estudo em `Estudos/`, gerado pela skill **Claude42** a partir dos PDFs de
`Base/<matéria>/` (a pasta `Base/` fica fora do git). O Claude42 grava o JSON em `Estudos/` e acrescenta o nome do
arquivo ao índice `Estudos/estudos.json` (o GitHub Pages não deixa a página listar a pasta, por isso o índice):

```json
{
  "estudos": [
    "LPS_estudo.json"
  ]
}
```

### Formato do JSON de estudo

Cada arquivo é uma **matéria**, dividida em **capítulos** (as subdisciplinas) e **temas** (o assunto de cada
conteúdo). A lista começa com o item `info` (nome e sigla da matéria, que aparecem no card) e segue com os
conteúdos e as questões, na ordem em que devem ser estudados:

```json
[
  { "tipo": "info", "materia": "Linhas de Produtos de Software", "sigla": "LPS" },
  { "tipo": "conteudo", "id": "<UUID>", "capitulo": "…", "tema": "…", "texto": "…" },
  { "tipo": "questao", "id": "<UUID>", "capitulo": "…", "tema": "…", "titulo": "…", "questao": "…",
    "alternativa_a": "…", "obs_a": "Errada: …",
    "alternativa_b": "…", "obs_b": "Correta: …",
    "resposta_correta": "b" }
]
```

- Todo conteúdo e toda questão têm um `id` único (UUID) e trazem `capitulo` e `tema`.
- As alternativas vão de `a` a `f` (as que existirem), cada uma com a sua `obs`, e só uma é a correta.
- Sem o item `info`, o card usa o nome do arquivo e as iniciais.
- O formato antigo (`"tipo": "materia"` com `tema`/`subtema`) não é mais aceito.

## Respostas

Ficam no `localStorage` do navegador, uma chave por matéria (`estudopages:<arquivo>`). No resumo da matéria dá
para refazer a matéria do zero. Nada é enviado nem baixado: as respostas ficam só neste navegador.
