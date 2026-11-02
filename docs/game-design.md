# Brasão — três duelos, uma só mão

Combate tático de cartas por turnos, Vue 3 + JavaScript + SVG/CSS. Sem engine de tempo real, backend, contas, monetização ou cartas compradas. Diferente de rebotes, conexões hexagonais e torres de timing: o verbo central é gastar fôlego escolhendo ataque/defesa conforme a intenção adversária.

## Loop e regras

Campanha de três guardiões originais. Cada turno dá 3 de fôlego e cinco cartas de um baralho de 12. Cartas jogadas e mão restante vão ao descarte; quando a compra acaba, o descarte é reembaralhado com RNG determinístico. Ataques consomem primeiro a guarda, salvo perfurantes. Guarda do jogador vale até o ataque inimigo e zera ao começar seu próximo turno. A intenção adversária é pública e executada ao Encerrar turno. Sem timer e sem penalizar tempo fora da aba. Vida zero: derrota. Vida adversária zero: recompensa ou vitória final.

Cartas: Corte (1, 6 dano), Aparo (1, 5 guarda), Ruptura (2, 11 dano ignorando guarda), Remendo (1, cura 4), Fôlego (0, +1 energia e compra 1). Energia máxima 6, mão máxima 7. Cinco Cortes, quatro Aparos e uma de cada outra carta. Vida inicial 40 no Aprendiz e 32 no Veterano; Aprendiz recebe 80% do dano adversário, arredondado. Cura entre lutas de 8. Recompensa entre duelos: Fio (+2 dano por ataque), Vigor (+8 vida máxima e cura 8) ou Ímpeto (+1 fôlego nos primeiros dois turnos de cada duelo); efeitos acumulam. As recompensas não custam dinheiro e não sorteiam prêmios.

Três adversários com sequências de intenção fixas e distintas, vida crescente e guarda. Depois do turno 20 de cada duelo, dano cresce gradualmente para evitar combate sem término; turno 40 encerra como derrota por exaustão, com aviso no manual. RNG controla somente a ordem das cartas. Seed 8642 inicial para campanha reproduzível; nova distribuição pode ser escolhida no menu. Reiniciar a mesma expedição mantém a seed/dificuldade, mas limpa toda a tentativa. Sem promessa de vencer com qualquer estratégia ou seed.

## Escopo e visual

Introdução, regras, seleção Aprendiz/Veterano, campanha completa com recompensas, pausa, histórico curto de ações, vitória/derrota, replay mesma seed e nova seed. Recorde de campanha e vitórias locais separados por dificuldade; tentativa não persiste ao reload.

Mesa de feltro vinho, bordas de latão, adversário como brasão/armadura em SVG original, cartas marfim com símbolos próprios e mão em leque na parte inferior. Distribuição, levantamento, descarte e impacto comunicam ações, sem efeitos de flash. No móvel, cartas em faixa horizontal com snap, controles acessíveis e rolagem normal. Sem sidebar de dashboard, arena retangular de rebotes, floresta ou torre 3D.

## Acesso e aceitação

Cartas são botões HTML, com nome/custo/efeito em labels, Enter/Espaço para jogar, Tab normal, ajuda e pausa com foco contido. Vida/fôlego/guarda e intenção explícitos; anúncios só de ações. Som procedural opcional, inicia desligado; movimento reduzido acompanha o sistema e tem controle próprio. Testar shuffle, conservação das 12 cartas, dano/bloqueio/perfuração, recursos, limites, impossibilidade de jogar duas vezes a mesma instância, turnos, exaustão, recompensas, toda a campanha, reset/save inválido e lifecycle. Jogar pelo navegador até vitória e derrota, também na demo pública, sem injetar estado. Registrar limites de toque físico/leitor de tela. Escanear staged, histórico e build; publicar repo/Pages gratuitos com noreply e somente gustapaz como contribuidor, sem cartão/faturamento.
