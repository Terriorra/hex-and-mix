// Регистрируем звук стука и указываем к нему правильный путь
const soundKnock = new Audio("../assets/audio/hit.wav");
const soundSplash = new Audio("../assets/audio/splash.wav");
const soundFire = new Audio("../assets/audio/fire.flac");
const soundFreeze = new Audio("../assets/audio/freeze.wav");
const soundWin = new Audio("../assets/audio/win.wav");
const soundPop = new Audio("../assets/audio/pop.wav");

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Выбор случайных значений без повторений
function getRandomSample(arr, n) {
  // Защита от дурака: если просят больше элементов, чем есть в списке
  if (n > arr.length) {
    throw new RangeError("Размер выборки (n) превышает размер списка");
  }

  // Создаем копию, чтобы не испортить оригинальный массив
  const pool = [...arr];
  const result = [];

  for (let i = 0; i < n; i++) {
    // Берем случайный индекс из оставшихся элементов
    const randomIndex = Math.floor(Math.random() * pool.length);
    // Вырезаем элемент из пула и добавляем в результат
    result.push(pool.splice(randomIndex, 1)[0]);
  }

  return result;
}

//Массив от 0 до 100
const range = Array.from({ length: 101 }, (_, i) => i);

// Словари стадий (каждое слово — это шаг в 10 единиц на шкале от 0 до 100)
const STAT_LANGUAGES = {
  taste: [
    "рвотный",
    "мыльный",
    "лакричный",
    "безвкусный",
    "травянистый",
    "кислый",
    "пряный",
    "острый",
    "сладкий",
    "приторный",
  ],
  utility: [
    "смертоносное",
    "ядовитое",
    "отвратительное",
    "хлопотное",
    "ноцебо",
    "плацебо",
    "приятное",
    "лекарственное",
    "целебное",
    "панацея",
  ],
  stability: [
    "инертное",
    "послушное",
    "требовательное",
    "привередливое",
    "капризное",
    "скандальное",
    "исчезающее",
    "нестабильное",
    "тревожное",
    "взрывное",
  ],
  durability: [
    "призрачная",
    "мимолетная",
    "хрупкая",
    "увядающая",
    "ограниченная",
    "стойкая",
    "долговременная",
    "консервированная",
    "реликварная",
    "вечная",
  ],
  speed: [
    "вспышечная",
    "моментальная",
    "быстрая",
    "плавная",
    "размеренная",
    "пролонгированная",
    "затяжная",
    "накопительная",
    "отложенная",
    "перманентная",
  ],
};

// Функция-помощник: переводит число от 0 до 100 в текст стадии
function getStatText(statName, value) {
  // Делим число на 10 и округляем вниз, чтобы получить индекс от 0 до 9
  let index = Math.floor(value / 10);
  if (index > 9) index = 9; // Защита от значения ровно 100
  return STAT_LANGUAGES[statName][index];
}

// Генерирую случайного кол-во зелий
const COUNT_POTION = getRandomInt(5, 10);

// Генерирую случайные характеристики
const startingStats = {
  taste: getRandomSample(range, COUNT_POTION + 1),
  utility: getRandomSample(range, COUNT_POTION + 1),
  stability: getRandomSample(range, COUNT_POTION + 1),
  durability: getRandomSample(range, COUNT_POTION + 1),
  speed: getRandomSample(range, COUNT_POTION + 1),
};

function checkVictoryCondition() {
  // Если в котле не ровно 1 готовое зелье — победу засчитать нельзя
  if (cauldronStorage.potions.length !== 1) return;

  const currentPotion = cauldronStorage.potions[0];

  // Проверяем, выполняются ли ВСЕ сгенерированные условия рецепта
  // Метод every вернет true только если КАЖДОЕ условие совпало с текстом в котле
  const isWin = activeGoal.conditions.every((condition) => {
    let cauldronWord = getStatText(
      condition.name,
      currentPotion[condition.name],
    );
    return cauldronWord === condition.word;
  });

  if (isWin) {
    // Ура! Меняем текст свитка на праздничный победный
    document.getElementById("recipe-text").innerHTML = `
            <span style="color: #ff9e00; font-size: 18px; font-weight: bold;">✨ ЗАКАЗ ВЫПОЛНЕН! ✨</span><br>
            <span style="color: #00f5d4;">Вы великолепная ведьма! Нажмите ▶️ Старт для нового квеста.</span>
        `;
    // ВСПЫШКА ЗВУКА: Сбрасываем дорожку в ноль и играем!
    soundWin.currentTime = 0.1;
    soundWin.play();
    console.log("Победа! Зелье идеально соответствует заказу.");
  }
}

