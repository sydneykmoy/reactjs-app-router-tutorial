import bcrypt from 'bcrypt';
import postgres, { Sql } from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
// If you’re on Next dev with hot reloads, you might want to make this a module-level singleton.

async function seedUsers(db: Sql) {
  await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);
    await db`
      INSERT INTO users (id, name, email, password)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${hashed})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedInvoices(db: Sql) {
  await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await db`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  for (const inv of invoices) {
    await db`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${inv.customer_id}, ${inv.amount}, ${inv.status}, ${inv.date})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedCustomers(db: Sql) {
  await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await db`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  for (const c of customers) {
    await db`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${c.id}, ${c.name}, ${c.email}, ${c.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
}

async function seedRevenue(db: Sql) {
  await db`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  for (const r of revenue) {
    await db`
      INSERT INTO revenue (month, revenue)
      VALUES (${r.month}, ${r.revenue})
      ON CONFLICT (month) DO NOTHING;
    `;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await sql.begin(async (tx) => {
      // order can matter if you later add FKs
      await seedUsers(tx);
      await seedCustomers(tx);
      await seedInvoices(tx);
      await seedRevenue(tx);
    });

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
