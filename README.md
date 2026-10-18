# EstudoPages

Site estático de estudo: um card por matéria, os textos e as questões na ordem do material, correção na hora e,
no fim, o resumo do que acertei e do que errei. As respostas ficam gravadas no navegador.

## Abrir

Precisa ser servido por http (o navegador não deixa a página ler os JSONs aberta direto do disco):

- **Para testar:** Live Server no VS Code → http://127.0.0.1:5500
- **Publicado:** GitHub Pages

## Matérias

Cada matéria é um JSON de estudo em `Estudos/`, gerado pela skill **Claude42** a partir dos PDFs de
`Base/<matéria>/` (a pasta `Base/` fica fora do git). O Claude42 grava o JSON em `Estudos/` e acrescenta a matéria
ao índice `Estudos/estudos.json`:

```json
{
  "estudos": [
    { "arquivo": "LPS_estudo.json", "materia": "Linhas de Produtos de Software", "sigla": "LPS" }
  ]
}
```

- `arquivo`: o nome do JSON dentro de `Estudos/`.
- `materia`: o nome que aparece no card.
- `sigla` (opcional): aparece no quadrado do card; sem ela, a página usa as iniciais da matéria.

### Formato do JSON de estudo

Uma lista em que cada item é um texto ou uma questão, na ordem em que devem ser estudados:

```json
[
  { "tipo": "materia", "tema": "…", "subtema": "…", "texto": "…" },
  { "tipo": "questao", "titulo": "…", "questao": "…",
    "alternativa_a": "…", "obs_a": "Errada: …",
    "alternativa_b": "…", "obs_b": "Correta: …",
    "resposta_correta": "b" }
]
```

As alternativas vão de `a` a `f` (as que existirem), cada uma com a sua `obs`, e só uma é a correta.

## Respostas

Ficam no `localStorage` do navegador, uma chave por matéria (`estudopages:<arquivo>`). No resumo da matéria dá
para exportar as respostas como `.json`, importar de volta (por exemplo, em outro aparelho) e refazer a matéria
do zero.