// Кнопка ▶️ Старт: полностью очищает котел и выдает новый рецепт по выбранной сложности
document.getElementById("btn-start-game").addEventListener("click", () => {
  cauldronStorage.potions = [];
  cauldronStorage.isMixed = false;
  updateCauldronVisual();
  document.getElementById("inspector-content").innerHTML =
    `<p>Котёл абсолютно пуст...</p>`;
  generateRandomRecipe();
});

// Кнопка 🔄 Смена рецепта: просто перекатывает рецепт на этой же сложности, не трогая котел
document.getElementById("btn-reroll-recipe").addEventListener("click", () => {
  generateRandomRecipe();
});

// Объект, который хранит текущую цель игры
let activeGoal = {
  conditions: [], // Сюда мы будем записывать параметры, которые нужно собрать
};

function generateRandomRecipe() {
  // 1. Считываем количество условий из выпадающего списка
  const difficulty = parseInt(
    document.getElementById("difficulty-select").value,
  );

  const statKeys = ["taste", "utility", "stability", "durability", "speed"];
  const ruNames = {
    taste: "Вкус",
    utility: "Польза",
    stability: "Стабильность",
    durability: "Долговечность",
    speed: "Скорость",
  };

  // Перемешиваем массив параметров случайным образом, чтобы выбрать уникальные
  statKeys.sort(() => Math.random() - 0.5);

  // Очищаем старые условия
  activeGoal.conditions = [];

  let recipeLines = [];

  // 2. Генерируем ровно столько условий, сколько требует сложность
  for (let i = 0; i < difficulty; i++) {
    const statName = statKeys[i];

    // Берем случайное значение из сгенерированных на старте массивов (как в твоем коде)
    const targetValue = startingStats[statName][COUNT_POTION];
    const targetWord = getStatText(statName, targetValue);

    // Запоминаем это условие для будущей проверки победы
    activeGoal.conditions.push({
      name: statName,
      word: targetWord,
    });

    recipeLines.push(`${ruNames[statName]}: ${targetWord}`);
  }

  // 3. Выводим красивый многострочный свиток в HTML
  document.getElementById("recipe-text").innerHTML = recipeLines.join("<br>");
}

function updateCauldronVisual() {
  const cauldronVisual = document.getElementById("cauldron");
  const totalCount = cauldronStorage.potions.length;

  // Если котел пустой — возвращаем дефолтный ведьминский цвет
  if (totalCount === 0) {
    cauldronVisual.style.background = "#322347";
    return;
  }

  // Если зелье УЖЕ смешали инструментом — красим в один сплошной итоговый цвет
  if (cauldronStorage.isMixed) {
    cauldronVisual.style.background = cauldronStorage.color;
    return;
  }

  // Режим «Полосочек»: считаем ширину одной полосы в процентах
  let gradientSteps = [];
  let stepPercent = 100 / totalCount;

  cauldronStorage.potions.forEach((potion, index) => {
    let start = index * stepPercent;
    let end = (index + 1) * stepPercent;
    // Добавляем резкую полоску цвета от start% до end%
    gradientSteps.push(`${potion.color} ${start}%, ${potion.color} ${end}%`);
  });

  // Применяем полосатый градиент слева направо (to right)
  cauldronVisual.style.background = `linear-gradient(to top, ${gradientSteps.join(", ")})`;
}

