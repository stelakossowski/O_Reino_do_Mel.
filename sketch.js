function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
// --- Variáveis do Jogo ---
let honeyAmount = 0; // Kg
let beeFood = 100; // % da capacidade de comida (reabastece alimentando)
let beeHealth = 100; // % da saúde geral da colmeia
let day = 1;
let gold = 0; // Moeda do jogo

// --- Variáveis da Cidade/Mercado ---
let cityDemand = 50; // Kg de mel para a festa
let festivalReady = false;
let marketPrice = 10; // Preço do mel por Kg

// --- Variáveis de Jogo ---
const MAX_BEES = 50; // Limite de abelhas para evitar sobrecarga
const HONEY_PER_POLLEN = 0.5; // Quanto mel 1 pólen vira (ajustado para ser mais lento)
const FOOD_COST_TO_BUY = 50; // Custo para comprar 10% de comida

// --- Botões ---
let feedButton, harvestButton, sendToCityButton, sellHoneyButton, buyFoodButton;
let startButton; // Novo botão para iniciar o jogo
let showInstructions = true; // Controla se as instruções são exibidas

// --- Condições de Fim de Jogo/Vitória ---
let gameOver = false;
let gameWon = false;
const WIN_CONDITION_GOLD = 1000;
const WIN_CONDITION_DAYS = 60; // Sobreviver por 60 dias

let bees = [];
let flowers = []; // Agora armazena objetos Flower

// --- Função setup(): Executada uma vez ao iniciar ---
function setup() {
  createCanvas(900, 650); // Aumentei o canvas para melhor visualização
  angleMode(RADIANS); // Garante que ângulos são em radianos

  // Criação de abelhas iniciais
  for (let i = 0; i < 10; i++) {
    bees.push(new Bee(random(width), random(height)));
  }

  // Criação de flores como objetos Flower
  for (let i = 0; i < 15; i++) {
    // Mais flores para mais dinamismo
    flowers.push(
      new Flower(random(50, width - 50), random(height / 2 + 50, height - 50))
    );
  }

  // Botões de interação
  feedButton = createButton(
    "Alimentar Abelhas (10% | Custa " + FOOD_COST_TO_BUY + " Ouro)"
  );
  feedButton.position(20, height - 100);
  feedButton.mousePressed(feedBees);

  harvestButton = createButton("Colher Mel (10Kg)");
  harvestButton.position(20, height - 70);
  harvestButton.mousePressed(harvestHoney);

  sellHoneyButton = createButton("Vender Mel no Mercado (Todo Mel)");
  sellHoneyButton.position(20, height - 40);
  sellHoneyButton.mousePressed(sellHoney);

  sendToCityButton = createButton("Enviar Mel p/ Festa (" + cityDemand + "Kg)");
  sendToCityButton.position(250, height - 100);
  sendToCityButton.mousePressed(sendHoneyToCity);

  // Botão para iniciar o jogo (visível apenas na tela de instruções)
  startButton = createButton("Começar Jogo");
  startButton.mousePressed(startGame);

  updateButtonStates(); // Atualiza o estado inicial dos botões
  // Inicialmente, esconde os botões do jogo até que as instruções sejam fechadas
  toggleGameButtons(false);
}

// --- Função draw(): Executada repetidamente (loop principal do jogo) ---
function draw() {
  // Sempre desenha o ambiente (fazenda, abelhas, flores), independentemente das instruções
  displayFarm();

  // Atualizar e desenhar abelhas
  for (let i = bees.length - 1; i >= 0; i--) {
    let bee = bees[i];
    // As abelhas só atualizam sua lógica de movimento e coleta se o jogo não estiver em instruções
    if (!showInstructions) {
      bee.update();
    }
    bee.display(); // As abelhas são desenhadas sempre
    if (bee.isDead() && !showInstructions) {
      // Remove abelhas mortas apenas no jogo ativo
      bees.splice(i, 1);
    }
  }

  // Atualizar e desenhar flores
  for (let flower of flowers) {
    if (!showInstructions) {
      // Flores só animam e crescem quando o jogo está ativo
      flower.update();
    }
    flower.display(); // Flores são desenhadas sempre
  }

  if (showInstructions) {
    displayInstructions(); // Desenha a tela de instruções por cima de tudo
    return; // Para o loop de jogo aqui, sem processar a UI ou lógica do jogo
  }

  if (gameOver || gameWon) {
    displayEndScreen();
    return; // Para o jogo se acabou ou ganhou
  }

  // Se não estiver em instruções ou tela final, processa o restante do jogo:
  // Informações do jogador (UI - User Interface)
  displayUI();

  // Ciclo de produção (a cada segundo)
  if (frameCount % 60 === 0) {
    // 60 frames = 1 segundo (se a taxa de frames for 60fps)
    day++;
    updateResources();
    updateButtonStates(); // Atualiza o texto dos botões se algo mudar
  }

  // Verifica condições de vitória/derrota
  checkGameEndConditions();
}

