
# ONG+ — Plataforma Web (HTML/CSS/JS)

Projeto para gestão de ONGs, com:
- HTML5 semântico e acessível
- CSS responsivo e avançado (grid, flex, variáveis, dark toggle)
- JavaScript com DOM, eventos, `localStorage`, módulos lógicos
- Integração com Alpine.js (reatividade leve) e Chart.js (gráficos)
- CRUD de Projetos, Atividades, Voluntários e registro de Doações
- Importação/Exportação de dados (`.json`)

## Como usar

1. Extraia o `.zip` e **abra `index.html` no navegador.
2. Clique em Dashboard para criar/editar dados.
3. Todos os dados ficam no localStorage do seu navegador (sem backend).

## Estrutura
```
/assets/img     # imagens SVG locais
index.html      # landing e vitrine de projetos
dashboard.html  # painel administrativo (CRUD + gráficos)
style.css       # visual moderno responsivo
app.js          # lógica da landing (DOM/eventos/localStorage)
dashboard.js    # lógica do dashboard (CRUD, gráficos, import/export)
```

## Licença

Uso acadêmico/livre para fins educacionais.