// Функция, которая принудительно обновляет текст инспектора для котла
function updateCauldronInspector() {
  // Обновляем текст ТОЛЬКО если в котле осталась ровно 1 готовая порция
  if (cauldronStorage.potions.length === 1) {
    const currentPotion = cauldronStorage.potions[0];

    document.getElementById("inspector-content").innerHTML = `
            <h3>Готовое варево:</h3>
            <p>Вкус: <span class="stat-value">${getStatText("taste", currentPotion.taste)}</span></p>
            <p>Польза: <span class="stat-value">${getStatText("utility", currentPotion.utility)}</span></p>
            <p>Стабильность: <span class="stat-value">${getStatText("stability", currentPotion.stability)}</span></p>
            <p>Долговечность: <span class="stat-value">${getStatText("durability", currentPotion.durability)}</span></p>
            <p>Скорость: <span class="stat-value">${getStatText("speed", currentPotion.speed)}</span></p>
        `;

    checkVictoryCondition();
  }
}

let inspectorTimeout = null;

class PotionBottle {
  constructor(taste, utility, stability, durability, speed) {
    // 1. Генерируем случайные характеристики для этой конкретной колбы
    this.width = Math.floor(Math.random() * (80 - 40 + 1)) + 40; // Случайная ширина от 40px до 80px
    this.height = Math.floor(Math.random() * (120 - 70 + 1)) + 70; // Случайная высота от 70px до 120px

    // Генерируем случайный цвет в формате HSL (так проще получать яркие цвета)
    // Магия HSL: случайный тон от 0 до 360, насыщенность 80%, яркость 50%
    this.liquidColor = `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`;

    // Случайный уровень жидкости в процентах (от 20% до 90%)
    this.liquidLevel = Math.floor(Math.random() * (90 - 20 + 1)) + 20;

    // Случайные характеристики для зелья
    this.stats = {
      taste: taste, // Вкус
      utility: utility, // Польза
      stability: stability, // Стабильность
      durability: durability, // Долговечность
      speed: speed, // Скорость действия
    };

    // Сразу создаем HTML-элемент для этой колбы
    this.element = this.createHTML();
  }

  // Метод, который собирает колбу из HTML-кусочков
  createHTML() {
    // Создаем главный контейнер колбы (стекло)
    const bottle = document.createElement("div");
    bottle.className = "bottle-container";
    bottle.style.width = this.width + "px";
    bottle.style.height = this.height + "px";

    // Генерируем случайный правый отступ для колбочки (от 5px до 35px)
    const randomMargin = Math.floor(Math.random() * (35 - 5 + 1)) + 5;
    bottle.style.marginRight = randomMargin + "px";

    // Создаем блок для жидкости
    const liquid = document.createElement("div");
    liquid.className = "bottle-liquid";
    liquid.style.backgroundColor = this.liquidColor;
    liquid.style.height = this.liquidLevel + "%"; // Задаем высоту жидкости в процентах

    // Кладим жидкость внутрь колбы
    bottle.appendChild(liquid);

    // НАВЕДЕНИЕ МЫШКИ (Наша лупа)
    // Теперь инспектор будет выводить только реальные физические свойства колбы!
    bottle.addEventListener("mouseenter", () => {
      clearTimeout(inspectorTimeout); // Мгновенно отменяем запланированное стирание текста!

      document.getElementById("inspector-content").innerHTML = `
                    <p>Вкус: <span class="stat-value">${getStatText("taste", this.stats.taste)}</span></p>
                    <p>Польза: <span class="stat-value">${getStatText("utility", this.stats.utility)}</span></p>
                    <p>Стабильность: <span class="stat-value">${getStatText("stability", this.stats.stability)}</span></p>
                    <p>Долговечность: <span class="stat-value">${getStatText("durability", this.stats.durability)}</span></p>
                    <p>Скорость: <span class="stat-value">${getStatText("speed", this.stats.speed)}</span></p>
                `;
    });

    bottle.addEventListener("mouseleave", () => {
      if (currentMode === "lens") {
        // Очищаем предыдущие таймеры, если они были
        clearTimeout(inspectorTimeout);

        // Запускаем таймер: текст сотрется только через 300 миллисекунд (0.3 секунды)
        inspectorTimeout = setTimeout(() => {
          document.getElementById("inspector-content").innerHTML =
            `<p>Наведите лупу на ингредиент...</p>`;
        }, 300);
      }
    });

    // Клик по колбе в режиме руки — добавляет единицу ингредиента!
    bottle.addEventListener("click", () => {
      // ЗАЩИТА: Если в котле уже 15 или больше капель — ничего не делаем
      if (cauldronStorage.potions.length >= 15) {
        console.log("Котёл полон! Больше 15 ингредиентов не влезет.");
        return;
      }
      // ВСПЫШКА ЗВУКА: Сбрасываем дорожку в ноль и играем!
      soundPop.currentTime = 0;
      soundPop.play();

      // 1. Копируем характеристики этого зелья и отправляем в массив котла
      cauldronStorage.potions.push({
        taste: this.stats.taste,
        utility: this.stats.utility,
        stability: this.stats.stability,
        durability: this.stats.durability,
        speed: this.stats.speed,
        color: this.liquidColor,
      });

      // Находим HTML-элемент котла, чтобы обновить его визуал
      const cauldronVisual = document.getElementById("cauldron");

      // 2. Красим котёл в цвет только что влитого ингредиента [GDD]
      cauldronVisual.style.background = updateCauldronVisual();

      // 3. Устраиваем визуальный всплеск (эффект расширения котла от капли) [GDD]
      cauldronVisual.style.transform = "scale(1.1)";
      setTimeout(() => {
        cauldronVisual.style.transform = "scale(1.0)";
      }, 100);

      // Выводим в консоль для контроля, сколько уже зелий внутри
      console.log(
        `Добавлена порция! Всего ингредиентов в котле: ${cauldronStorage.potions.length}`,
      );
    });

    return bottle;
  }
}

