# Validação de Brasão

## Regras

18 testes Node Test Runner: seed e shuffle reproduzíveis; doze instâncias únicas; ações inválidas/custo; dano contra guarda e perfuração; guarda/intenções; cura limitada; energia e compra; reshuffle e conservação das cartas; vitória de duelo e recompensa única; Vigor e Ímpeto; campanha completa em ambas as dificuldades usando ações normais; derrota; exaustão/escala de dano; pausa/reset; save/recordes; lifecycle e cleanup.

Modelo por turnos sem relógio ou loop de simulação. Mão limitada a sete, fôlego a seis, log a sete entradas; campanha de três duelos e limite explícito de 40 turnos por duelo. As intenções são padrões programados e públicos, não um serviço de IA. A ordem de cartas é determinística por seed; não se alega vitória garantida em todas as distribuições.

## Navegador

Build de produção, Chromium integrado, seed 8642. Aprendiz concluído em **9 turnos, 28 cartas, 2.065 pontos**: [evidência local](local-victory.png). Veterano concluído no viewport móvel em **10 turnos, 32 cartas, 1.940 pontos**: [evidência Veterano](veteran-victory.png). As duas campanhas usaram Fio de aço entre os duelos. Os cliques/Enter utilizaram cartas, fôlego e intenções lidos no DOM público; nenhum estado foi injetado. A automação de estratégia não é apresentada como avaliação humana de diversão ou dificuldade.

Derrota passando sem defesa em nove turnos; repetir o destino restaurou a mão e os recursos. Enter jogou Fôlego, aumentando o recurso e comprando uma carta. Pausa, retomada por Escape, regras durante a campanha, histórico expansível, seed editável e nova seed, áudio e movimento reduzido foram exercitados. Preferências e recordes sobreviveram ao reload.

390 × 844: documento sem overflow horizontal (390 px), cartas de 150 × 215 px e carrossel de mão com rolagem própria (830 px de conteúdo). Botão de encerrar turno com 44 px de altura. Na revisão visual foi corrigida colisão de classes CSS na carta Fôlego; classes de tipo foram isoladas. Animações de entrada restauram a interatividade de instâncias reintroduzidas pelo reshuffle.

Toque físico, Safari/gamepad e auditoria completa de leitor de tela não foram realizados. A navegação de botões e diálogos foi testada com teclado; lifecycle também é exercitado por EventTarget. Não se exige WebGL nem há penalidade por tempo fora da página.

Na [demo pública](https://gustapaz.github.io/brasao/), a campanha Aprendiz/8642 foi concluída pelos controles normais em **9 turnos, 28 cartas e 2.065 pontos**, com duas escolhas de Fio de aço: [vitória publicada](public-victory.png). [Mesa da Soberana publicada](public-gameplay.png). Reinício restaurou o primeiro duelo, mão e fôlego; pausa e Escape retomaram corretamente. Foi exercitado também o breakpoint de desktop 1440 × 900. A captura local inicial foi substituída por uma captura legível do viewport; o problema era a captura, não o estado da partida.

## Build, segurança e custos

JS ~95 kB / 37 kB gzip e CSS ~18 kB / 5 kB gzip. Sem fotos/fontes externas, canvas ou renderização JS contínua; animações CSS acionadas por ações, timer curto de interação limpo no descarte, áudio encerrado/desconectado após efeitos. Não há alegação de FPS universal.

`npm audit`: zero vulnerabilidades reportadas incluindo ferramentas de desenvolvimento em 01/11/2026. Somente build estático e licenças publicados. Não há chaves, serviços externos ou credenciais de demonstração. Workflow usa checkout sem credenciais persistidas, leitura no build e somente Pages/OIDC no deploy. Repositório público e Pages gratuito, sem cartão ou faturamento ativado.

Gitleaks 8.30.1 com configuração padrão confiável externa, redação integral e exclusões locais desconsideradas: staged, histórico e build examinados sem achados de segredos. Secret scanning, proteção de push e alertas/atualizações de dependências gratuitos habilitados. Autor e committer do commit inicial confirmados com nome Gustavo Paz e noreply; a API de contribuidores retornou apenas gustapaz. O pipeline do commit inicial `8f7839a` concluiu com sucesso. Bots de dependências não são mesclados automaticamente nem têm autoria reatribuída.