// --- Nova Função: Iniciar Jogo ---
function startGame() {
  showInstructions = false;
  toggleGameButtons(true); // Mostra os botões do jogo
  startButton.hide(); // Esconde o botão de iniciar
}

// --- Nova Função: Alternar visibilidade dos botões do jogo ---
function toggleGameButtons(visible) {
  if (visible) {
    feedButton.show();
    harvestButton.show();
    sellHoneyButton.show();
    sendToCityButton.show();
  } else {
    feedButton.hide();
    harvestButton.hide();
    sellHoneyButton.hide();
    sendToCityButton.hide();
  }
}

// --- Nova Função: Display de Instruções ---
function displayInstructions() {
  // Adiciona uma camada escura semi-transparente para o fundo das instruções
  fill(0, 0, 0, 180); // Cor preta com 180 de alfa (semi-transparente)
  rect(0, 0, width, height); // Cobre toda a tela

  textAlign(CENTER, CENTER);
  fill(255); // Cor do texto branca

  // Título do Jogo
  textSize(44);
  textStyle(BOLD);
  text("Festejando a Conexão Campo-Cidade", width / 2, height / 2 - 250);
  textStyle(NORMAL);

  textSize(30);
  text("Bem-vindo(a) ao seu apiário!", width / 2, height / 2 - 180);

  textAlign(LEFT, TOP);
  textSize(18);
  let instructionsText = `
    Seu objetivo é gerenciar sua colmeia e produzir mel para a cidade.

    1.  **Abelhas e Flores:** Abelhas voam automaticamente para coletar pólen das flores e transformá-lo em mel na colmeia.
    2.  **Saúde e Comida das Abelhas:** Monitore a saúde e a comida das suas abelhas. Abelhas com pouca comida ficam lentas e a saúde da colmeia pode cair, levando à morte de abelhas.
        * Use o botão "**Alimentar Abelhas**" para reabastecer a comida, custa ouro!
    3.  **Mel e Ouro:**
        * **Mel Produzido:** Mostra a quantidade de mel disponível.
        * **Vender Mel:** Venda todo o seu mel no mercado para ganhar ouro. O preço do mel flutua!
        * **Enviar para Festa:** A cidade ocasionalmente pede mel para uma festa. Atenda essa demanda para ganhar um bônus de ouro maior e estreitar sua relação campo-cidade!
    4.  **Condições de Vitória:**
        * Acumule **$${WIN_CONDITION_GOLD} de Ouro**.
        * Sobreviva por **${WIN_CONDITION_DAYS} Dias**.
    5.  **Fim de Jogo:** Suas abelhas morrem de fome ou a saúde da colmeia chega a zero.

    Boa sorte, apicultor(a)!
  `;
  text(instructionsText, width / 2 - 350, height / 2 - 120, 700, 400);

  // Posiciona o botão "Começar Jogo"
  startButton.position(width / 2 - startButton.width / 2, height / 2 + 250);
  startButton.show();
}

// --- Funções de Display ---

function displayFarm() {
  // Céu
  background(135, 206, 235);
  // Grama
  fill(124, 252, 0);
  rect(0, height / 2, width, height / 2);

  // Exibe a colmeia
  drawHive(width / 2, height / 2 - 50);
}

function drawHive(x, y) {
  fill(180, 100, 0); // Cor da madeira
  noStroke();
  // Base
  rect(x - 60, y + 40, 120, 30);
  // Corpo da colmeia
  beginShape();
  vertex(x - 50, y + 40);
  vertex(x - 70, y - 20);
  vertex(x, y - 70);
  vertex(x + 70, y - 20);
  vertex(x + 50, y + 40);
  endShape(CLOSE);

  // Entrada
  fill(0, 0, 0);
  ellipse(x, y + 25, 30, 15);
  // Linhas para detalhe
  stroke(100, 50, 0);
  strokeWeight(2);
  line(x - 50, y + 10, x + 50, y + 10);
  line(x - 40, y - 5, x + 40, y - 5);
  line(x - 30, y - 20, x + 30, y - 20);
  noStroke();
}