const cauldronStorage = {
  potions: [], // Сюда мы будем складывать параметры каждого кликнутого зелья
  color: "#322347", // Стартовый нейтральный цвет варева внутри котла
  isMixed: false, // Флаг: было ли применено взаимодействие (мешалка, огонь, молоток)
  // Итоговые характеристики, которые посчитаются ПОСЛЕ смешивания
  stats: { taste: 0, utility: 0, stability: 0, durability: 0, speed: 0 },
};

// Находим полку на странице
const shelfElement = document.getElementById("shelf");

// Создаем случайные колбы с помощью цикла
for (let i = 0; i < COUNT_POTION; i++) {
  // Создаем объект по нашему чертежу
  const newBottle = new PotionBottle(
    startingStats.taste[i],
    startingStats.utility[i],
    startingStats.stability[i],
    startingStats.durability[i],
    startingStats.speed[i],
  );
  // Берем созданный HTML и ставим на полку
  shelfElement.appendChild(newBottle.element);
}

// Глобальное состояние игры: какой инструмент сейчас выбран
// По умолчанию при старте игры выбрана рука ('hand')
let currentMode = "hand";

// Находим кнопки переключения режимов
const btnModeHand = document.getElementById("btn-mode-hand");
const btnModeLens = document.getElementById("btn-mode-lens");
const inspectorContent = document.getElementById("inspector-content");

// Находим котел и огонек на странице
const cauldronElement = document.getElementById("cauldron");
const fireParticle = document.getElementById("fire-particle");

// НАВЕДЕНИЕ НА КОТЕЛ
cauldronElement.addEventListener("mouseenter", () => {
  clearTimeout(inspectorTimeout);

  // Если в котле больше 1 порции — это несмешанные полосочки!
  if (cauldronStorage.potions.length > 1) {
    document.getElementById("inspector-content").innerHTML = `
                <p>🔮 Варево бурлит слоями...</p>
                <p><em>Примени инструмент (🥄, 🔨), чтобы связать ингредиенты.</em></p>
            `;
  } else if (cauldronStorage.potions.length === 1) {
    // Берем данные из единственного готового зелья на дне котла
    const currentPotion = cauldronStorage.potions[0];

    document.getElementById("inspector-content").innerHTML = `
                <h3>Готовое варево:</h3>
                <p>Вкус: <span class="stat-value">${getStatText("taste", currentPotion.taste)}</span></p>
                <p>Польза: <span class="stat-value">${getStatText("utility", currentPotion.utility)}</span></p>
                <p>Стабильность: <span class="stat-value">${getStatText("stability", currentPotion.stability)}</span></p>
                <p>Долговечность: <span class="stat-value">${getStatText("durability", currentPotion.durability)}</span></p>
                <p>Скорость: <span class="stat-value">${getStatText("speed", currentPotion.speed)}</span></p>
            `;
  } else {
    document.getElementById("inspector-content").innerHTML =
      `<p>Котёл абсолютно пуст...</p>`;
  }
});

