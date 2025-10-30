
const db = {
  get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)) }
}
const KEYS = { projects:'ngo_projects', activities:'ngo_activities', volunteers:'ngo_volunteers', donations:'ngo_donations' }

function seedIfNeeded(){
  if(!db.get(KEYS.projects, null)){
    const projects = [
      { id: crypto.randomUUID(), name: "Cestas Básicas", status:"Ativo", goal: 15000, raised: 4200, cover:"assets/img/project1.svg", excerpt:"Ajude famílias em situação de vulnerabilidade.", createdAt: Date.now() },
      { id: crypto.randomUUID(), name: "Aulas de Reforço", status:"Ativo", goal: 8000, raised: 2750, cover:"assets/img/project2.svg", excerpt:"Reforço escolar gratuito para crianças.", createdAt: Date.now() },
      { id: crypto.randomUUID(), name: "Mutirão Saúde", status:"Planejado", goal: 12000, raised: 500, cover:"assets/img/project3.svg", excerpt:"Atendimento básico e orientações de saúde.", createdAt: Date.now() }
    ]
    const activities = [
      { id: crypto.randomUUID(), title:"Entrega de cestas", date: new Date().toISOString().slice(0,10), owner:"Equipe A", status:"Aberta"},
      { id: crypto.randomUUID(), title:"Seleção de voluntários", date: new Date(Date.now()+86400000).toISOString().slice(0,10), owner:"RH", status:"Aberta"}
    ]
    const volunteers = [
      { id: crypto.randomUUID(), name:"Ana Silva", email:"ana@exemplo.com", interest:"Educação", availability:"Finais de semana"},
      { id: crypto.randomUUID(), name:"João Souza", email:"joao@exemplo.com", interest:"Comunidade", availability:"Noites"}
    ]
    const donations = [
      { id: crypto.randomUUID(), projectId: projects[0].id, donor:"Anônimo", value:100, date: Date.now()-1000*60*60*24*15 },
      { id: crypto.randomUUID(), projectId: projects[1].id, donor:"Carla", value:250, date: Date.now()-1000*60*60*24*8 }
    ]
    db.set(KEYS.projects, projects)
    db.set(KEYS.activities, activities)
    db.set(KEYS.volunteers, volunteers)
    db.set(KEYS.donations, donations)
  }
}

function byId(id){ return document.getElementById(id) }
function announce(msg){ const live = document.getElementById('sr-updates'); if(live){ live.textContent = msg } }

function renderLanding(){
  const projects   = db.get(KEYS.projects, []);
  const activities = db.get(KEYS.activities, []);
  const volunteers = db.get(KEYS.volunteers, []);
  const donations  = db.get(KEYS.donations, []);

  // helper: escreve se existir
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('kpiProjects',   projects.length);
  setText('kpiActivities', activities.length);
  setText('kpiVolunteers', volunteers.length);
  setText('kpiDonations',  donations.reduce((a,b)=>a+b.value,0)
          .toLocaleString('pt-BR',{minimumFractionDigits:2}));

  const grid = document.getElementById('projectGrid');
  if (!grid) return;

  grid.innerHTML = projects.map(p => `
    <article class="card" role="listitem" style="overflow:hidden">
      <img src="${p.cover}" alt="${p.name}"
           style="width:100%;height:160px;object-fit:cover;border-bottom:1px solid rgba(148,163,184,.35)"/>
      <div style="padding:14px">
        <h3 style="margin:0 0 6px">${p.name}</h3>
        <p style="color:#cbd5e1;margin:0 0 8px">${p.excerpt}</p>
        <div class="badge">Status: ${p.status}</div>
        <div style="margin-top:10px;display:flex;gap:10px;align-items:center"
             aria-label="Progresso de arrecadação para ${p.name}">
          <div style="height:8px;background:#0b132b;border:1px solid rgba(148,163,184,.6);
                      border-radius:999px;flex:1;overflow:hidden">
            <div style="height:100%;background:linear-gradient(135deg,#22d3ee,#818cf8);
                        width:${Math.min(100, Math.round((p.raised/p.goal)*100))}%;">
            </div>
          </div>
          <small>${Math.round((p.raised/p.goal)*100)}%</small>
        </div>
        <div class="cta" style="margin-top:10px">
          <a class="btn" href="dashboard.html" aria-label="Abrir ${p.name} no dashboard">Gerenciar</a>
        </div>
      </div>
    </article>
  `).join('');
}

function themeToggleInit(){
  const KEY = 'theme_dark';
  const toggles = Array.from(document.querySelectorAll('#themeToggle, #themeToggleFooter'));
  if(localStorage.getItem(KEY) === null){
    localStorage.setItem(KEY, JSON.stringify(true)); // default dark
  }
  const apply = () => {
    const dark = JSON.parse(localStorage.getItem(KEY) ?? 'true');
    const root = document.documentElement;
    root.classList.toggle('theme-light', !dark);
    document.body.classList.remove('theme-light');
    toggles.forEach(btn => btn && btn.setAttribute('aria-pressed', (!dark).toString()));
  };
  toggles.forEach(btn => {
    btn && btn.addEventListener('click', () => {
      const dark = JSON.parse(localStorage.getItem(KEY) ?? 'true');
      localStorage.setItem(KEY, JSON.stringify(!dark));
      apply();
      announce(`Tema ${JSON.parse(localStorage.getItem(KEY)) ? 'escuro' : 'claro'} ativado`);
    });
  });
  apply();
}
function contrastToggleInit(){
  const KEY = 'contrast_high';
  const buttons = Array.from(document.querySelectorAll('#contrastToggle, #contrastToggleFooter'));
  const apply = () => {
    const on = JSON.parse(localStorage.getItem(KEY) ?? 'false');
    document.body.classList.toggle('contrast-high', on);
    buttons.forEach(b => b && b.setAttribute('aria-pressed', on.toString()));
  };
  buttons.forEach(btn => {
    btn && btn.addEventListener('click', () => {
      const on = JSON.parse(localStorage.getItem(KEY) ?? 'false');
      localStorage.setItem(KEY, JSON.stringify(!on));
      apply();
      announce(`Alto contraste ${JSON.parse(localStorage.getItem(KEY)) ? 'ativado' : 'desativado'}`);
    });
  });
  apply();
}

seedIfNeeded()
document.addEventListener('DOMContentLoaded', () => {
  renderLanding()
  const main = document.getElementById('conteudo-principal')
  document.querySelectorAll('.skip-link').forEach(a => { a.addEventListener('click', () => { setTimeout(() => main && main.focus(), 0) }) })
  themeToggleInit(); contrastToggleInit();
})