function displayUI() {
  fill(0);
  textSize(18);
  textAlign(LEFT, TOP);
  text("Ouro: $" + gold.toFixed(2), 20, 20);
  text("Dia: " + day, 20, 45);
  text("Abelhas: " + bees.length + " / " + MAX_BEES, 20, 70);

  // Indicadores de barra
  drawStatusBar(
    "Saúde das Abelhas",
    beeHealth,
    20,
    100,
    color(255, 0, 0),
    color(0, 200, 0)
  );
  drawStatusBar(
    "Comida das Abelhas",
    beeFood,
    20,
    125,
    color(200, 100, 0),
    color(0, 0, 200)
  );

  text("Mel Produzido: " + honeyAmount.toFixed(1) + " Kg", 20, 160);
  text("Demanda da Cidade: " + cityDemand + " Kg", 20, 185);
  text(
    "Preço de Mercado do Mel: $" + marketPrice.toFixed(2) + " / Kg",
    20,
    210
  );

  // Evento de Festa
  if (festivalReady) {
    textSize(24);
    fill(0, 200, 0);
    text(
      "A cidade está pronta para a Festa!",
      width / 2 - 150,
      height / 2 - 100
    );
  }
}

function drawStatusBar(label, value, x, y, lowColor, highColor) {
  let barWidth = 150;
  let barHeight = 15;
  let fillColor = lerpColor(lowColor, highColor, value / 100);

  fill(200); // Fundo da barra
  rect(x + textWidth(label) + 10, y, barWidth, barHeight);

  fill(fillColor);
  rect(
    x + textWidth(label) + 10,
    y,
    map(value, 0, 100, 0, barWidth),
    barHeight
  );

  fill(0); // Texto da barra
  textSize(16);
  text(label + ": " + value.toFixed(1) + "%", x, y + barHeight / 4);
}

function displayEndScreen() {
  background(50);
  textAlign(CENTER, CENTER);
  textSize(48);
  if (gameWon) {
    fill(0, 255, 0);
    text("VITÓRIA!", width / 2, height / 2 - 50);
    textSize(24);
    fill(255);
    text(
      "Você alcançou $" +
        WIN_CONDITION_GOLD +
        " de Ouro ou Sobreviveu por " +
        WIN_CONDITION_DAYS +
        " Dias!",
      width / 2,
      height / 2 + 10
    );
  } else {
    fill(255, 0, 0);
    text("FIM DE JOGO!", width / 2, height / 2 - 50);
    textSize(24);
    fill(255);
    text("Suas abelhas não sobreviveram.", width / 2, height / 2 + 10);
  }
  textSize(18);
  text("Pressione F5 para Reiniciar", width / 2, height / 2 + 60);
}

// --- Funções de Interação do Jogador ---

function feedBees() {
  if (gold >= FOOD_COST_TO_BUY) {
    if (beeFood < 100) {
      beeFood = min(100, beeFood + 10);
      gold -= FOOD_COST_TO_BUY;
      console.log("Abelhas alimentadas! Ouro: " + gold.toFixed(2));
    } else {
      console.log("Comida das abelhas já está no máximo!");
    }
  } else {
    console.log("Ouro insuficiente para alimentar as abelhas!");
  }
  updateButtonStates();
}

function harvestHoney() {
  console.log("Use o botão 'Vender Mel no Mercado' para vender todo o mel.");
  updateButtonStates();
}

function sellHoney() {
  if (honeyAmount > 0) {
    gold += honeyAmount * marketPrice;
    console.log(
      "Mel vendido! +" +
        (honeyAmount * marketPrice).toFixed(2) +
        " Ouro. Total: " +
        gold.toFixed(2)
    );
    honeyAmount = 0;
  } else {
    console.log("Não há mel para vender!");
  }
  updateButtonStates();
}

function sendHoneyToCity() {
  if (honeyAmount >= cityDemand) {
    honeyAmount -= cityDemand;
    gold += cityDemand * (marketPrice * 1.2); // Bônus por festa
    cityDemand = floor(random(40, 60)); // Nova demanda da cidade
    festivalReady = false; // Resetando a festa
    console.log("Mel enviado para a festa! Ouro: " + gold.toFixed(2));
  } else {
    console.log("Não há mel suficiente para a festa!");
  }
  updateButtonStates();
}

