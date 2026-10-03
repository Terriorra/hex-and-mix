class PotionBottle {
    constructor() {
        // 1. Генерируем случайные характеристики для этой конкретной колбы
        this.width = Math.floor(Math.random() * (80 - 40 + 1)) + 40;   // Случайная ширина от 40px до 80px
        this.height = Math.floor(Math.random() * (120 - 70 + 1)) + 70; // Случайная высота от 70px до 120px
        
        // Генерируем случайный цвет в формате HSL (так проще получать яркие цвета)
        // Магия HSL: случайный тон от 0 до 360, насыщенность 80%, яркость 50%
        this.liquidColor = `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`; 
        
        // Случайный уровень жидкости в процентах (от 20% до 90%)
        this.liquidLevel = Math.floor(Math.random() * (90 - 20 + 1)) + 20;

        // Случайные характеристики для будущей "лупы"
        this.magicPower = Math.floor(Math.random() * 100);
        this.toxicity = Math.floor(Math.random() * 50);

        // 2. Сразу создаем HTML-элемент для этой колбы
        this.element = this.createHTML();
    }

    // Метод, который собирает колбу из HTML-кусочков
    createHTML() {

        // Создаем главный контейнер колбы (стекло)
        const bottle = document.createElement('div');
        bottle.className = 'bottle-container';
        bottle.style.width = this.width + 'px';
        bottle.style.height = this.height + 'px';

        // Генерируем случайный правый отступ для колбочки (от 5px до 35px)
        const randomMargin = Math.floor(Math.random() * (35 - 5 + 1)) + 5;
        bottle.style.marginRight = randomMargin + 'px';

        // Создаем блок для жидкости
        const liquid = document.createElement('div');
        liquid.className = 'bottle-liquid';
        liquid.style.backgroundColor = this.liquidColor;
        liquid.style.height = this.liquidLevel + '%'; // Задаем высоту жидкости в процентах

        // Кладим жидкость внутрь колбы
        bottle.appendChild(liquid);


        // НАВЕДЕНИЕ МЫШКИ (Наша лупа)
        // Теперь инспектор будет выводить только реальные физические свойства колбы!
        bottle.addEventListener('mouseenter', () => {
            if (currentMode === 'lens') {
                document.getElementById('inspector-content').innerHTML = `
                    <p>Цвет раствора: <span class="stat-value">${this.liquidColor}</span></p>
                    <p>Заполнено на: <span class="stat-value">${this.liquidLevel}%</span></p>
                    <p>Высота колбы: <span class="stat-value">${this.height}px</span></p>
                `;
            }
        });

        bottle.addEventListener('mouseleave', () => {
            if (currentMode === 'lens') {
                document.getElementById('inspector-content').innerHTML = `<p>Наведите лупу на ингредиент...</p>`;
            }
        });

        return bottle;
    }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Находим полку на странице
const shelfElement = document.getElementById('shelf');

// Создаем 3 случайные колбы с помощью цикла
for (let i = 0; i < getRandomInt(2, 10); i++) {
    const newBottle = new PotionBottle(); // Создаем объект по нашему чертежу
    shelfElement.appendChild(newBottle.element); // Берем созданный HTML и ставим на полку
}

// Глобальное состояние игры: какой инструмент сейчас выбран
// По умолчанию при старте игры выбрана рука ('hand')
let currentMode = 'hand'; 

// Находим кнопки переключения режимов
const btnModeHand = document.getElementById('btn-mode-hand');
const btnModeLens = document.getElementById('btn-mode-lens');
const inspectorContent = document.getElementById('inspector-content');

// Переключение на режим РУКИ
btnModeHand.addEventListener('click', () => {
    currentMode = 'hand';
    btnModeHand.classList.add('active');
    btnModeLens.classList.remove('active');
    
    // Сбрасываем текст инспектора, так как лупу убрали
    inspectorContent.innerHTML = `<p>Выберите режим 🔍 и наведите на ингредиент...</p>`;
});

// Переключение на режим ЛУПЫ
btnModeLens.addEventListener('click', () => {
    currentMode = 'lens';
    btnModeLens.classList.add('active');
    btnModeHand.classList.remove('active');
    
    inspectorContent.innerHTML = `<p>Наведите лупу на ингредиент...</p>`;
});


