# Tour Interativo · Empreendimentos

Substitui o PDF na reunião comercial remota de imóvel. O corretor compartilha a
tela; o cliente navega pelo empreendimento, abre uma unidade, vê de onde ela
olha, como o sol bate nela ao longo do dia e do ano, a planta, as condições de
pagamento e a distância até cada item do condomínio.

Dois empreendimentos no mesmo app:

|                     |                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Village One**     | Ribeiro Engenharia · Av. Eng. Fernando Guilhon, Maracanã, Santarém/PA. Duas torres de 20 pavimentos, 156 unidades. |
| **Flat Premium II** | Guarnão · Rua Magnólia com Alameda Trinta e Três, Santarém/PA. Seis pavimentos, 66 flats de 31,40 m².              |

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5180 — Village One. Para o Flat Premium II:
http://localhost:5180/?e=flat-premium-ii

Dentro do app, o seletor abaixo do nome troca entre os dois. A troca recarrega
a página de propósito: o mundo inteiro muda (geometria, dados, coordenadas).

## Multi-empreendimento

`src/core/` é o motor e não conhece nenhum empreendimento. Cada empreendimento
vive em `src/empreendimentos/<id>/` com três módulos de dados — `world.ts`
(coordenadas e geometria matemática), `project.ts` (dados comerciais) e
`inventory.ts` (estoque) — mais a própria cena em `cena/`.

`src/core/ativo.ts` escolhe qual está ativo, lendo `?e=` uma vez por
carregamento. `src/core/world.ts` e `src/data/*.ts` são **fachadas de valor**:
reexportam o empreendimento ativo com os mesmos nomes de sempre, para que a
interface, a interação, a luz e os visualizadores não precisem saber que existe
mais de um. A geometria de cada empreendimento importa do próprio `world.ts`,
nunca da fachada.

Componente não entra em `ativo.ts`: cena lê o estado, o estado lê o estoque, e
o estoque sai de lá — importar componente ali fecha um ciclo. Quem escolhe a
geometria é `src/core/Geometria.tsx`.

Para somar um terceiro empreendimento: criar a pasta com os três módulos e a
cena, e registrá-lo em `ativo.ts`. Nada mais precisa mudar.

## O que é real e o que é ficção

Esta é a **fase de demonstração**. Vem do anúncio real da Amauri Assessoria
Imobiliária (ref. 25): as duas torres de 20 andares, a construtora, o endereço,
as duas tipologias (111 m² com 3 dormitórios e 75 m² com 2), a infraestrutura
e os 15 renders em `public/img/render/`.

É **ficção verossímil**, gerada e marcada como tal: o estoque unidade a unidade,
os preços por andar, a cobertura duplex, as plantas, a orientação das torres no
terreno, as amenidades e os pontos urbanos.

**O Flat Premium II é o contrário:** os dados são reais, transcritos do memorial
descritivo, da apresentação e do quadro de valores recebidos em 29/10/2026 —
inclusive as quatro condições de pagamento das seis unidades disponíveis, que a
interface mostra como transcritas e **nunca recalcula**. Não há projeto
arquitetônico executivo: a construtora ainda não liberou, então a geometria é
interpretada dos renders comerciais. Os pavimentos 4 e 5 chegaram sem situação
comercial e aparecem como "Sob consulta", sem preço inventado. As distâncias
urbanas são estimativas e precisam de conferência antes de uso comercial.

Para a fase de venda real, troque `project.ts` e `inventory.ts` do empreendimento
pelos números oficiais. Nada mais precisa mudar.

## Organização

`src/core/` é contrato compartilhado e ninguém escreve nele por conta própria.

| diretório                | responsabilidade                                    |
| ------------------------ | --------------------------------------------------- |
| `src/core/`              | sistema de coordenadas, tipos, estado compartilhado |
| `src/data/`              | empreendimento, tipologias, estoque gerado          |
| `src/scene/building/`    | torres, pódio, laje de lazer, terreno, entorno      |
| `src/scene/env/`         | sol real, céu, sombras, noite, pós-processamento    |
| `src/scene/interaction/` | hotspots das 156 unidades, câmera, etiquetas        |
| `src/ui/`                | barra de estados, filtros, espelho de vendas, ficha |
| `src/viewers/`           | galeria, plantas em SVG, filme, mapa de distâncias  |

O sistema de coordenadas está em `src/core/world.ts`: metros, Y para cima,
**Norte = −Z, Leste = +X**. Medidas saem de lá, não de números soltos no código.

## Decisões que não são óbvias

- **3D em tempo real, não render pré-produzido.** Duas torres × 20 pavimentos ×
  4 posições dá centenas de combinações; não se pré-renderiza isso. A geometria
  é gerada por código e as texturas são procedurais — nenhum asset pesado.
- **O sol é real.** Posição calculada para a latitude de Santarém (−2,4431) por
  hora e por mês. A 2° do Equador o sol do meio-dia é quase vertical e as
  sombras quase somem: isso é fato, não defeito.
- **A resolução cede antes da fluidez.** A cena é limitada por fill rate. O dpr
  é limitado a 1,5 e cai para 1 sob carga. Numa chamada de vídeo, engasgo lê
  como produto mal feito.
- **A vista da janela mira na direção cardeal da unidade**, com 2° de queda, e
  nos dois primeiros pavimentos o alvo trava acima da laje de lazer — senão o
  cliente mira no chão da própria área comum.

O documento de design está em
`docs/superpowers/specs/2026-10-29-village-one-tour-design.md`, com objetivos,
não-objetivos e anti-objetivos.