cauldronElement.addEventListener("mouseleave", () => {
  if (currentMode === "lens") {
    inspectorTimeout = setTimeout(() => {
      document.getElementById("inspector-content").innerHTML =
        `<p>Наведите лупу на ингредиент...</p>`;
    }, 300);
  }
});

// Оживляем кнопку Огня (третья кнопка в тулбаре)
const btnActionFire = document.getElementById("btn-action-fire");
let isFireOn = false;

btnActionFire.addEventListener("click", () => {
  if (cauldronStorage.potions.length !== 1) return;

  isFireOn = !isFireOn; // Меняем состояние вкл/выкл

  if (isFireOn) {
    fireParticle.classList.add("burning"); // Зажигаем огонь
    btnActionFire.classList.add("active"); // Подсвечиваем кнопку золотым
  } else {
    fireParticle.classList.remove("burning"); // Тушим огонь
    btnActionFire.classList.remove("active");
  }
});

// Оживляем кнопку Стука (пятая кнопка в тулбаре)
const btnActionKnock = document.getElementById("btn-action-knock");

const btnActionStir = document.getElementById("btn-action-stir");

const btnActionFreeze = document.getElementById("btn-action-freeze");

// 🥄 1. ПЕРЕМЕШАТЬ (Среднее арифметическое)
btnActionStir.addEventListener("click", () => {
  if (cauldronStorage.potions.length < 2) return;

  // ВСПЫШКА ЗВУКА: Сбрасываем дорожку в ноль и играем!
  soundSplash.currentTime = 0.1;
  soundSplash.play();

  cauldronStorage.color = `hsl(${getRandomInt(0, 360)}, 85%, 45%)`;

  let sums = { taste: 0, utility: 0, stability: 0, durability: 0, speed: 0 };
  let count = cauldronStorage.potions.length;

  cauldronStorage.potions.forEach((p) => {
    sums.taste += p.taste;
    sums.utility += p.utility;
    sums.stability += p.stability;
    sums.durability += p.durability;
    sums.speed += p.speed;
  });

  cauldronStorage.stats.taste = Math.floor(sums.taste / count);
  cauldronStorage.stats.utility = Math.floor(sums.utility / count);
  cauldronStorage.stats.stability = Math.floor(sums.stability / count);
  cauldronStorage.stats.durability = Math.floor(sums.durability / count);
  cauldronStorage.stats.speed = Math.floor(sums.speed / count);

  // Перезаписываем массив: результат становится единственным элементом на дне котла
  cauldronStorage.potions = [
    { ...cauldronStorage.stats, color: cauldronStorage.color },
  ];
  updateCauldronVisual();
  updateCauldronInspector();
  console.log("Смешано среднее значение!");
});

// 🔨 2. МОЛОТОК (Случайный хаос между границами + прыжок)
btnActionKnock.addEventListener("click", () => {
  if (cauldronStorage.potions.length < 2) return;

  // ВСПЫШКА ЗВУКА: Сбрасываем дорожку в ноль и играем!
  soundKnock.currentTime = 0; // Это нужно, чтобы если ты стучишь быстро, звук мгновенно обрывался и играл заново, а не ждал конца старого звука
  soundKnock.play();

  const randomJump = getRandomInt(5, 15);
  cauldronElement.style.transform = `translateY(-${randomJump}px)`;
  setTimeout(() => {
    cauldronElement.style.transform = "translateY(0)";
  }, 80);

  cauldronStorage.color = `hsl(${getRandomInt(0, 360)}, 90%, 40%)`;

  const tastes = cauldronStorage.potions.map((p) => p.taste);
  const utilities = cauldronStorage.potions.map((p) => p.utility);
  const stabilities = cauldronStorage.potions.map((p) => p.stability);
  const durabilities = cauldronStorage.potions.map((p) => p.durability);
  const speeds = cauldronStorage.potions.map((p) => p.speed);

  const applyHammerMath = (arr) => {
    let min = Math.min(...arr);
    let max = Math.max(...arr);
    let baseRandom = getRandomInt(min, max);
    let finalValue =
      baseRandom + (Math.random() > 0.5 ? randomJump : -randomJump);
    return Math.min(100, Math.max(0, finalValue));
  };

  cauldronStorage.stats.taste = applyHammerMath(tastes);
  cauldronStorage.stats.utility = applyHammerMath(utilities);
  cauldronStorage.stats.stability = applyHammerMath(stabilities);
  cauldronStorage.stats.durability = applyHammerMath(durabilities);
  cauldronStorage.stats.speed = applyHammerMath(speeds);

  cauldronStorage.potions = [
    { ...cauldronStorage.stats, color: cauldronStorage.color },
  ];
  updateCauldronVisual();
  updateCauldronInspector();
});

