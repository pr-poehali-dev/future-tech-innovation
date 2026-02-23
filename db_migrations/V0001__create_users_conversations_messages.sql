CREATE TABLE t_p7984599_future_tech_innovati.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('author', 'investor')),
  inn TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p7984599_future_tech_innovati.conversations (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES t_p7984599_future_tech_innovati.users(id),
  investor_id INTEGER NOT NULL REFERENCES t_p7984599_future_tech_innovati.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p7984599_future_tech_innovati.messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES t_p7984599_future_tech_innovati.conversations(id),
  sender_id INTEGER NOT NULL REFERENCES t_p7984599_future_tech_innovati.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
