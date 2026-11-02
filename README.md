# Brasão

**Três duelos. Uma só mão.** Um jogo tático de cartas sobre ler intenções, gastar fôlego e escolher o momento de atacar ou proteger seu estandarte.

**[Jogar gratuitamente](https://gustapaz.github.io/brasao/)**

## À mesa

Você recebe cinco cartas e 3 de fôlego a cada turno. Clique/toque em uma carta ou navegue com Tab e use Enter/Espaço. O custo está no canto. **Encerrar turno** executa a intenção adversária que está visível e renova a mão. **P** pausa; Escape fecha a pausa ou as regras.

| Carta   | Custo | Efeito base                               |
| ------- | ----: | ----------------------------------------- |
| Corte   |     1 | 6 de dano, absorvido primeiro pela guarda |
| Aparo   |     1 | 5 de guarda até o próximo turno           |
| Ruptura |     2 | 11 de dano, ignorando a guarda            |
| Remendo |     1 | Cura 4, até sua vida máxima               |
| Fôlego  |     0 | +1 fôlego e compra uma carta              |

O baralho contém cinco Cortes, quatro Aparos e uma de cada outra carta: **12 cartas ao todo**. Ao acabar a compra, o descarte é reembaralhado. Mão máxima de sete cartas, fôlego máximo de seis. O histórico guarda as sete últimas ações.

Vença A Sentinela, O Ferreiro e A Soberana. Entre os duelos, recupere 8 de vida e escolha um legado que vale pelo restante da campanha: mais dano por ataque, mais vida/cura, ou fôlego adicional nos primeiros dois turnos. Os efeitos acumulam. Coração firme cura 8 **além** da recuperação de 8 da transição.

**Aprendiz:** 40 de vida e 80% do dano adversário, arredondado. **Veterano:** 32 de vida e dano integral. A seed, chamada de Destino no menu, reproduz a distribuição; use Outro destino ou digite um número entre 1 e 999999 para variar. Reiniciar repete a mesma seed e dificuldade. Não há promessa de vencer toda seed com qualquer estratégia.

Sem relógio. Após 20 turnos no mesmo duelo, o dano inimigo cresce; chegar a 40 causa derrota por exaustão. Campanhas concluídas registram vitórias e melhor pontuação por dificuldade no dispositivo. Pontos consideram duelos, vitória final, vida restante e turnos usados; derrotas não atualizam o recorde de campanha. A tentativa em andamento não é salva ao recarregar.

## Stack e execução

**Vue 3 + JavaScript + SVG/CSS + Vite.** Modelo independente em `src/game.js`; componentes Vue cuidam da mesa, cartas e diálogos. Sem Canvas, WebGL, engine de tempo real ou loop JS por frame. Ilustrações vetoriais e sons procedurais originais.

Node.js 24 LTS e npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Abra a URL exibida com `/brasao/`. CI testa, audita, compila e publica somente `dist/` no Pages. GitHub Pages está disponível para repositórios públicos no [GitHub Free](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), sem cadastrar cartão ou ativar faturamento para esta demo.

## Privacidade, acesso e licenças

Jogo inteiramente local, sem conta, backend, API, analytics, anúncios ou compras. Preferências e recordes validados no `localStorage`, com fallback se indisponível; recordes locais não são competição global confiável. Não se promete funcionamento offline.

Áudio começa desligado e depende de gesto. Movimento reduzido acompanha o sistema e tem controle próprio. Cartas/botões com labels de custo e efeito, foco visível, teclado e diálogos com foco contido. No móvel, a mão tem rolagem horizontal e cartas grandes. Teste de viewport não equivale a telefone físico ou auditoria completa com leitor de tela: [validação e limites](docs/validation.md).

[Arte e licenças](docs/assets.md) · [MIT](LICENSE).
