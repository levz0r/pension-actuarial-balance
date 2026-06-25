/* global Chart */
// Actuarial-balance chart for Israeli pension funds.
// Loads pension_actuarial_balance.csv at runtime (single source of truth),
// renders a Chart.js line chart, linked type/company filters, and a live
// comparison table of whatever funds are currently shown.

// id -> {co: company, t: makifa|klalit, legacy: brand merged away}
const META = {
 "162":{co:"מגדל",t:"makifa"}, "659":{co:"מגדל",t:"klalit"},
 "163":{co:"מיטב",t:"makifa"}, "660":{co:"מיטב",t:"klalit"},
 "1032":{co:"מיטב",t:"makifa",legacy:true}, "1177":{co:"מיטב",t:"klalit",legacy:true},
 "168":{co:"מנורה",t:"makifa"}, "665":{co:"מנורה",t:"klalit"},
 "170":{co:"כלל",t:"makifa"}, "667":{co:"כלל",t:"klalit"},
 "209":{co:"הפניקס",t:"makifa"}, "671":{co:"הפניקס",t:"klalit"},
 "214":{co:"הראל",t:"makifa"}, "662":{co:"הראל",t:"klalit"},
 "1328":{co:"אלטשולר שחם",t:"makifa"}, "1329":{co:"אלטשולר שחם",t:"klalit"},
 "13908":{co:"מור",t:"makifa"}, "13918":{co:"מור",t:"klalit"},
 "14036":{co:"אינפיניטי",t:"makifa"}, "14044":{co:"אינפיניטי",t:"klalit"},
 "1531":{co:"פסגות",t:"makifa",legacy:true}, "1532":{co:"פסגות",t:"klalit",legacy:true},
};
const COMPANIES = ["מגדל","מיטב","מנורה","כלל","הפניקס","הראל","אלטשולר שחם","מור","אינפיניטי","פסגות"];
const CO_COLOR = {
 "מגדל":"#0d3b66","מיטב":"#e63946","מנורה":"#2a9d8f","כלל":"#e76f51","הפניקס":"#6a4c93",
 "הראל":"#bc6c25","אלטשולר שחם":"#3a86ff","מור":"#8338ec","אינפיניטי":"#ff006e","פסגות":"#588157"
};
const MAIN6_COS = ["מגדל","מיטב","מנורה","כלל","הפניקס","הראל"];

let chart;
let typeFilter = "all";          // 'all' | 'makifa' | 'klalit'
let activeCos = new Set();       // companies currently shown (row 2)

const typePass = d => typeFilter==="makifa" ? d._t==="makifa"
                    : typeFilter==="klalit" ? d._t==="klalit" : true;
const eqSet = (a,b) => a.size===b.size && [...a].every(x=>b.has(x));
const showable = d => typePass(d) && (typeFilter==="all" || !d._legacy);   // legacy brands only in "הצג הכל"
function cosForType(){ const s=new Set(); chart.data.datasets.forEach(d=>{ if(showable(d)) s.add(d._co); }); return s; }

