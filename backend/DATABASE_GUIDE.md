# Database Development Guide

## 🎯 Overview

ChiHealth MediSecure supports **dual-mode database operation** for flexible development:

- **In-Memory Mode** (Default): Fast, no setup required, perfect for rapid prototyping
- **Prisma Mode**: PostgreSQL connection, production-like, data persists

Production **always** uses PostgreSQL regardless of local settings.

---

## 🚀 Quick Start

### Daily Development (Fast Mode)
```bash
npm run dev
# Uses in-memory database
# Changes reset when server restarts
# No database connection required
```

### Testing with Real Database
```bash
USE_PRISMA=true npm run dev
# Uses PostgreSQL
# Data persists between restarts
# Requires database connection
```

### Production
```bash
NODE_ENV=production npm start
# Always uses PostgreSQL
# Reads DATABASE_URL from environment
```

---

## 📋 When to Use Each Mode

| Scenario | In-Memory | Prisma |
|----------|-----------|--------|
| **Adding UI components** | ✅ Perfect | ❌ Overkill |
| **Rapid prototyping** | ✅ Fast iteration | ⚠️ Slower |
| **Testing API logic** | ✅ Quick | ⚠️ Use for final test |
| **Adding database fields** | ❌ Won't persist | ✅ Required |
| **Before deploying** | ❌ Not production-like | ✅ Must test |
| **Working offline** | ✅ Works anywhere | ❌ Needs connection |
| **Team collaboration** | ⚠️ Each dev has own data | ✅ Shared database |

---

## 🛠️ Adding New Features

### Scenario 1: New UI Feature (No DB Changes)

```bash
# Work in in-memory mode (fastest)
npm run dev

# Mock data is already in backend/src/db.ts
# Make your changes, test immediately
```

### Scenario 2: New Database Model

**Step 1: Update Prisma Schema**
```prisma
// backend/prisma/schema.prisma
model MedicalAlert {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  message   String
  severity  String   // 'low' | 'medium' | 'high' | 'critical'
  resolved  Boolean  @default(false)
  createdAt DateTime @default(now())
}

// Don't forget to add relation to User model:
model User {
  // ... existing fields
  medicalAlerts MedicalAlert[]
}
```

**Step 2: Create Migration**
```bash
USE_PRISMA=true npm run dev
# In another terminal:
cd backend
npx prisma migrate dev --name add_medical_alerts
```

**Step 3: Generate Prisma Client**
```bash
npx prisma generate
```

**Step 4: Update Database Abstraction** (backend/src/database.ts)
```typescript
export const db = {
  // ... existing models
  
  medicalAlerts: {
    findMany: async () => {
      if (USE_PRISMA && prisma) {
        return await prisma.medicalAlert.findMany({
          include: { user: true }
        });
      }
      return inMemoryDb.medicalAlerts;
    },
    
    create: async (data: any) => {
      if (USE_PRISMA && prisma) {
        return await prisma.medicalAlert.create({ data });
      }
      const newAlert = { 
        ...data, 
        id: `alert_${Date.now()}`, 
        createdAt: new Date() 
      };
      inMemoryDb.medicalAlerts.push(newAlert);
      return newAlert;
    }
  }
};
```

**Step 5: Add to In-Memory Store** (backend/src/db.ts)
```typescript
export let medicalAlerts: MedicalAlert[] = [];
```

**Step 6: Build and Test**
```bash
# Test with Prisma
USE_PRISMA=true npm run dev

# Test with in-memory (for fast iteration)
npm run dev

# Build for production
npm run build
```

---

## 📦 Migration Commands

### Create Migration
```bash
npx prisma migrate dev --name descriptive_name
```

### Apply Migrations (Production)
```bash
npx prisma migrate deploy
```

### Reset Database (Development Only!)
```bash
npx prisma migrate reset
# WARNING: Deletes all data!
```

### Seed Database
```bash
npm run seed
```

### View Database in Browser
```bash
npx prisma studio
```

---

## 🔍 Debugging

### Check Current Mode
```typescript
// In your code
import db from './database';
console.log('Database mode:', db.mode);
// Output: 'in-memory' or 'prisma'
```

### Connection Issues
```bash
# Test database connection
cd backend
npx prisma db push

# If fails, check:
# 1. DATABASE_URL is correct in .env
# 2. Your IP is authorized in Cloud SQL
# 3. PostgreSQL is running
```

### Migration Conflicts
```bash
# If migrations are out of sync:
npx prisma migrate resolve --applied "migration_name"

# Or reset (deletes data):
npx prisma migrate reset
npm run seed
```

---

## 🤝 Team Workflow

### When Pulling Changes

```bash
git pull origin deploy-fix

# Check if schema changed
git diff HEAD@{1} backend/prisma/schema.prisma

# If schema changed:
cd backend
npx prisma migrate dev  # Applies new migrations
npx prisma generate     # Updates Prisma Client
```

### Before Pushing Changes

```bash
# Test with Prisma mode
USE_PRISMA=true npm run dev

# Run build to verify TypeScript
npm run build

# Commit migration files
git add backend/prisma/migrations/
git commit -m "feat: Add medical alerts feature"
```

---

## 🚀 Deployment Checklist

Before deploying to Cloud Run:

- [ ] All migrations created and tested locally
- [ ] `USE_PRISMA=true npm run dev` works without errors
- [ ] Build succeeds: `npm run build`
- [ ] Seed script works: `npm run seed`
- [ ] Cloud SQL connection configured in Cloud Run
- [ ] DATABASE_URL secret added to Cloud Run
- [ ] IP authorization set (production doesn't need this)

---

## 💡 Pro Tips

1. **Rapid Prototyping**: Use in-memory mode until feature is stable
2. **Final Testing**: Always test with `USE_PRISMA=true` before deploying
3. **Offline Work**: In-memory mode works without internet
4. **Data Persistence**: Use Prisma mode when you need data to survive restarts
5. **Team Dev**: Share a staging database using Cloud SQL
6. **Production Parity**: Test with Prisma before each deployment

---

## 📞 Common Issues

### "Can't reach database server"
- Check DATABASE_URL in .env
- Verify IP is authorized in Cloud SQL
- Ensure Cloud SQL instance is running

### "Relation not found"
- Run `npx prisma generate`
- Restart TypeScript server (VSCode: Cmd+Shift+P → Restart TS Server)

### "Migration conflicts"
- Someone else created a migration
- Pull latest: `git pull`
- Apply migrations: `npx prisma migrate dev`

### "Type errors after schema change"
- Run `npx prisma generate`
- Rebuild: `npm run build`

---

**Questions?** Check [Prisma Docs](https://www.prisma.io/docs) or ask the team!