function updateButtonStates() {
  // Oculta os botões quando as instruções estão ativas
  if (showInstructions) {
    toggleGameButtons(false);
    startButton.show();
    return;
  } else {
    toggleGameButtons(true);
    startButton.hide();
  }

  // Atualiza o texto do botão de festa
  sendToCityButton.html("Enviar Mel p/ Festa (" + cityDemand + "Kg)");
  if (honeyAmount >= cityDemand) {
    sendToCityButton.removeAttribute("disabled");
    festivalReady = true;
  } else {
    sendToCityButton.attribute("disabled", "");
    festivalReady = false;
  }

  // Desabilita botões se não houver mel ou ouro suficiente
  if (honeyAmount === 0) {
    sellHoneyButton.attribute("disabled", "");
  } else {
    sellHoneyButton.removeAttribute("disabled");
  }

  if (gold < FOOD_COST_TO_BUY) {
    feedButton.attribute("disabled", "");
  } else {
    feedButton.removeAttribute("disabled");
  }
}

// --- Lógica do Jogo ---

function updateResources() {
  // Diminuição da saúde das abelhas ao longo do tempo, piora com pouca comida
  let healthDecreaseRate = 0.5;
  if (beeFood < 20) {
    // Se a comida está muito baixa
    healthDecreaseRate = 2; // Saúde cai mais rápido
    bees.forEach((bee) => (bee.speedMultiplier = 0.5)); // Abelhas ficam mais lentas
  } else if (beeFood < 50) {
    healthDecreaseRate = 1;
    bees.forEach((bee) => (bee.speedMultiplier = 0.75));
  } else {
    bees.forEach((bee) => (bee.speedMultiplier = 1)); // Velocidade normal
  }
  beeHealth -= healthDecreaseRate;
  beeHealth = max(0, beeHealth);

  // Diminuição da comida das abelhas (elas consomem)
  beeFood -= 0.5 * (bees.length / 10); // Mais abelhas, mais comida consumida
  beeFood = max(0, beeFood);

  // População de Abelhas
  if (beeHealth > 80 && beeFood > 70 && bees.length < MAX_BEES) {
    if (random(1) < 0.1) {
      // 10% de chance de nova abelha por dia
      bees.push(new Bee(width / 2, height / 2 - 50)); // Nasce na colmeia
      console.log("Nova abelha nasceu! Total: " + bees.length);
    }
  } else if (beeHealth < 30 || beeFood < 10) {
    if (random(1) < 0.05 && bees.length > 1) {
      // 5% de chance de abelha morrer por dia
      let deadBeeIndex = floor(random(bees.length));
      bees[deadBeeIndex].markAsDead(); // Marca a abelha para ser removida no próximo loop
      console.log("Uma abelha morreu! Total: " + bees.length);
    }
  }

  // Flutuação do Preço de Mercado
  marketPrice += random(-1, 1); // Varia +/- 1
  marketPrice = constrain(marketPrice, 5, 15); // Preço entre 5 e 15
}

function checkGameEndConditions() {
  if (beeHealth <= 0 || bees.length <= 0) {
    gameOver = true;
  }
  if (gold >= WIN_CONDITION_GOLD || day >= WIN_CONDITION_DAYS) {
    gameWon = true;
  }
}

// --- Classe Bee (Abelha) ---

