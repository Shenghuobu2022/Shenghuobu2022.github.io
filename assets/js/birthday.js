/**
 * 生活部文化有限公司 — 生日祝福 & 成立时长
 */
(function () {
  'use strict';

  const ESTABLISH_DATE = new Date(2022, 5, 1); // 2022年6月1日

  // ---- 成立时长 ----
  function updateDuration() {
    const el = document.getElementById('establish-duration');
    if (!el) return;
    const now = new Date();
    let years = now.getFullYear() - ESTABLISH_DATE.getFullYear();
    let months = now.getMonth() - ESTABLISH_DATE.getMonth();
    let days = now.getDate() - ESTABLISH_DATE.getDate();
    if (days < 0) {
      months--;
      const prev = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prev.getDate();
    }
    if (months < 0) { years--; months += 12; }
    el.textContent = years + '年' + months + '个月' + days + '天';
  }
  updateDuration();
  setInterval(updateDuration, 60000);

  // ---- 生日检测 ----
  const page = location.pathname.split('/').pop() || '';

  fetch('assets/text/birthday.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data[page]) return;

      var bDay = data[page];
      var parts = bDay.date.split('-');
      var bMonth = parseInt(parts[0], 10);
      var bDayNum = parseInt(parts[1], 10);

      var today = new Date();
      var tMonth = today.getMonth() + 1;
      var tDay = today.getDate();

      // 构造今年的生日日期
      var bDate = new Date(today.getFullYear(), bMonth - 1, bDayNum);
      var diffDays = Math.floor((bDate - new Date(today.getFullYear(), tMonth - 1, tDay)) / 86400000);

      // 3天以内才触发
      if (diffDays >= -3 && diffDays <= 3) {
        showBirthday(bDay.name, diffDays);
      }
    })
    .catch(function () { /* 静默失败 */ });

  // ---- 蛋糕 + 爱心特效 ----
  function showBirthday(name, diff) {
    // 遮罩
    var overlay = document.createElement('div');
    overlay.className = 'bday-overlay';
    document.body.appendChild(overlay);

    // 弹窗
    var popup = document.createElement('div');
    popup.className = 'bday-popup';

    var emoji = diff === 0 ? '🎂' : (diff > 0 ? '🎁' : '🍰');
    var title = diff === 0
      ? name + ' 生日快乐！'
      : (diff > 0 ? name + ' 即将过生日！' : name + ' 刚过完生日！');
    var sub = diff === 0
      ? '生活部全体成员祝你生日快乐，万事如意！'
      : (diff > 0 ? '还有 ' + diff + ' 天就是你的生日啦～' : '迟到的生日祝福，心意不打折！');

    popup.innerHTML =
      '<div class="bday-emoji">' + emoji + '</div>' +
      '<h2 class="bday-title">' + title + '</h2>' +
      '<p class="bday-sub">' + sub + '</p>' +
      '<div class="bday-cake">' +
        '<div class="cake-body"></div>' +
        '<div class="cake-candle"><div class="flame"></div></div>' +
      '</div>' +
      '<button class="bday-btn">吹蜡烛 ✨</button>';

    document.body.appendChild(popup);

    // 按钮点击
    var btn = popup.querySelector('.bday-btn');
    btn.addEventListener('click', function () {
      spawnHearts();
      popup.classList.add('bday-popup--done');
      setTimeout(function () {
        popup.remove();
        overlay.remove();
      }, 800);
    });

    // 自动展示动画
    setTimeout(function () {
      popup.classList.add('bday-popup--show');
    }, 400);
  }

  // ---- 爱心雨 ----
  function spawnHearts() {
    for (var i = 0; i < 35; i++) {
      setTimeout(function () {
        var heart = document.createElement('div');
        heart.className = 'bday-heart';
        heart.textContent = ['❤️', '💕', '💖', '💗', '💝', '✨', '🎉'][Math.floor(Math.random() * 7)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (2 + Math.random() * 3) + 's';
        heart.style.fontSize = (1 + Math.random() * 2) + 'rem';
        document.body.appendChild(heart);
        setTimeout(function () { heart.remove(); }, 4000);
      }, i * 40);
    }
  }

  // ---- 样式注入 ----
  function injectStyles() {
    var css =
      '.bday-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;animation:bdayFadeIn .4s ease-out}' +
      '.bday-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.7);z-index:10000;' +
        'background:rgba(22,22,22,0.95);border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:36px 40px;' +
        'text-align:center;opacity:0;transition:all .5s cubic-bezier(.34,1.56,.64,1);' +
        'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);max-width:380px;width:90%}' +
      '.bday-popup--show{opacity:1;transform:translate(-50%,-50%) scale(1)}' +
      '.bday-popup--done{opacity:0;transform:translate(-50%,-50%) scale(0.5)}' +
      '.bday-emoji{font-size:3.5rem;margin-bottom:8px;animation:bdayFloat 2s ease-in-out infinite}' +
      '.bday-title{font-size:1.4rem;color:#FFD700;font-weight:800;letter-spacing:1px;margin-bottom:8px}' +
      '.bday-sub{font-size:.9rem;color:#aaa;margin-bottom:20px;line-height:1.5}' +
      '.bday-cake{position:relative;width:80px;height:70px;margin:0 auto 20px}' +
      '.cake-body{position:absolute;bottom:0;width:80px;height:50px;background:linear-gradient(180deg,#f8b4c8,#e88ca5);' +
        'border-radius:8px 8px 4px 4px;box-shadow:0 4px 12px rgba(248,180,200,.3)}' +
      '.cake-body::after{content:"";position:absolute;top:-8px;width:80px;height:10px;background:#fce4ec;border-radius:20px}' +
      '.cake-candle{position:absolute;bottom:50px;left:50%;transform:translateX(-50%);width:6px;height:22px;background:#ff6b6b;border-radius:3px}' +
      '.flame{position:absolute;top:-12px;left:-4px;width:14px;height:18px;background:radial-gradient(circle,#ffda79,#ff9f43);' +
        'border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;animation:flameFlicker .15s ease-in-out infinite alternate}' +
      '.bday-btn{display:inline-block;padding:10px 30px;background:linear-gradient(135deg,#ff6b6b,#ff8e53);color:#fff;border:none;' +
        'border-radius:8px;font-size:.95rem;font-weight:700;letter-spacing:2px;cursor:pointer;transition:transform .2s,box-shadow .2s}' +
      '.bday-btn:hover{transform:scale(1.06);box-shadow:0 6px 20px rgba(255,107,107,.4)}' +
      '.bday-heart{position:fixed;top:-40px;z-index:10001;animation:bdayFall linear forwards;pointer-events:none}' +
      '@keyframes bdayFadeIn{from{opacity:0}to{opacity:1}}' +
      '@keyframes bdayFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
      '@keyframes flameFlicker{from{transform:scale(1,.9)}to{transform:scale(.9,1.1)}}' +
      '@keyframes bdayFall{to{top:105vh;transform:rotate(360deg)}}';

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  injectStyles();
})();
