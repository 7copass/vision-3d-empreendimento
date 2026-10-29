# Village One — Tour Interativo · Documento de Design

Data: 2026-10-29

## Intenção

Transformar a reunião comercial remota de apartamento de alto padrão numa visita.
Hoje o corretor compartilha a tela e mostra PDF: plantas soltas, renders sem contexto,
nenhuma resposta para "onde fica", "para onde olha", "como é de manhã", "o que ainda tem".

Referência: a ferramenta que a Taipa.inc usa em Milagres (AL) — masterplan navegável com
hotspot por casa, ficha com distâncias, estudo de sol, plantas e filmes. Analisada em vídeo.

Diferença estrutural: lá é condomínio horizontal, com acervo de render pago (~53 imagens
por casa). Aqui é torre vertical, 2 × 20 pavimentos, sem acervo. Pré-renderizar as
centenas de combinações andar × posição é inviável. Logo o motor é **3D em tempo real**.

## Objetivos

1. O cliente entende onde a unidade está no prédio sem ninguém explicar.
2. O cliente vê para onde a janela olha, do andar dela, não de um render genérico.
3. O cliente sente o sol da unidade ao longo do dia e do ano, e o prédio à noite.
4. O corretor abre a ficha completa em um clique, com distância até cada item do condomínio.
5. O estoque (disponível / reservada / vendida) aparece no 3D, criando escassez na conversa.
6. Roda no navegador de um notebook comum, em chamada com tela compartilhada.

## Não-objetivos

- Não é passeio em primeira pessoa dentro do apartamento (não há acervo para isso).
- Não é CRM: não cadastra lead, não fecha proposta, não integra com sistema de vendas.
- Não é app móvel. É desktop em call; o celular só precisa não quebrar.
- Não precisa de back-end nesta fase. Dados vêm de arquivo.

## Anti-objetivos (falha mesmo funcionando)

- Ficar com cara de maquete de videogame. Tem que parecer peça de arquitetura.
- Travar ou cair abaixo de ~30 fps numa máquina de corretor durante a call.
- Exigir que o corretor aprenda a operar. Tudo tem que ser óbvio em 10 segundos.
- Ter informação que contradiz o material oficial do empreendimento.

## Estado atual

Base real extraída do anúncio da Amauri Assessoria Imobiliária (ref. 25):
Village One, construtora Ribeiro Engenharia, Av. Eng. Fernando Guilhon, Maracanã,
Santarém/PA. 2 torres de 20 andares. Tipo 1: 111 m², 1 suíte + 2 quartos, 2 vagas,
~R$ 820 mil. Tipo 2: 75 m², 1 suíte + 1 quarto, 2 vagas, ~R$ 650 mil. Infraestrutura:
piscina, academia, salão de festas, mercado 24h, portaria e segurança 24h.
15 renders em 900×506, com marca d'água, baixados para `public/img/render/`.

Esta é a fase de demonstração. Tudo que o anúncio não informa — estoque unidade a
unidade, preços por andar, plantas, orientação das torres, pontos urbanos — é
**ficção verossímil**, gerada e marcada como tal. A fase seguinte (venda real)
substitui o arquivo de dados pelos números oficiais sem tocar no restante.

## Como é feito

- Vite + React 19 + TypeScript
- Three.js via @react-three/fiber, com @react-three/drei e @react-three/postprocessing
- zustand para estado compartilhado, framer-motion para a UI, Tailwind v4 para o chrome
- suncalc para posição real do sol em Santarém (−2,4431 / −54,7083)
- Geometria das torres gerada por código. Sem modelo externo, sem download de asset pesado.

Escolhas minhas, não acordadas: o stack acima, a geometria procedural, e a divisão de
arquivos abaixo. Derrubáveis.

## Telas

1. **Órbita** — o complexo inteiro. Arrastar gira, scroll aproxima. Estado inicial.
2. **Unidade** — clique em um pavimento: a laje acende, as outras esmaecem, ficha abre.
3. **Vista** — câmera vai para a varanda da unidade e olha para fora.
4. **Galeria** — renders em tela cheia, navegáveis por ambiente, com contador.
5. **Plantas** — planta humanizada em SVG, paginada, com zoom.
6. **Filme** — player.
7. **Mapa** — distâncias até pontos de Santarém.

Sobre tudo isso: barra de estados no topo (tipologia, status, horário, noite) e
painel de pavimentos à direita, espelhando o estoque.

## Sistema de coordenadas (contrato)

Metros, Y para cima. **Norte = −Z, Sul = +Z, Leste = +X, Oeste = −X.**
Terreno 200 × 150 centrado na origem. Pódio 150 × 80 de y=0 a y=10,5 — laje de lazer
no topo. Torre A em x=−34, Torre B em x=+34, ambas z=−6, planta 30 × 22.
Pé-direito 3,15 m. Pavimento n ocupa y = 10,5 + (n−1)·3,15.
Posições por pavimento: 1 = Noroeste, 2 = Nordeste, 3 = Sudeste, 4 = Sudoeste.
Número da unidade: andar (2 dígitos) + posição (2 dígitos) — `1204` = 12º andar, posição 4.

## Divisão do trabalho

Cada frente é dona de um diretório e não escreve fora dele. Contratos em `src/core/`.

| Frente | Diretório | Entrega |
|---|---|---|
| Arquitetura 3D | `src/scene/building/` | torres, pódio, terreno, entorno, materiais |
| Luz e atmosfera | `src/scene/env/` | sol real, céu, sombras, noite, pós-processamento |
| Interação 3D | `src/scene/interaction/` | hotspots, seleção, câmera, vista da janela |
| Chrome da UI | `src/ui/` | barra de estados, filtros, painel de pavimentos, ficha |
| Visualizadores 2D | `src/viewers/` | galeria, plantas SVG, filme, mapa de distâncias |

Integração em `src/App.tsx` e `src/core/` — do integrador.