class Bee {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = random(TWO_PI);
    this.baseSpeed = random(1.5, 2.5);
    this.speedMultiplier = 1; // Afetado por beeFood/Health
    this.pollen = 0; // Capacidade de pólen da abelha
    this.maxPollen = 10;
    this.state = "searching"; // 'searching', 'collecting', 'returning'
    this.target = null; // Flor ou colmeia
    this.collectingTime = 0; // Tempo na flor
    this.collectingDuration = 60; // Frames para coletar pólen
    this.isDeadFlag = false; // Flag para remover abelha
    this.blinkState = 0; // Para animação de piscar da abelha
  }

  update() {
    // Atualiza a velocidade baseada na saúde e comida
    let currentSpeed = this.baseSpeed * this.speedMultiplier;

    if (this.state === "searching") {
      // Encontrar a flor mais próxima
      this.target = this.findClosestFlower();
      if (this.target) {
        this.angle = atan2(this.target.y - this.y, this.target.x - this.x);
        let d = dist(this.x, this.y, this.target.x, this.target.y);
        if (d < 15) {
          // Se chegou perto da flor
          this.state = "collecting";
          this.collectingTime = 0;
        }
      } else {
        // Sem flores, voa aleatoriamente
        this.angle += random(-0.1, 0.1);
      }
    } else if (this.state === "collecting") {
      this.collectingTime++;
      this.blinkState = (this.blinkState + 1) % 10; // Piscar mais rápido
      if (this.collectingTime > this.collectingDuration) {
        this.pollen = min(this.maxPollen, this.pollen + 1); // Coleta 1 unidade de pólen
        if (this.pollen >= this.maxPollen) {
          this.state = "returning";
          this.target = createVector(width / 2, height / 2 - 50); // Colmeia
        } else {
          this.state = "searching"; // Procura outra flor se não estiver cheia
        }
        this.collectingTime = 0;
        this.blinkState = 0; // Reset piscar
      }
    } else if (this.state === "returning") {
      this.target = createVector(width / 2, height / 2 - 50); // Colmeia
      this.angle = atan2(this.target.y - this.y, this.target.x - this.x);
      let d = dist(this.x, this.y, this.target.x, this.target.y);
      if (d < 20) {
        // Se chegou perto da colmeia
        if (this.pollen > 0) {
          honeyAmount += this.pollen * HONEY_PER_POLLEN; // Deposita mel
          this.pollen = 0; // Esvazia pólen
        }
        this.state = "searching"; // Volta a procurar flores
        this.blinkState = 0; // Reset piscar
      }
    }

    // Move a abelha
    this.x += cos(this.angle) * currentSpeed;
    this.y += sin(this.angle) * currentSpeed;

    // Mantém a abelha dentro dos limites da tela
    this.x = constrain(this.x, 0, width);
    this.y = constrain(this.y, 0, height);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle + PI / 2); // Orienta a abelha na direção do movimento

    // Corpo da abelha
    if (this.blinkState < 5) {
      // Efeito de piscar
      fill(255, 200, 0); // Amarelo
    } else {
      fill(200, 150, 0); // Amarelo mais escuro
    }
    ellipse(0, 0, 10, 15); // Corpo oval

    fill(0); // Listras pretas
    ellipse(0, -3, 8, 4);
    ellipse(0, 3, 8, 4);

    // Asas
    fill(200, 200, 255, 150); // Azul claro, semi-transparente
    ellipse(-6, -5, 8, 12);
    ellipse(6, -5, 8, 12);

    // Olhos
    fill(0);
    ellipse(-2, -7, 3, 3);
    ellipse(2, -7, 3, 3);

    pop();
  }

  findClosestFlower() {
    let closestFlower = null;
    let minDist = Infinity;
    for (let flower of flowers) {
      let d = dist(this.x, this.y, flower.x, flower.y);
      if (d < minDist) {
        minDist = d;
        closestFlower = flower;
      }
    }
    return closestFlower
      ? createVector(closestFlower.x, closestFlower.y)
      : null;
  }

  markAsDead() {
    this.isDeadFlag = true;
  }

  isDead() {
    return this.isDeadFlag;
  }
}

// --- Nova Classe Flower (Flor) para mais dinamismo ---

class Flower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.petalColor = color(255, random(100, 200), random(100, 255), 200); // Cor variada, leve transparência
    this.centerColor = color(255, 200, 0);
    this.stemColor = color(34, 139, 34);
    this.petalSize = 15;
    this.centerSize = 10;
    this.animationOffset = random(TWO_PI); // Para animação suave e independente
    this.growthFactor = 0; // Começa pequena, cresce com o tempo
    this.maxGrowth = 1; // Tamanho total
    this.growthSpeed = 0.01; // Quão rápido ela cresce
  }

  update() {
    // Anima o tamanho da pétala ligeiramente
    this.petalSize = 15 + sin(frameCount * 0.05 + this.animationOffset) * 2; // Efeito de pulsação
    this.centerSize = 10 + cos(frameCount * 0.05 + this.animationOffset) * 1; // Leve pulsação central

    // Faz a flor crescer com o tempo
    if (this.growthFactor < this.maxGrowth) {
      this.growthFactor += this.growthSpeed;
      this.growthFactor = constrain(this.growthFactor, 0, this.maxGrowth);
    }
  }

  display() {
    push();
    translate(this.x, this.y);

    // Escala a flor inteira conforme ela cresce
    scale(this.growthFactor);

    // Caule
    stroke(this.stemColor);
    strokeWeight(3);
    line(0, 0, 0, 20);
    noStroke();

    // Pétalas
    fill(this.petalColor);
    let currentPetalSize = this.petalSize;

    ellipse(0, -10, currentPetalSize, currentPetalSize);
    ellipse(-10, 0, currentPetalSize, currentPetalSize);
    ellipse(10, 0, currentPetalSize, currentPetalSize);
    ellipse(0, 10, currentPetalSize, currentPetalSize);
    ellipse(-7, -7, currentPetalSize, currentPetalSize);
    ellipse(7, -7, currentPetalSize, currentPetalSize);
    ellipse(-7, 7, currentPetalSize, currentPetalSize);
    ellipse(7, 7, currentPetalSize, currentPetalSize);

    // Centro da flor
    fill(this.centerColor);
    ellipse(0, 0, this.centerSize, this.centerSize);

    pop();
  }
}