// 🔥 3. ОГОНЬ (Работает СТРОГО когда в котле ОДИН элемент)
btnActionFire.addEventListener("click", () => {
  // ЖЕСТКАЯ ПРОВЕРКА: Работает только если в котле ровно 1 элемент!
  // Если котел пуст (0) или там слои (>1) — кнопка мгновенно завершает работу и не ломается.
  if (cauldronStorage.potions.length !== 1) return;

  // ВСПЫШКА ЗВУКА: Сбрасываем дорожку в ноль и играем!
  soundFire.currentTime = 0;
  soundFire.play();

  // Включаем визуал пламени и золотую подсветку кнопки
  fireParticle.className = "burning";
  btnActionFire.classList.add("active");

  // Меняем цвет варева на огненный
  cauldronStorage.color = `hsl(${getRandomInt(10, 25)}, 95%, 45%)`;

  // Спокойно берем наше единственное базовое зелье
  let base = cauldronStorage.potions[0];

  // Растим статы, ограничивая их потолком в 100 единиц (используем Math.min)
  cauldronStorage.stats.taste = Math.min(100, base.taste + 15);
  cauldronStorage.stats.utility = Math.min(100, base.utility + 15);
  cauldronStorage.stats.stability = Math.min(100, base.stability + 15);
  cauldronStorage.stats.durability = Math.min(100, base.durability + 15);
  cauldronStorage.stats.speed = Math.min(100, base.speed + 15);

  // Обновляем это единственное зелье в массиве котла
  cauldronStorage.potions[0] = {
    ...cauldronStorage.stats,
    color: cauldronStorage.color,
  };
  updateCauldronVisual();
  updateCauldronInspector();

  // Ровно через 300 миллисекунд тушим пламя и убираем золото с кнопки
  setTimeout(() => {
    fireParticle.className = "";
    btnActionFire.classList.remove("active");
  }, 300);
});

// ❄️ 4. ЗАМОРОЗКА / ОХЛАЖДЕНИЕ (Плавно опускает характеристики на -15)
btnActionFreeze.addEventListener("click", () => {
  if (cauldronStorage.potions.length > 1) return;

  // ВСПЫШКА ЗВУКА: Сбрасываем дорожку в ноль и играем!
  soundFreeze.currentTime = 0.1;
  soundFreeze.play();

  // Вспышка ледяного сине-голубого цвета
  cauldronStorage.color = `hsl(${getRandomInt(190, 220)}, 90%, 60%)`;

  let base = cauldronStorage.potions[0];

  // Опускаем статы ниже, но строго не меньше 0
  cauldronStorage.stats.taste = Math.max(0, base.taste - 15);
  cauldronStorage.stats.utility = Math.max(0, base.utility - 15);
  cauldronStorage.stats.stability = Math.max(0, base.stability - 15);
  cauldronStorage.stats.durability = Math.max(0, base.durability - 15);
  cauldronStorage.stats.speed = Math.max(0, base.speed - 15);

  cauldronStorage.potions = [
    { ...cauldronStorage.stats, color: cauldronStorage.color },
  ];
  updateCauldronVisual();
  updateCauldronInspector();

  // Визуальный эффект замерзания: котел слегка сожмется на миг
  cauldronElement.style.transform = "scale(0.85)";
  setTimeout(() => {
    cauldronElement.style.transform = "scale(1.0)";
  }, 100);
});

// Запускаем генерацию рецепта при старте игры
generateRandomRecipe();
