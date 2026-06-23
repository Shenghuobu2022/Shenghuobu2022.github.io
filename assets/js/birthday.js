/**
 * 生活部文化有限公司 — 生日祝福 & 成立周年
 * 成立日：2022年9月18日
 * 生日范围：前后7天
 */
(function () {
  'use strict';

  const ESTABLISH_DATE = new Date(2022, 8, 18); // 2022年9月18日（生活部群建立）
  const BDAY_RANGE = 7; // 前后7天

  // ---- 成立时长 ----
  function updateDuration() {
    var el = document.getElementById('establish-duration');
    if (!el) return;
    var now = new Date();
    var years = now.getFullYear() - ESTABLISH_DATE.getFullYear();
    var months = now.getMonth() - ESTABLISH_DATE.getMonth();
    var days = now.getDate() - ESTABLISH_DATE.getDate();
    if (days < 0) {
      months--;
      var prev = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prev.getDate();
    }
    if (months < 0) { years--; months += 12; }
    el.textContent = years + '年' + months + '个月' + days + '天';
  }
  updateDuration();
  setInterval(updateDuration, 60000);

  var page = location.pathname.split('/').pop() || '';

  // ---- 计算与目标日期的天数差 ----
  function dayDiff(month, day) {
    var now = new Date();
    var target = new Date(now.getFullYear(), month - 1, day);
    return Math.floor((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  }

  // ---- 生日检测 ----
  fetch('assets/text/birthday.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      // 1. 当前页面的生日
      if (data[page]) {
        var b = data[page];
        var parts = b.date.split('-');
        var diff = dayDiff(parseInt(parts[0], 10), parseInt(parts[1], 10));
        if (diff >= -BDAY_RANGE && diff <= BDAY_RANGE) {
          showBirthday(b.name, diff, b.note || '');
        }
      }

      // 2. 部门成立周年 (9月18日)，在所有页面触发
      var anniDiff = dayDiff(9, 18);
      if (anniDiff >= -BDAY_RANGE && anniDiff <= BDAY_RANGE) {
        var years = new Date().getFullYear() - 2022;
        showAnniversary(years, anniDiff);
      }
    })
    .catch(function () { /* 静默 */ });

  // ---- 生日弹窗 ----
  function showBirthday(name, diff, note) {
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
        '<button class="bday-btn bday-btn--cake" style="margin-left:10px;">看看蛋糕 🎂</button>';

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

    // 吹蜡烛按钮
    var blowBtn = popup.querySelector('.bday-btn--blow') || popup.querySelector('.bday-btn');
    blowBtn.addEventListener('click', function () {
      spawnHearts();
      popup.classList.add('bday-popup--done');
      setTimeout(function () { popup.remove(); overlay.remove(); }, 800);
    });

    // "看看蛋糕" 按钮 (非当天才有)
    var cakeBtn = popup.querySelector('.bday-btn--cake');
    if (cakeBtn) {
      cakeBtn.addEventListener('click', function () {
        var cake = popup.querySelector('.bday-cake');
        cake.style.display = 'block';
        spawnHearts();
        cakeBtn.style.display = 'none';
        // 把吹蜡烛按钮变成关闭
        var btn = popup.querySelector('.bday-btn--blow');
        btn.textContent = '爱心够了，收工！💝';
        btn.addEventListener('click', function () {
          popup.classList.add('bday-popup--done');
          setTimeout(function () { popup.remove(); overlay.remove(); }, 800);
        });
      });
    }

    setTimeout(function () {
      popup.classList.add('bday-popup--show');
    }, 400);
  }

  // ---- 部门周年弹窗 ----
  function showAnniversary(years, diff) {
    var overlay = document.createElement('div');
    overlay.className = 'bday-overlay';
    document.body.appendChild(overlay);

    var popup = document.createElement('div');
    popup.className = 'bday-popup';

    var isToday = diff === 0;
    var emoji = isToday ? '🏢🎉' : '🏢';
    var title = isToday
      ? '生活部成立 ' + years +  ' 周年快乐！'
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
      '<p class="bday-sub" style="font-size:.8rem;opacity:.7;">' +
        '冰和姜选择留部 → 线上面试 → 群聊建立 → 第一次团建 → 三年陪伴</p>' +
      '<div class="bday-cake">' +
        '<div class="cake-body"></div>' +
        '<div class="cake-candle"><div class="flame"></div></div>' +
      '</div>' +
      '<button class="bday-btn">' + (isToday ? '庆祝 🎊' : '提前庆祝 🎊') + '</button>';

    document.body.appendChild(popup);

    var btn = popup.querySelector('.bday-btn');
    btn.addEventListener('click', function () {
      spawnHearts();
      spawnHearts(); // 周年双倍爱心
      popup.classList.add('bday-popup--done');
      setTimeout(function () { popup.remove(); overlay.remove(); }, 800);
    });

    setTimeout(function () {
      popup.classList.add('bday-popup--show');
    }, 500);
  }

  // ---- 爱心雨 ----
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

  // ---- 样式注入 ----
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
