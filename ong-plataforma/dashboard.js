(() => {
  // ---- Storage util isolado (sem poluir o escopo global) ----
  const dbUtil = {
    get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
    set(key, value){ localStorage.setItem(key, JSON.stringify(value)) }
  };
  const KEYS = { projects:'ngo_projects', activities:'ngo_activities', volunteers:'ngo_volunteers', donations:'ngo_donations' };

  // ---- Acessibilidade: live region ----
  function announce(msg){
    const live = document.getElementById('sr-updates') || (parent && parent.document && parent.document.getElementById && parent.document.getElementById('sr-updates'));
    if(live){ live.textContent = msg }
  }
  function byId(id){ return document.getElementById(id) }

  // ---- Tema & Alto contraste (em <html> e <body>, respectivamente) ----
  function themeToggleInit(){
    const KEY = 'theme_dark';
    const toggles = Array.from(document.querySelectorAll('#themeToggle, #themeToggleFooter'));
    if(localStorage.getItem(KEY) === null){
      localStorage.setItem(KEY, JSON.stringify(true)); // padrão: escuro
    }
    const apply = () => {
      const dark = JSON.parse(localStorage.getItem(KEY) ?? 'true');
      document.documentElement.classList.toggle('theme-light', !dark);
      document.body.classList.remove('theme-light'); // evita conflito
      toggles.forEach(btn => btn && btn.setAttribute('aria-pressed', (!dark).toString()));
    };
    toggles.forEach(btn => btn && btn.addEventListener('click', () => {
      const dark = JSON.parse(localStorage.getItem(KEY) ?? 'true');
      localStorage.setItem(KEY, JSON.stringify(!dark));
      apply();
      announce(`Tema ${JSON.parse(localStorage.getItem(KEY)) ? 'escuro' : 'claro'} ativado`);
    }));
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
    buttons.forEach(btn => btn && btn.addEventListener('click', () => {
      const on = JSON.parse(localStorage.getItem(KEY) ?? 'false');
      localStorage.setItem(KEY, JSON.stringify(!on));
      apply();
      announce(`Alto contraste ${JSON.parse(localStorage.getItem(KEY)) ? 'ativado' : 'desativado'}`);
    }));
    apply();
  }
  // Disponibiliza para o HTML caso seja preciso
  window.themeToggleInit = themeToggleInit;
  window.contrastToggleInit = contrastToggleInit;

  // ---- Componente Alpine ----
  function dashboard(){
    // semente inicial (uma vez só)
    if(!dbUtil.get(KEYS.projects, null)){
      const projects = [
        { id: crypto.randomUUID(), name: "Cestas Básicas", status:"Ativo", goal: 15000, raised: 4200, cover:"assets/img/project1.svg", excerpt:"Ajude famílias em situação de vulnerabilidade.", createdAt: Date.now() },
        { id: crypto.randomUUID(), name: "Aulas de Reforço", status:"Ativo", goal: 8000, raised: 2750, cover:"assets/img/project2.svg", excerpt:"Reforço escolar gratuito para crianças.", createdAt: Date.now() },
        { id: crypto.randomUUID(), name: "Mutirão Saúde", status:"Planejado", goal: 12000, raised: 500, cover:"assets/img/project3.svg", excerpt:"Atendimento básico e orientações de saúde.", createdAt: Date.now() }
      ];
      const activities = [
        { id: crypto.randomUUID(), title:"Entrega de cestas", date: new Date().toISOString().slice(0,10), owner:"Equipe A", status:"Aberta"},
        { id: crypto.randomUUID(), title:"Seleção de voluntários", date: new Date(Date.now()+86400000).toISOString().slice(0,10), owner:"RH", status:"Aberta"}
      ];
      const volunteers = [
        { id: crypto.randomUUID(), name:"Ana Silva", email:"ana@exemplo.com", interest:"Educação", availability:"Finais de semana"},
        { id: crypto.randomUUID(), name:"João Souza", email:"joao@exemplo.com", interest:"Comunidade", availability:"Noites"}
      ];
      const donations = [
        { id: crypto.randomUUID(), projectId: projects[0].id, donor:"Anônimo", value:100, date: Date.now()-1000*60*60*24*15 },
        { id: crypto.randomUUID(), projectId: projects[1].id, donor:"Carla", value:250, date: Date.now()-1000*60*60*24*8 }
      ];
      dbUtil.set(KEYS.projects, projects);
      dbUtil.set(KEYS.activities, activities);
      dbUtil.set(KEYS.volunteers, volunteers);
      dbUtil.set(KEYS.donations, donations);
    }

    return {
      // estado
      projects: dbUtil.get(KEYS.projects, []),
      activities: dbUtil.get(KEYS.activities, []),
      volunteers: dbUtil.get(KEYS.volunteers, []),
      donations: dbUtil.get(KEYS.donations, []),
      projectQuery: '',

      // ciclo de vida
      init(){
  window.__dashRef = this;

  this.renderProjects();
  this.renderActivities();
  this.renderVolunteers();
  this.renderDonations();
  this.populateDonationProjects();
  this.drawDonationChart();

  themeToggleInit();
  contrastToggleInit();
},


      // util persistência
      sync(){
        dbUtil.set(KEYS.projects,this.projects);
        dbUtil.set(KEYS.activities,this.activities);
        dbUtil.set(KEYS.volunteers,this.volunteers);
        dbUtil.set(KEYS.donations,this.donations);
        this.drawDonationChart();
      },

      // export/import JSON
      exportData(){
        const data = {
          projects: this.projects,
          activities: this.activities,
          volunteers: this.volunteers,
          donations: this.donations
        };
        const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'ong-dados.json'; a.click();
        URL.revokeObjectURL(url);
        announce('Backup exportado.');
      },
      importData(evt){
        const file = evt.target.files && evt.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try{
            const json = JSON.parse(reader.result);
            this.projects = Array.isArray(json.projects) ? json.projects : [];
            this.activities = Array.isArray(json.activities) ? json.activities : [];
            this.volunteers = Array.isArray(json.volunteers) ? json.volunteers : [];
            this.donations = Array.isArray(json.donations) ? json.donations : [];
            this.sync(); this.renderProjects(); this.renderActivities(); this.renderVolunteers(); this.renderDonations(); this.populateDonationProjects();
            announce('Dados importados com sucesso.');
          }catch(e){
            alert('Arquivo inválido.');
          }
        };
        reader.readAsText(file);
      },

      // charts
      drawDonationChart(){
        const ctx = document.getElementById('donationChart');
        if(!ctx || typeof Chart === 'undefined') return;
        const now = new Date(), labels=[], series=[];
        for(let i=11;i>=0;i--){
          const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
          labels.push(d.toLocaleDateString('pt-BR',{month:'short'}));
          const m = d.getMonth(), y = d.getFullYear();
          const sum = this.donations.filter(x => { const dx=new Date(x.date); return dx.getMonth()===m && dx.getFullYear()===y }).reduce((a,b)=>a+b.value,0);
          series.push(sum);
        }
        if(this._chart){ this._chart.destroy() }
        this._chart = new Chart(ctx, {
          type:'line',
          data:{ labels, datasets:[{ label:'Doações (R$)', data:series, tension:.35, fill:true, pointRadius:0, pointHoverRadius:5, borderWidth:2 }]},
          options:{ plugins:{legend:{display:false}, decimation:{enabled:true, algorithm:'lttb'}}, scales:{y:{beginAtZero:true}}, interaction:{mode:'nearest',intersect:false} }
        });
      },

      // filtros
      filterProjects(){ this.renderProjects() },

      // CRUD Projetos
      openProjectForm(p=null){
        const isEdit=!!p;
        const html=`
          <div class="grid cols-2">
            <label for="fName">Nome do projeto</label>
            <input id="fName" class="input" placeholder="Nome do projeto" value="${p? p.name:''}"/>
            <label for="fStatus">Status</label>
            <select id="fStatus" class="input">
              <option ${p&&p.status==='Ativo'?'selected':''}>Ativo</option>
              <option ${p&&p.status==='Planejado'?'selected':''}>Planejado</option>
              <option ${p&&p.status==='Concluído'?'selected':''}>Concluído</option>
            </select>
            <label for="fGoal">Meta (R$)</label>
            <input id="fGoal" type="number" min="0" class="input" placeholder="Meta (R$)" value="${p?p.goal:''}"/>
            <label for="fRaised">Arrecadado (R$)</label>
            <input id="fRaised" type="number" min="0" class="input" placeholder="Arrecadado (R$)" value="${p?p.raised:''}"/>
            <label for="fCover">Capa</label>
            <input id="fCover" class="input" placeholder="Capa (URL ou assets/img/project1.svg)" value="${p?p.cover:'assets/img/project1.svg'}"/>
            <label for="fExcerpt">Resumo</label>
            <input id="fExcerpt" class="input" placeholder="Resumo do projeto" value="${p?p.excerpt:''}"/>
          </div>
          <div style="margin-top:12px;display:flex;gap:10px">
            <button class="btn primary" id="saveBtn">${isEdit?'Salvar':'Criar'}</button>
          </div>`;
        openModal(isEdit?'Editar Projeto':'Novo Projeto', html);
        document.getElementById('saveBtn').onclick=()=>{
          const item={ id:p?.id ?? crypto.randomUUID(), name:byId('fName').value.trim(), status:byId('fStatus').value, goal:Number(byId('fGoal').value||0), raised:Number(byId('fRaised').value||0), cover:byId('fCover').value.trim(), excerpt:byId('fExcerpt').value.trim(), createdAt:p?.createdAt ?? Date.now() };
          if(!item.name){ alert('Informe o nome do projeto.'); return }
          if(isEdit){ this.projects=this.projects.map(x=>x.id===item.id?item:x) } else { this.projects.push(item) }
          this.sync(); this.renderProjects(); this.populateDonationProjects(); announce('Projeto salvo com sucesso'); closeModal();
        };
      },
      deleteProject(id){
        if(!confirm('Excluir este projeto?')) return;
        this.projects=this.projects.filter(x=>x.id!==id);
        this.donations=this.donations.filter(d=>d.projectId!==id);
        this.sync(); this.renderProjects(); this.renderDonations(); this.populateDonationProjects(); announce('Projeto excluído');
      },
      renderProjects(){
        const body = byId('projectTableBody');
        const q=(this.projectQuery||'').toLowerCase();
        const rows = this.projects
          .filter(p => p.name.toLowerCase().includes(q) || p.status.toLowerCase().includes(q))
          .sort((a,b)=> b.createdAt - a.createdAt)
          .map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.status}</td>
              <td>R$ ${p.goal.toLocaleString('pt-BR')}</td>
              <td>R$ ${p.raised.toLocaleString('pt-BR')}</td>
              <td>
                <button class="btn" aria-label="Editar projeto ${p.name}" onclick='window.__dash.openProjectForm(${JSON.stringify(p)})'>Editar</button>
                <button class="btn" aria-label="Excluir projeto ${p.name}" onclick="window.__dash.deleteProject('${p.id}')">Excluir</button>
              </td>
            </tr>`).join('');
        body.innerHTML = rows || '<tr><td colspan="5">Nenhum projeto encontrado.</td></tr>';
      },

      // CRUD Atividades
      openActivityForm(a=null){
        const isEdit=!!a;
        const html=`
          <div class="grid cols-2">
            <label for="aTitle">Título</label>
            <input id="aTitle" class="input" placeholder="Título" value="${a?a.title:''}"/>
            <label for="aDate">Data</label>
            <input id="aDate" type="date" class="input" value="${a?a.date:''}"/>
            <label for="aOwner">Responsável</label>
            <input id="aOwner" class="input" placeholder="Responsável" value="${a?a.owner:''}"/>
            <label for="aStatus">Status</label>
            <select id="aStatus" class="input">
              <option ${a&&a.status==='Aberta'?'selected':''}>Aberta</option>
              <option ${a&&a.status==='Fechada'?'selected':''}>Fechada</option>
            </select>
          </div>
          <div style="margin-top:12px;display:flex;gap:10px">
            <button class="btn primary" id="saveAct">${isEdit?'Salvar':'Criar'}</button>
          </div>`;
        openModal(isEdit?'Editar Atividade':'Nova Atividade', html);
        byId('saveAct').onclick=()=>{
          const item={ id:a?.id ?? crypto.randomUUID(), title:byId('aTitle').value.trim(), date:byId('aDate').value, owner:byId('aOwner').value.trim(), status:byId('aStatus').value };
          if(!item.title || !item.date){ alert('Informe título e data.'); return }
          if(isEdit){ this.activities=this.activities.map(x=>x.id===item.id?item:x) } else { this.activities.push(item) }
          this.sync(); this.renderActivities(); announce('Atividade salva'); closeModal();
        };
      },
      deleteActivity(id){
        if(!confirm('Excluir esta atividade?')) return;
        this.activities=this.activities.filter(x=>x.id!==id); this.sync(); this.renderActivities(); announce('Atividade excluída');
      },
      renderActivities(){
        const body = byId('activityTableBody');
        const rows = this.activities
          .sort((a,b)=> a.date.localeCompare(b.date))
          .map(a => `
            <tr>
              <td>${a.title}</td>
              <td>${a.date}</td>
              <td>${a.owner}</td>
              <td>${a.status}</td>
              <td>
                <button class="btn" aria-label="Editar atividade ${a.title}" onclick='window.__dash.openActivityForm(${JSON.stringify(a)})'>Editar</button>
                <button class="btn" aria-label="Excluir atividade ${a.title}" onclick="window.__dash.deleteActivity('${a.id}')">Excluir</button>
              </td>
            </tr>`).join('');
        body.innerHTML = rows || '<tr><td colspan="5">Sem atividades.</td></tr>';
      },

      // CRUD Voluntários
      openVolunteerForm(v=null){
        const isEdit=!!v;
        const html=`
          <div class="grid cols-2">
            <label for="vName">Nome</label>
            <input id="vName" class="input" placeholder="Nome" value="${v?v.name:''}"/>
            <label for="vEmail">Email</label>
            <input id="vEmail" class="input" placeholder="Email" value="${v?v.email:''}"/>
            <label for="vInterest">Interesse</label>
            <input id="vInterest" class="input" placeholder="Interesse" value="${v?v.interest:''}"/>
            <label for="vAvail">Disponibilidade</label>
            <input id="vAvail" class="input" placeholder="Disponibilidade" value="${v?v.availability:''}"/>
          </div>
          <div style="margin-top:12px;display:flex;gap:10px">
            <button class="btn primary" id="saveVol">${isEdit?'Salvar':'Adicionar'}</button>
          </div>`;
        openModal(isEdit?'Editar Voluntário':'Novo Voluntário', html);
        byId('saveVol').onclick=()=>{
          const item={ id:v?.id ?? crypto.randomUUID(), name:byId('vName').value.trim(), email:byId('vEmail').value.trim(), interest:byId('vInterest').value.trim(), availability:byId('vAvail').value.trim() };
          if(!item.name || !item.email){ alert('Informe nome e email.'); return }
          if(isEdit){ this.volunteers=this.volunteers.map(x=>x.id===item.id?item:x) } else { this.volunteers.push(item) }
          this.sync(); this.renderVolunteers(); announce('Voluntário salvo'); closeModal();
        };
      },
      deleteVolunteer(id){
        if(!confirm('Excluir este voluntário?')) return;
        this.volunteers=this.volunteers.filter(x=>x.id!==id); this.sync(); this.renderVolunteers(); announce('Voluntário excluído');
      },
      renderVolunteers(){
        const body = byId('volTableBody');
        const rows = this.volunteers
          .sort((a,b)=> a.name.localeCompare(b.name))
          .map(v => `
            <tr>
              <td>${v.name}</td>
              <td>${v.email}</td>
              <td>${v.interest}</td>
              <td>${v.availability}</td>
              <td>
                <button class="btn" aria-label="Editar voluntário ${v.name}" onclick='window.__dash.openVolunteerForm(${JSON.stringify(v)})'>Editar</button>
                <button class="btn" aria-label="Excluir voluntário ${v.name}" onclick="window.__dash.deleteVolunteer('${v.id}')">Excluir</button>
              </td>
            </tr>`).join('');
        body.innerHTML = rows || '<tr><td colspan="5">Sem voluntários.</td></tr>';
      },

      // Doações
      populateDonationProjects(){
        const sel = byId('donProject'); if(!sel) return;
        sel.innerHTML = this.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      },
      addDonation(){
        const projectId = byId('donProject').value;
        const donor = byId('donName').value || 'Anônimo';
        const value = Number(byId('donValue').value||0);
        if(!projectId || value<=0){ alert('Informe um projeto e o valor.'); return }
        const donation = { id: crypto.randomUUID(), projectId, donor, value, date: Date.now() };
        this.donations.push(donation);
        this.projects = this.projects.map(p => p.id===projectId ? {...p, raised: (p.raised||0)+value} : p);
        this.sync(); this.renderDonations(); this.renderProjects(); this.populateDonationProjects();
        byId('donName').value=''; byId('donValue').value='';
        announce('Doação registrada');
      },
      renderDonations(){
        const body = byId('donTableBody');
        const rows = this.donations
          .sort((a,b)=> b.date - a.date)
          .map(d => {
            const p = this.projects.find(p=>p.id===d.projectId);
            return `<tr><td>${p? p.name:'—'}</td><td>${d.donor}</td><td>${d.value.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td>${new Date(d.date).toLocaleString('pt-BR')}</td></tr>`;
          }).join('');
        body.innerHTML = rows || '<tr><td colspan="4">Sem doações.</td></tr>';
      }
    };
  }

  // Expor o componente no escopo global p/ x-data="dashboard()"
  window.dashboard = dashboard;

  // Modal acessível (fora do componente para reuso)
  let __lastFocused = null; let __trapHandler = null;
  function focusable(container){
    return [...container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  }
  window.openModal = function(title, bodyHtml){
    const modal = byId('modal');
    byId('modalTitle').textContent = title;
    byId('modalBody').innerHTML = bodyHtml;
    __lastFocused = document.activeElement;
    modal.style.display = 'flex';
    const elements = focusable(modal);
    const first = elements[0], last = elements[elements.length - 1];
    if(first) first.focus();
    __trapHandler = (e) => {
      if(e.key === 'Escape'){ e.preventDefault(); closeModal(); return }
      if(e.key === 'Tab'){
        if(elements.length === 0){ e.preventDefault(); return }
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', __trapHandler);
  };
  window.closeModal = function(){
    const modal = byId('modal');
    modal.style.display = 'none';
    document.removeEventListener('keydown', __trapHandler);
    if(__lastFocused) __lastFocused.focus();
  };
})();

// Bridge global para acionar métodos do componente Alpine a partir de HTML dinâmico
(function(){
  function getComp(){
    const el = document.querySelector('[x-data]');
    return el && el.__x && el.__x.$data ? el.__x.$data : null; // instancia Alpine
  }
  // Bridge global: delega para a instância do Alpine guardada em window.__dashRef
window.__dash = {
  openProjectForm : (p)  => window.__dashRef?.openProjectForm(p),
  deleteProject   : (id) => window.__dashRef?.deleteProject(id),
  openActivityForm: (a)  => window.__dashRef?.openActivityForm(a),
  deleteActivity  : (id) => window.__dashRef?.deleteActivity(id),
  openVolunteerForm:(v)  => window.__dashRef?.openVolunteerForm(v),
  deleteVolunteer : (id) => window.__dashRef?.deleteVolunteer(id),
};

})();