async function init(){
  let text;
  try{ text = await (await fetch("pension_actuarial_balance.csv")).text(); }
  catch(e){ document.getElementById("stats").innerHTML =
    '<div class="muted">לא ניתן לטעון את קובץ הנתונים. יש לפתוח את העמוד דרך שרת (למשל GitHub Pages) ולא כקובץ מקומי.</div>'; return; }

  const rows = text.trim().split(/\r?\n/).map(r=>r.split(","));
  const header = rows[0];
  const labels = rows.slice(1).map(r=>r[0]);
  const fundCols = header.slice(1);
  const idOf = l => (l.match(/\[(\d+)\]/)||[])[1];

  const datasets = fundCols.map((label,i)=>{
    const id=idOf(label), m=META[id]||{co:"?",t:"makifa"};
    const dash = m.legacy ? [2,3] : (m.t==="klalit" ? [7,4] : []);
    return {
      label, _id:id, _co:m.co, _t:m.t, _legacy:!!m.legacy,
      data: rows.slice(1).map(r => r[i+1]===""||r[i+1]===undefined ? null : parseFloat(r[i+1])),
      borderColor: CO_COLOR[m.co]||"#888", backgroundColor: CO_COLOR[m.co]||"#888",
      borderDash: dash, borderWidth: m.legacy?1.5:2,
      pointRadius: 2.4, pointHoverRadius: 5, spanGaps: true, tension: 0.25
    };
  });
  const order = id => { const m=META[id]||{}; return COMPANIES.indexOf(m.co)*10 + (m.t==="klalit"?1:0) + (m.legacy?2:0); };
  datasets.sort((a,b)=>order(a._id)-order(b._id));

  chart = new Chart(document.getElementById("chart"), {
    type:"line", data:{labels, datasets},
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:"nearest",intersect:false},
      plugins:{
        legend:{position:"right", labels:{boxWidth:14,font:{size:11},usePointStyle:true},
          onClick:(e,item,legend)=>{ Chart.defaults.plugins.legend.onClick(e,item,legend); renderStats(); }},
        tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.y}%`}}
      },
      scales:{
        y:{title:{display:true,text:"איזון אקטוארי (%)"},ticks:{stepSize:0.1,callback:v=>Number(v).toFixed(2)+"%"},grid:{color:"#eceff2"}},
        x:{grid:{display:false}}
      }
    }
  });

  buildControls();
  applyPreset("all");
}

function buildControls(){
  document.querySelectorAll("button.flt").forEach(b=>b.addEventListener("click",()=>applyPreset(b.dataset.f)));
  const coRow = document.getElementById("coRow");
  COMPANIES.forEach(co=>{
    const b=document.createElement("button");
    b.className="co"; b.textContent=co; b.dataset.co=co;
    b.style.borderColor=CO_COLOR[co];
    b.addEventListener("click",()=>toggleCo(co));
    coRow.appendChild(b);
  });
}

// Row 1 (תצוגה): sets the type filter and SYNCS row 2 to the companies shown.
function applyPreset(f){
  if(f==="main6"){ typeFilter="makifa"; activeCos=new Set(MAIN6_COS); }
  else { typeFilter=f; activeCos=cosForType(); }
  render();
}

// Row 2 (לפי חברה): multi-select toggle; keeps the active type filter.
function toggleCo(co){
  if(activeCos.has(co)) activeCos.delete(co); else activeCos.add(co);
  if(activeCos.size===0){ applyPreset("all"); return; }
  render();
}

function render(){
  chart.data.datasets.forEach(d=> d.hidden = !(showable(d) && activeCos.has(d._co)));
  chart.update();

  // Row 1 reflects the TYPE being viewed; it stays lit while companies are trimmed in row 2.
  // (main6 is a type+company combo, so it only lights on its exact state.)
  let preset;
  if(typeFilter==="makifa" && eqSet(activeCos,new Set(MAIN6_COS))) preset="main6";
  else if(typeFilter==="makifa") preset="makifa";
  else if(typeFilter==="klalit") preset="klalit";
  else preset="all";
  document.querySelectorAll("button.flt").forEach(b=>b.classList.toggle("active",b.dataset.f===preset));

  // Row 2 highlight reflects the companies shown.
  document.querySelectorAll("button.co").forEach(b=>{
    const on=activeCos.has(b.dataset.co);
    b.classList.toggle("active",on);
    b.style.background = on ? CO_COLOR[b.dataset.co] : "#fff";
    b.style.color = on ? "#fff" : CO_COLOR[b.dataset.co];
  });

  renderStats();
}

// Comparison table of the funds currently visible on the chart.
function renderStats(){
  const vis=chart.data.datasets.filter(d=>!d.hidden);
  const fmt=(x,d=2)=>(x>=0?"+":"")+x.toFixed(d);
  const cls=x=>x>0?"pos":(x<0?"neg":"");
  const stats=vis.map(d=>{
    const v=d.data.filter(x=>x!=null);
    if(!v.length) return null;
    const sum=v.reduce((a,b)=>a+b,0), mean=sum/v.length;
    const sd=Math.sqrt(v.reduce((a,b)=>a+(b-mean)**2,0)/v.length);
    return {d, n:v.length, sum, mean, sd, pos:v.filter(x=>x>0).length, best:Math.max(...v), worst:Math.min(...v)};
  }).filter(Boolean).sort((a,b)=>b.sum-a.sum);

  const el=document.getElementById("stats");
  if(!stats.length){ el.innerHTML=""; return; }
  const head=`<tr><th>קרן</th><th>רבעונים</th><th>מצטבר %</th><th>ממוצע לרבעון %</th><th>תנודתיות (ס״ת)</th><th>רבעונים חיוביים</th><th>שיא חיובי</th><th>שפל</th></tr>`;
  const body=stats.map(r=>`<tr>
    <td><span class="sw" style="background:${r.d.borderColor}"></span>${r.d.label}</td>
    <td>${r.n}</td>
    <td class="${cls(r.sum)}">${fmt(r.sum)}</td>
    <td class="${cls(r.mean)}">${fmt(r.mean,3)}</td>
    <td>${r.sd.toFixed(3)}</td>
    <td>${r.pos}/${r.n}</td>
    <td class="pos">${fmt(r.best)}</td>
    <td class="neg">${fmt(r.worst)}</td></tr>`).join("");
  el.innerHTML=`<h3>השוואת הקרנות המוצגות (${stats.length})</h3>
    <div class="muted">מחושב על רבעונים עם נתונים בלבד · ערך גבוה יותר = איזון אקטוארי טוב יותר · ממוין לפי מצטבר</div>
    <table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

init();
