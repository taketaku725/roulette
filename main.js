document.addEventListener("DOMContentLoaded", () => {

  // ===== 状態 =====
  let items = [];
  let currentRotation = 0;
  let isSpinning = false;
  let templates = JSON.parse(localStorage.getItem("rouletteTemplates")) || [];

  // ===== 要素 =====
  const roulette = document.getElementById("roulette");
  const svg = document.getElementById("labelSvg");
  const startButton = document.getElementById("startButton");
  const resultText = document.getElementById("resultText");

  const itemInput = document.getElementById("itemInput");
  const addItemButton = document.getElementById("addItemButton");
  const itemList = document.getElementById("itemList");

  const templateName = document.getElementById("templateName");
  const saveTemplateButton = document.getElementById("saveTemplateButton");
  const templateSelect = document.getElementById("templateSelect");
  const loadTemplateButton = document.getElementById("loadTemplateButton");
  const deleteTemplateButton = document.getElementById("deleteTemplateButton");
  const clearAllButton = document.getElementById("clearAllButton");
  // ===== 初期化 =====
  renderRoulette();
  renderItemList();
  renderTemplateList();

  // ===== イベント =====
  startButton.addEventListener("click", spin);
  addItemButton.addEventListener("click", addItem);
  itemInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addItem();
  });
  saveTemplateButton.addEventListener("click", saveTemplate);
  loadTemplateButton.addEventListener("click", loadTemplate);
  deleteTemplateButton.addEventListener("click", deleteTemplate);

  clearAllButton.addEventListener("click", () => {
    if (items.length === 0) return;

    items = [];
    renderItemList();
    renderRoulette();
  });

  // ===== ルーレット描画 =====
  function renderRoulette() {
    if (items.length === 0) {
      roulette.style.background = "#ddd";
      svg.innerHTML = "";
      return;
    }

    const segmentAngle = 360 / items.length;
    let gradient = "conic-gradient(";

    items.forEach((item, index) => {
      const start = segmentAngle * index;
      const end = segmentAngle * (index + 1);
      const color = getColor(index);

      gradient += `${color} ${start}deg ${end}deg`;
      if (index !== items.length - 1) gradient += ", ";
    });

    gradient += ")";
    roulette.style.background = gradient;

    renderLabels(segmentAngle);
  }

  // ===== SVG文字配置 =====
  function renderLabels(segmentAngle) {

    svg.innerHTML = "";

    const rect = roulette.getBoundingClientRect();
    const size = roulette.clientWidth;
    const radius = size / 2;

    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");


    const arcFactor = 0.85;
    const textRadius = radius * arcFactor;

    items.forEach((item, index) => {

      const baseAngle = -90 + segmentAngle * index;

      const angle =
        items.length === 1
          ? -90               // 1個は12時固定
          : baseAngle + segmentAngle / 2;

      const rad = angle * Math.PI / 180;
    
      const x = radius + textRadius * Math.cos(rad);
      const y = radius + textRadius * Math.sin(rad);

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );

      text.setAttribute("x", x);
      text.setAttribute("y", y);
    
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "text-before-edge");

      // 放射方向へ向ける（+90で中心向き）
      text.setAttribute(
        "transform",
        `rotate(${angle + 90}, ${x}, ${y})`
      );

      const chars = item.split("");
      
      chars.forEach((ch, i) => {
        const tspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan"
        );

        tspan.textContent = ch;
      
        if (i === 0) {
          tspan.setAttribute("x", x);
          tspan.setAttribute("dy", "0");
        } else {
          tspan.setAttribute("x", x);
          tspan.setAttribute("dy", "1em");
        }

        text.appendChild(tspan);
      });

      svg.appendChild(text);

    });
  }

  // ===== 色 =====
  function getColor(index) {
    const colors = [
      "#ff7675", "#74b9ff", "#55efc4",
      "#ffeaa7", "#a29bfe", "#fab1a0",
      "#81ecec", "#fd79a8"
    ];
    return colors[index % colors.length];
  }

  // ===== 回転 =====
  function spin() {
    if (isSpinning || items.length < 2) return;

    isSpinning = true;
    resultText.textContent = "";

    const randomIndex = Math.floor(Math.random() * items.length);
    const segmentAngle = 360 / items.length;

    const targetAngle =
      360 - (randomIndex * segmentAngle + segmentAngle / 2);

    const extraSpins = 14 + Math.floor(Math.random() * 6);
    const totalRotation = 360 * extraSpins + targetAngle;

    currentRotation += totalRotation;

    roulette.style.transition =
      "transform 8s cubic-bezier(0.05, 0.98, 0.15, 1)";

    roulette.style.transform =
      `rotate(${currentRotation}deg)`;

    roulette.addEventListener("transitionend", function handler() {
      roulette.removeEventListener("transitionend", handler);

      const normalized =
        (currentRotation % 360 + 360) % 360;

      const pointerAngle = (360 - normalized) % 360;

      const winnerIndex =
        Math.floor(pointerAngle / segmentAngle);

      resultText.textContent = items[winnerIndex];
      isSpinning = false;
    });
  }

  // ===== 項目追加 =====
  function addItem() {
    const value = itemInput.value.trim();
    if (!value) return;

    items.push(value);
    itemInput.value = "";

    renderItemList();
    renderRoulette();
  }

  function removeItem(index) {
    items.splice(index, 1);
    renderItemList();
    renderRoulette();
  }

  function renderItemList() {
    itemList.innerHTML = "";

    items.forEach((item, index) => {

      const li = document.createElement("li");
      li.className = "item-row";

      // 🔴 色ドット
      const dot = document.createElement("div");
      dot.className = "item-color-dot";
      dot.style.background = getColor(index);

      // 📝 テキスト
      const textSpan = document.createElement("span");
      textSpan.textContent = item;

      // ❌ 削除ボタン
      const delBtn = document.createElement("button");
      delBtn.textContent = "削除";
      delBtn.onclick = () => removeItem(index);

      li.appendChild(dot);
      li.appendChild(textSpan);
      li.appendChild(delBtn);

      itemList.appendChild(li);
    });
  }

  // ===== テンプレ機能 =====
  function saveTemplate() {
    const name = templateName.value.trim();
    if (!name || items.length < 2) return;

    const existingIndex = templates.findIndex(t => t.name === name);
    const data = { name, items: [...items] };

    if (existingIndex >= 0) {
      templates[existingIndex] = data;
    } else {
      templates.push(data);
    }

    localStorage.setItem("rouletteTemplates", JSON.stringify(templates));
    renderTemplateList();
  }

  function loadTemplate() {
    const name = templateSelect.value;
    if (!name) return;

    const template = templates.find(t => t.name === name);
    if (!template) return;

    items = [...template.items];
    renderItemList();
    renderRoulette();
  }

  function deleteTemplate() {
    const name = templateSelect.value;
    if (!name) return;

    templates = templates.filter(t => t.name !== name);
    localStorage.setItem("rouletteTemplates", JSON.stringify(templates));
    renderTemplateList();
  }

  function renderTemplateList() {
    templateSelect.innerHTML = '<option value="">テンプレート選択</option>';
    templates.forEach(t => {
      const option = document.createElement("option");
      option.value = t.name;
      option.textContent = t.name;
      templateSelect.appendChild(option);
    });
  }

});

