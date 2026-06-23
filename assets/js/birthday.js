/**
 * 生活部文化有限公司 — 走字时钟 + 生日祝福 + 成立周年
 * 成立日：2022年9月18日  |  生日窗口：前后7天
 */
(function () {
  'use strict';

  var ESTABLISH_DATE = new Date(2022, 8, 18); // 2022-09-18
  var BDAY_RANGE = 7;
  var page = location.pathname.split('/').pop() || '';
  var tickerEl = null;
  var secondsEl = null;

  // ============ 注入走字时钟 HTML ============
  function injectTicker() {
    var container = document.querySelector('.page-container');
    if (!container) return;

    var div = document.createElement('div');
    div.className = 'est-ticker';
    div.innerHTML =
      '<span class="ticker-icon">⏳</span>' +
      '<div class="ticker-label">生活部文化有限公司已成立</div>' +
      '<div class="ticker-digits" id="ticker-digits">--</div>' +
      '<div class="ticker-seconds" id="ticker-seconds">--:--:--</div>' +
      '<div class="ticker-btns">' +
        '<button class="ticker-trigger" id="trigger-anniversary">🎉 周年庆</button>' +
        '<button class="ticker-trigger" id="trigger-birthday" style="display:none;">🎂 生日祝福</button>' +
      '</div>';

    container.insertBefore(div, container.firstChild);
    tickerEl = document.getElementById('ticker-digits');
    secondsEl = document.getElementById('ticker-seconds');
  }

  // ============ 注入生日行 ============
  function injectBirthdayRow(nameText, dateStr) {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var row = document.createElement('div');
    row.className = 'birthday-inline';
    row.innerHTML =
      '🎂 ' + nameText + ' 的生日：<strong style="color:var(--accent);">' + dateStr + '</strong>' +
      ' <button class="bday-trigger" id="manual-bday-trigger">祝福TA 🎂</button>';
    hero.appendChild(row);

    // 同时让时钟区的生日按钮可见
    var btn = document.getElementById('trigger-birthday');
    if (btn) btn.style.display = 'inline-block';
  }

  // ============ 走字更新 ============
  function updateTicker() {
    if (!tickerEl) return;
    var now = new Date();
    var diff = now - ESTABLISH_DATE;

    // 算年月日
    var y = now.getFullYear() - ESTABLISH_DATE.getFullYear();
    var m = now.getMonth() - ESTABLISH_DATE.getMonth();
    var d = now.getDate() - ESTABLISH_DATE.getDate();
    if (d < 0) {
      m--;
      var prev = new Date(now.getFullYear(), now.getMonth(), 0);
      d += prev.getDate();
    }
    if (m < 0) { y--; m += 12; }

    tickerEl.innerHTML =
      '<span>' + pad(y, 2) + '</span>' +
      '<span class="ticker-digi-label">年</span>' +
      '<span>' + pad(m, 2) + '</span>' +
      '<span class="ticker-digi-label">月</span>' +
      '<span>' + pad(d, 2) + '</span>' +
      '<span class="ticker-digi-label">天</span>';

    // 时分秒
    var totalSec = Math.floor(diff / 1000);
    var h = Math.floor((totalSec % 86400) / 3600);
    var min = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if (secondsEl) {
      secondsEl.textContent = pad(h, 2) + ':' + pad(min, 2) + ':' + pad(s, 2);
    }

    // 同步更新底部的小字计数器
    var durEl = document.getElementById('establish-duration');
    if (durEl) {
      durEl.textContent = y + '年' + m + '个月' + d + '天';
    }
  }

  function pad(n, len) { return ('00' + n).slice(-len); }

  // ============ 日期工具 ============
  function dayDiff(month, day) {
    var now = new Date();
    var target = new Date(now.getFullYear(), month - 1, day);
    return Math.floor((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  }

  function fmtDate(parts) {
    return parseInt(parts[0], 10) + '月' + parseInt(parts[1], 10) + '日';
  }

  // ============ 初始化（fetch birthday.json 后统一处理） ============
  injectTicker();
  updateTicker();
  setInterval(updateTicker, 1000);

  fetch('assets/text/birthday.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var myData = data[page] || null;

      // 注入生日行
      if (myData) {
        injectBirthdayRow(myData.name, fmtDate(myData.date.split('-')));
      }

      // 检测成员生日（7天内自动弹窗，否则绑定手动触发）
      if (myData) {
        var parts = myData.date.split('-');
        var diff = dayDiff(parseInt(parts[0], 10), parseInt(parts[1], 10));
        if (diff >= -BDAY_RANGE && diff <= BDAY_RANGE) {
          setTimeout(function () { showBirthday(myData.name, diff, myData.note || ''); }, 800);
        }
        // 手动触发按钮
        bindTrigger('trigger-birthday', function () {
          showBirthday(myData.name, 0, myData.note || '');
        });
        bindTrigger('manual-bday-trigger', function () {
          showBirthday(myData.name, 0, myData.note || '');
        });
      }

      // 检测成立周年（7天内自动弹窗，否则绑定手动触发）
      var anniDiff = dayDiff(9, 18);
      var anniYears = new Date().getFullYear() - 2022;
      if (anniDiff >= -BDAY_RANGE && anniDiff <= BDAY_RANGE) {
        setTimeout(function () { showAnniversary(anniYears, anniDiff); }, 800);
      }
      bindTrigger('trigger-anniversary', function () {
        showAnniversary(anniYears, 0);
      });
    })
    .catch(function () { /* 静默 */ });

  function bindTrigger(id, fn) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', fn);
  }

  // ============ 弹窗：生日 ============
  function showBirthday(name, diff, note) {
    var existing = document.querySelector('.bday-overlay');
    if (existing) existing.remove();
    var existingP = document.querySelector('.bday-popup');
    if (existingP) existingP.remove();

    var overlay = document.createElement('div');
    overlay.className = 'bday-overlay';
    document.body.appendChild(overlay);

    var popup = document.createElement('div');
    popup.className = 'bday-popup';

    var isToday = diff === 0;
    var emoji = isToday ? '🎂' : (diff > 0 ? '🎁' : '🍰');
    var title = isToday
      ? name + ' 生日快乐！'
      : (diff > 0 ? name + ' 即将过生日！🎉' : name + ' 刚过完生日！💫');
    var sub = isToday
      ? '生活部全体成员祝你生日快乐，万事如意！'
      : (diff > 0 ? '还有 ' + diff + ' 天就是 TA 的生日啦～' : '已经过去 ' + Math.abs(diff) + ' 天了，祝福不打折！');

    if (note) {
      sub += '<br><span style="font-size:.78rem;opacity:.7;">' + note + '</span>';
    }

    var btnHtml = isToday
      ? '<button class="bday-btn">吹蜡烛 ✨</button>'
      : '<button class="bday-btn bday-btn--blow">吹蜡烛 ✨</button>' +
        '<button class="bday-btn bday-btn--cake">看看蛋糕 🎂</button>';

    popup.innerHTML =
      '<div class="bday-emoji">' + emoji + '</div>' +
      '<h2 class="bday-title">' + title + '</h2>' +
      '<p class="bday-sub">' + sub + '</p>' +
      '<div class="bday-cake" style="' + (isToday ? '' : 'display:none;') + '">' +
        '<div class="cake-body"></div>' +
        '<div class="cake-candle"><div class="flame"></div></div>' +
      '</div>' +
      '<div class="bday-btns">' + btnHtml + '</div>';

    document.body.appendChild(popup);
    setupBdayButtons(popup, overlay, isToday);

    setTimeout(function () {
      popup.classList.add('bday-popup--show');
    }, 300);
  }

  function setupBdayButtons(popup, overlay, isToday) {
    var blowBtn = popup.querySelector('.bday-btn--blow') || popup.querySelector('.bday-btn');
    blowBtn.addEventListener('click', function () {
      spawnHearts();
      popup.classList.add('bday-popup--done');
      setTimeout(function () { popup.remove(); overlay.remove(); }, 800);
    });

    var cakeBtn = popup.querySelector('.bday-btn--cake');
    if (cakeBtn) {
      cakeBtn.addEventListener('click', function () {
        popup.querySelector('.bday-cake').style.display = 'block';
        spawnHearts();
        cakeBtn.style.display = 'none';
        var btn = popup.querySelector('.bday-btn--blow');
        btn.textContent = '爱心够了，收工！💝';
      });
    }
  }

  // ============ 弹窗：周年 ============
  function showAnniversary(years, diff) {
    var existing = document.querySelector('.bday-overlay');
    if (existing) existing.remove();
    var existingP = document.querySelector('.bday-popup');
    if (existingP) existingP.remove();

    var overlay = document.createElement('div');
    overlay.className = 'bday-overlay';
    document.body.appendChild(overlay);

    var popup = document.createElement('div');
    popup.className = 'bday-popup';

    var isToday = diff === 0;
    var emoji = isToday ? '🏢🎉' : '🏢';
    var title = isToday
      ? '生活部成立 ' + years + ' 周年快乐！'
      : (diff > 0 ? '生活部成立 ' + years + ' 周年倒计时！' : '生活部成立 ' + years + ' 周年刚过！');
    var sub = isToday
      ? '2022年9月18日 — 生活部群正式建立。感谢每一位成员的陪伴！'
      : (diff > 0
        ? '还有 ' + diff + ' 天就是生活部 ' + years + ' 岁生日啦！'
        : '迟到的庆祝，但我们永远在一起！');

    popup.innerHTML =
      '<div class="bday-emoji" style="font-size:2.8rem;">' + emoji + '</div>' +
      '<h2 class="bday-title">' + title + '</h2>' +
      '<p class="bday-sub">' + sub + '</p>' +
      '<p class="bday-sub" style="font-size:.8rem;opacity:.7;">冰和姜选择留部 → 线上面试 → 群聊建立 → 第一次团建 → 三年陪伴</p>' +
      '<div class="bday-cake">' +
        '<div class="cake-body"></div>' +
        '<div class="cake-candle"><div class="flame"></div></div>' +
      '</div>' +
      '<button class="bday-btn">' + (isToday ? '庆祝 🎊' : '提前庆祝 🎊') + '</button>';

    document.body.appendChild(popup);

    var btn = popup.querySelector('.bday-btn');
    btn.addEventListener('click', function () {
      spawnHearts();
      spawnHearts();
      popup.classList.add('bday-popup--done');
      setTimeout(function () { popup.remove(); overlay.remove(); }, 800);
    });

    setTimeout(function () {
      popup.classList.add('bday-popup--show');
    }, 400);
  }

  // ============ 爱心雨 ============
  function spawnHearts() {
    for (var i = 0; i < 35; i++) {
      setTimeout(function () {
        var heart = document.createElement('div');
        heart.className = 'bday-heart';
        heart.textContent = ['❤️', '💕', '💖', '💗', '💝', '✨', '🎉', '🎊', '🥳'][Math.floor(Math.random() * 9)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (2 + Math.random() * 3) + 's';
        heart.style.fontSize = (1 + Math.random() * 2) + 'rem';
        document.body.appendChild(heart);
        setTimeout(function () { heart.remove(); }, 4000);
      }, i * 40);
    }
  }

  // ============ CSS 注入 ============
  function injectStyles() {
    var css =
      '.bday-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;animation:bdayFadeIn .4s ease-out}' +
      '.bday-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.7);z-index:10000;' +
        'background:rgba(22,22,22,0.96);border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:32px 36px;' +
        'text-align:center;opacity:0;transition:all .5s cubic-bezier(.34,1.56,.64,1);' +
        'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);max-width:400px;width:90%}' +
      '.bday-popup--show{opacity:1;transform:translate(-50%,-50%) scale(1)}' +
      '.bday-popup--done{opacity:0;transform:translate(-50%,-50%) scale(0.5)}' +
      '.bday-emoji{font-size:3.5rem;margin-bottom:8px;animation:bdayFloat 2s ease-in-out infinite}' +
      '.bday-title{font-size:1.4rem;color:#FFD700;font-weight:800;letter-spacing:1px;margin-bottom:8px}' +
      '.bday-sub{font-size:.9rem;color:#aaa;margin-bottom:16px;line-height:1.5}' +
      '.bday-cake{position:relative;width:80px;height:70px;margin:0 auto 18px}' +
      '.cake-body{position:absolute;bottom:0;width:80px;height:50px;background:linear-gradient(180deg,#f8b4c8,#e88ca5);' +
        'border-radius:8px 8px 4px 4px;box-shadow:0 4px 12px rgba(248,180,200,.3)}' +
      '.cake-body::after{content:"";position:absolute;top:-8px;width:80px;height:10px;background:#fce4ec;border-radius:20px}' +
      '.cake-candle{position:absolute;bottom:50px;left:50%;transform:translateX(-50%);width:6px;height:22px;background:#ff6b6b;border-radius:3px}' +
      '.flame{position:absolute;top:-12px;left:-4px;width:14px;height:18px;background:radial-gradient(circle,#ffda79,#ff9f43);' +
        'border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;animation:flameFlicker .15s ease-in-out infinite alternate}' +
      '.bday-btns{display:flex;justify-content:center;flex-wrap:wrap;gap:8px}' +
      '.bday-btn{display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#ff6b6b,#ff8e53);color:#fff;border:none;' +
        'border-radius:8px;font-size:.9rem;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all .2s}' +
      '.bday-btn:hover{transform:scale(1.06);box-shadow:0 6px 20px rgba(255,107,107,.4)}' +
      '.bday-btn--cake{background:linear-gradient(135deg,#f8b4c8,#e88ca5)}' +
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
