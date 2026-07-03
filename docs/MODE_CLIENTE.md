# Modelo cliente

Arquivo opinativo para evitar suporte repetitivo.

Checklist:
- Copiar a pasta do template para o cliente
- `.env` preenchido apenas com dados do cliente
- Banco: local JSON para desenvolvimento ou Supabase para produção
- Porta: exigir 3000/tcp ou outra porta configurada
- Domínio publico opcional com reverse proxy HTTPS
- Backup: `data/crm-db.json` ou dump do Supabase

Manutencao:
- Atualizar template central
- Repassar apenas alteracoes relevantes ao cliente
