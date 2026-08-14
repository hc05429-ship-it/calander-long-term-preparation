/* ============================================================
   layout.js — 版面重組層（第二階段）
   用法：在 index.html 的 </body> 之前加入
       <script src="layout.js"></script>
   必須放在原本的 <script> 之後（等原程式初始化完成再搬）。

   原理：只用 appendChild 搬動「既有節點」到新的容器裡。
   appendChild 是移動而非複製，所有已綁定的事件監聽、
   id、class、內容一律原封不動保留。
   完全不使用 innerHTML 重建，不改名，不刪節點。

   移除那一行 <script> 即完全還原。
   ============================================================ */

(function () {
  "use strict";

  function boot() {
    var vCal = document.getElementById("vCal");
    if (!vCal || vCal.querySelector(".ds-shell")) return;

    var kids = Array.prototype.slice.call(vCal.children);
    if (!kids.length) return;

    /* --- 找出要搬進側欄的節點 ---
       依原始順序：目標倒數列、D-Day 表單、D-Day 清單、
                   產能設定列、考試凍結區標題、凍結區卡片。
       用 id 與內容比對，避免寫死索引。 */
    var ddayBar   = vCal.querySelector(".sortbar");
    var ddayForm  = document.getElementById("ddayForm");
    var ddayList  = document.getElementById("ddayList");
    var capRow    = vCal.querySelector(".dday-row");
    var freezeBox = document.getElementById("freezeBox");
    var freezeHd  = freezeBox ? freezeBox.previousElementSibling : null;

    if (!ddayBar || !capRow || !freezeBox) return;

    /* --- 建立外框 --- */
    var shell = document.createElement("div");
    shell.className = "ds-shell";

    var side = document.createElement("aside");
    side.className = "ds-side";

    var main = document.createElement("div");
    main.className = "ds-main";

    var sideSet = [ddayBar, ddayForm, ddayList, capRow, freezeHd, freezeBox];

    /* --- 先把非側欄節點搬進 main（維持原順序） --- */
    kids.forEach(function (el) {
      if (sideSet.indexOf(el) < 0) main.appendChild(el);
    });

    /* --- 側欄上半：目標倒數 --- */
    [ddayBar, ddayForm, ddayList].forEach(function (el) {
      if (el) side.appendChild(el);
    });

    /* --- 側欄下半：可摺疊的「設定」 --- */
    var setWrap = document.createElement("div");
    setWrap.className = "ds-settings";

    var setHead = document.createElement("button");
    setHead.type = "button";
    setHead.className = "ds-set-h closed";
    setHead.setAttribute("aria-expanded", "false");
    setHead.innerHTML = '<span class="ds-set-t">設定</span><span class="ds-set-cv">▾</span>';

    var setBody = document.createElement("div");
    setBody.className = "ds-set-b";
    setBody.hidden = true;

    [capRow, freezeHd, freezeBox].forEach(function (el) {
      if (el) setBody.appendChild(el);
    });

    setHead.addEventListener("click", function () {
      var open = setBody.hidden;
      setBody.hidden = !open;
      setHead.classList.toggle("closed", !open);
      setHead.setAttribute("aria-expanded", String(open));
      try { localStorage.setItem("studycal.settingsOpen", open ? "1" : "0"); } catch (e) {}
    });

    try {
      if (localStorage.getItem("studycal.settingsOpen") === "1") setHead.click();
    } catch (e) {}

    setWrap.appendChild(setHead);
    setWrap.appendChild(setBody);
    side.appendChild(setWrap);

    shell.appendChild(side);
    shell.appendChild(main);

    /* --- 側欄常駐：外框提到 .pad 層，三個分頁都包進 main --- */
    var pad = vCal.parentNode;
    pad.insertBefore(shell, vCal);
    main.appendChild(vCal);

    var vTask = document.getElementById("vTask");
    var vData = document.getElementById("vData");
    if (vTask) main.appendChild(vTask);
    if (vData) main.appendChild(vData);

    buildMilestoneTrack();

    document.documentElement.classList.add("ds-layout-on");
  }

  /* ------------------------------------------------------------
     硬里程碑：改為水平時間軸
     不動原本的 #hardMs（JS 照常重繪），只把它隱藏起來，
     在旁邊生一條軌道，用 MutationObserver 同步內容。
     ------------------------------------------------------------ */
  function buildMilestoneTrack() {
    var host = document.getElementById("hardMs");
    if (!host || document.querySelector(".ds-mstrack")) return;

    var track = document.createElement("div");
    track.className = "card ds-mstrack";
    host.parentNode.insertBefore(track, host);
    host.classList.add("ds-hidden-src");

    var hd = host.previousElementSibling;
    while (hd && hd !== track) hd = hd.previousElementSibling;
    hd = track.previousElementSibling;
    if (hd && hd.classList.contains("sect-h")) hd.classList.add("ds-hidden-src");

    function read() {
      return Array.prototype.map.call(host.querySelectorAll(".dc"), function (c) {
        var big = c.querySelector(".big");
        var txt = big ? big.textContent : "";
        var over = /已過/.test(txt);
        var left = parseInt((txt.match(/-?\d+/) || [0])[0], 10) * (over ? -1 : 1);
        var note = c.querySelector(".note");
        var noteTx = note ? note.textContent : "";
        var before = parseInt((noteTx.match(/考前\s*(\d+)/) || [0, 0])[1], 10);
        var date = (noteTx.match(/^[^（(]+/) || [""])[0].trim();
        var pill = c.querySelector(".pill");
        return {
          label: (c.querySelector(".dc-n") || {}).textContent || "",
          left: left,
          before: before,
          date: date,
          status: pill ? pill.textContent : "",
          color: pill ? pill.style.color : "",
          bg: pill ? pill.style.background : ""
        };
      });
    }

    function paint() {
      var ms = read();
      if (!ms.length) { track.hidden = true; return; }
      track.hidden = false;

      var total = Math.max(1, ms[0].left + ms[0].before);
      var html =
        '<div class="ds-ms-h">' +
          '<span class="ds-ms-t">硬里程碑（從考試日回推）</span>' +
          '<span class="ds-ms-d">這些日子推不到，後面全部會塌</span>' +
        "</div>" +
        '<div class="ds-ms-rail"><div class="ds-ms-line"></div>' +
        '<div class="ds-ms-now"></div><div class="ds-ms-end"></div>';

      ms.forEach(function (m) {
        var pct = Math.max(0, Math.min(100, (1 - m.left / total) * 100));
        html +=
          '<div class="ds-ms-pt" style="left:' + pct.toFixed(2) + '%">' +
            '<i style="background:' + (m.color || "var(--gk)") + '"></i>' +
            '<div class="ds-ms-lb">' +
              '<b>' + m.label + "</b>" +
              '<span class="ds-ms-n" style="color:' + (m.left < 0 ? "var(--red)" : "var(--ink)") + '">' +
                (m.left < 0 ? "已過 " + -m.left : m.left) + " 天</span>" +
              '<span class="ds-ms-dt">' + m.date + "</span>" +
            "</div>" +
          "</div>";
      });

      html +=
        "</div>" +
        '<div class="ds-ms-foot"><span>今天</span><span>考試日</span></div>';

      track.innerHTML = html;
    }

    paint();
    new MutationObserver(paint).observe(host, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})();
