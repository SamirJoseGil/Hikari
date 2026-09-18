### 🐘 PostgreSQL local

```text
Host:     localhost
Port:     5432
Process:  postgres
```

### 🐳 PostgreSQL Docker

```text
Host:     localhost
Port:     5433
Database: mi_app_texto
User:     usuario_admin
Password: tu_contraseña_segura
```

Para nuestro `.env` de la hackathon usaría **el de Docker**, así dejamos el entorno aislado:

```env
DATABASE_URL=postgresql://usuario_admin:tu_contraseña_segura@localhost:5433/hackaton

POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=mi_app_texto
POSTGRES_USER=usuario_admin
POSTGRES_PASSWORD=tu_contraseña_segura
```

Y agrega esto al `.gitignore`:

```gitignore
.env
```

Así Copilot puede trabajar con las variables sin que accidentalmente terminemos subiendo credenciales al repo.
