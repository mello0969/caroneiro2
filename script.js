// Shared script for multi-page VivaMundo prototype
const VM = {
  init(){
    this.setupStorage();
    this.bind();
    this.checkAuthState();
  },
  
  setupStorage(){
    if(!localStorage.getItem('vm_users')){
      const users = [{id:'u1', name:'Ana Silva', email:'ana@ex.com', pass:'1234', bio:'Aventureira', avatar:'A', photos:[] }];
      localStorage.setItem('vm_users', JSON.stringify(users));
    }
    if(!localStorage.getItem('vm_groups')) localStorage.setItem('vm_groups', JSON.stringify([]));
    if(!localStorage.getItem('vm_sessions')) localStorage.setItem('vm_sessions', JSON.stringify(null));
  },
  
  bind(){
    const searchHomeBtn = document.getElementById('search-home-btn');
    if(searchHomeBtn) searchHomeBtn.addEventListener('click', ()=> this.searchDestinations());
    
    const btnNewGroupMain = document.getElementById('btn-new-group-main');
    if(btnNewGroupMain) btnNewGroupMain.addEventListener('click', ()=> this.openCreateGroup());
    
    const groupSearchMain = document.getElementById('group-search-main');
    if(groupSearchMain) groupSearchMain.addEventListener('input', (e)=> this.renderGroups(e.target.value));
    
    const signupForm = document.getElementById('signup-form');
    if(signupForm) signupForm.addEventListener('submit', (e)=> this.handleSignup(e));
    
    const profileEditForm = document.getElementById('profile-edit-form');
    if(profileEditForm) profileEditForm.addEventListener('submit', (e)=> this.saveProfile(e));
    
    // NOVOS FORMULÁRIOS
    const loginForm = document.getElementById('login-form');
    if(loginForm) loginForm.addEventListener('submit', (e)=> this.handleLogin(e));
    
    const signupNewForm = document.getElementById('signup-form');
    if(signupNewForm) signupNewForm.addEventListener('submit', (e)=> this.handleNewSignup(e));
  },
  
  get users(){ return JSON.parse(localStorage.getItem('vm_users')||'[]'); },
  set users(v){ localStorage.setItem('vm_users', JSON.stringify(v)); },
  
  get groups(){ return JSON.parse(localStorage.getItem('vm_groups')||'[]'); },
  set groups(v){ localStorage.setItem('vm_groups', JSON.stringify(v)); },
  
  get session(){ return JSON.parse(localStorage.getItem('vm_sessions')); },
  set session(v){ localStorage.setItem('vm_sessions', JSON.stringify(v)); },
  
  currentUser(){
    const s = this.session;
    if(!s) return null;
    return this.users.find(u=>u.id===s.userId) || null;
  },
  
  searchDestinations(){
    const searchTerm = document.getElementById('search-home').value.toLowerCase();
    const cards = document.querySelectorAll('.travel-card');
    
    cards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const subtitle = card.querySelector('.muted').textContent.toLowerCase();
      
      if(title.includes(searchTerm) || subtitle.includes(searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  },
  
  renderGroups(q=''){
    const container = document.getElementById('groups-main-list');
    if(!container) return;
    container.innerHTML='';
    const list = this.groups.filter(g=> (g.name + g.destination).toLowerCase().includes((q||'').toLowerCase()));
    if(list.length===0) container.innerHTML='<p class="muted">Nenhum grupo encontrado</p>';
    list.forEach(g=>{
      const el=document.createElement('div');
      el.className='card';
      el.innerHTML=`
        <h4>${g.name}</h4>
        <p class='muted'>${g.destination} — ${g.date}</p>
        <div style='display:flex;gap:8px;margin-top:10px'>
          <button class='btn' onclick="VM.viewGroup('${g.id}')">Ver</button>
          <button class='btn primary' onclick="VM.toggleJoin('${g.id}')">
            ${(g.members||[]).includes(this.currentUser()?.id)?'Sair':'Entrar'}
          </button>
        </div>
      `;
      container.appendChild(el);
    });
  },
  
  viewGroup(id){
    const g=this.groups.find(x=>x.id===id);
    this.openModal(`
      <h3>${g.name}</h3>
      <p>${g.destination} - ${g.date}</p>
      <h4>Integrantes</h4>
      <ul>${(g.members||[]).map(m=>'<li>'+ (this.users.find(u=>u.id===m)?.name || 'Usuário') +'</li>').join('')}</ul>
      <p><button class='btn' onclick='VM.closeModal()'>Fechar</button></p>
    `);
  },
  
  toggleJoin(id){
    const user=this.currentUser();
    if(!user) return alert('Faça login');
    const groups = this.groups;
    const idx = groups.findIndex(g=>g.id===id);
    if(idx<0) return;
    groups[idx].members = groups[idx].members || [];
    if(groups[idx].members.includes(user.id)) 
      groups[idx].members = groups[idx].members.filter(x=>x!==user.id);
    else 
      groups[idx].members.push(user.id);
    this.groups = groups;
    this.renderGroups();
  },
  
  openCreateGroup(){
    this.openModal(`
      <h3>Criar Grupo</h3>
      <form onsubmit="VM.createGroup(event)">
        <input name='name' placeholder='Nome do grupo' required/>
        <input name='destination' placeholder='Destino' required/>
        <input name='date' type='date' required/>
        <div style='display:flex;gap:8px;margin-top:12px'>
          <button class='btn' type='button' onclick='VM.closeModal()'>Cancelar</button>
          <button class='btn primary' type='submit'>Criar</button>
        </div>
      </form>
    `);
  },
  
  createGroup(e){
    e.preventDefault();
    const f=e.target;
    const name=f.name.value.trim();
    const destination=f.destination.value.trim();
    const date=f.date.value;
    const user=this.currentUser();
    if(!user) return alert('Faça login');
    const groups = this.groups;
    groups.push({id:'g'+Date.now(), name, destination, date, members:[user.id], ownerId:user.id});
    this.groups = groups;
    this.closeModal();
    this.renderGroups();
  },
  
  openModal(html){
    let modal=document.getElementById('vm-modal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='vm-modal';
      modal.className='modal';
      modal.innerHTML=`
        <div class='modal-inner card'>
          <button class='btn' onclick='VM.closeModal()' style='float:right'>✕</button>
          <div id='vm-modal-body'></div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.querySelector('#vm-modal-body').innerHTML = html;
    modal.style.display='flex';
  },
  
  closeModal(){
    const modal=document.getElementById('vm-modal');
    if(modal) modal.style.display='none';
  },
  
  renderProfile(){
    const nameEl = document.getElementById('profile-name-large');
    if(!nameEl) return;
    const user = this.currentUser();
    if(!user) { 
      nameEl.textContent='Você não está logado'; 
      return; 
    }
    document.getElementById('profile-name-large').textContent = user.name;
    document.getElementById('profile-bio-large').textContent = user.bio || '';
    const avatar = document.getElementById('profile-avatar-large');
    if(avatar){
      if(user.avatar && user.avatar.startsWith('http')) 
        avatar.style.backgroundImage = `url('${user.avatar}')`;
      else 
        avatar.textContent = (user.avatar || user.name[0] || 'U');
    }
  },
  
  saveProfile(e){
    e.preventDefault();
    const users = this.users;
    const user = this.currentUser();
    if(!user) return alert('Faça login');
    const idx = users.findIndex(u=>u.id===user.id);
    users[idx].name = document.getElementById('edit-name').value || users[idx].name;
    users[idx].bio = document.getElementById('edit-bio').value || users[idx].bio;
    this.users = users;
    alert('Perfil salvo');
    this.renderProfile();
  },
  
  handleSignup(e){
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const pass = document.getElementById('signup-pass').value;
    const avatar = document.getElementById('signup-avatar').value;
    const bio = document.getElementById('signup-bio').value;
    const photo = document.getElementById('signup-photo').value;
    const users = this.users;
    if(users.find(u=>u.email===email)) return alert('Email já cadastrado');
    const id = 'u'+Date.now();
    users.push({id, name, email, pass, bio, avatar, photos: photo? [photo]: []});
    this.users = users;
    this.session = {userId:id};
    alert('Conta criada e logado');
    location.href='profile.html';
  },
  
  // NOVOS MÉTODOS PARA LOGIN
  handleLogin(e){
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;
    const user = this.users.find(u=>u.email===email && u.pass===pass);
    
    if(user){
      this.session = {userId: user.id};
      alert('Login realizado com sucesso!');
      location.href = 'profile.html';
    } else {
      alert('Email ou senha incorretos');
    }
  },
  
  handleNewSignup(e){
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const pass = document.getElementById('signup-pass').value;
    const passConfirm = document.getElementById('signup-pass-confirm').value;
    
    if(pass !== passConfirm){
      alert('As senhas não coincidem');
      return;
    }
    
    const users = this.users;
    if(users.find(u=>u.email===email)) return alert('Email já cadastrado');
    
    const id = 'u'+Date.now();
    users.push({
      id, 
      name, 
      email, 
      pass, 
      bio: 'Viajante apaixonado', 
      avatar: '', 
      photos: []
    });
    
    this.users = users;
    this.session = {userId:id};
    alert('Conta criada com sucesso!');
    location.href = 'profile.html';
  },
  
  checkAuthState(){
    const user = this.currentUser();
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const profileLinks = document.querySelectorAll('a[href="profile.html"]');
    
    loginLinks.forEach(link => {
      if(user){
        link.textContent = 'Sair';
        link.href = '#';
        link.onclick = () => {
          this.session = null;
          location.reload();
        };
      }
    });
    
    profileLinks.forEach(link => {
      if(!user){
        link.style.display = 'none';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', ()=> VM.init());