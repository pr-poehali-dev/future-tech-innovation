"""
Чат между автором и инвестором: регистрация, диалоги, сообщения.
Роутинг через параметр action (в body для POST, в query для GET).
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


SCHEMA = "t_p7984599_future_tech_innovati"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}") if method == "POST" else {}

    action = body.get("action") or params.get("action", "")

    # POST action=register — регистрация / обновление пользователя
    if method == "POST" and action == "register":
        name = body.get("name", "").strip()
        email = body.get("email", "").strip().lower()
        role = body.get("role", "")
        inn = body.get("inn", None)

        if not name or not email or role not in ("author", "investor"):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверные данные"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, email, role, inn) VALUES (%s, %s, %s, %s) "
            f"ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role, inn=EXCLUDED.inn "
            f"RETURNING id, name, email, role",
            (name, email, role, inn)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(
            {"id": row[0], "name": row[1], "email": row[2], "role": row[3]}
        )}

    # GET action=conversations&user_id=X — список диалогов
    if method == "GET" and action == "conversations":
        user_id = params.get("user_id")
        if not user_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""
            SELECT c.id,
                   a.id, a.name,
                   i.id, i.name,
                   (SELECT text FROM {SCHEMA}.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
                   (SELECT created_at FROM {SCHEMA}.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1)
            FROM {SCHEMA}.conversations c
            JOIN {SCHEMA}.users a ON a.id = c.author_id
            JOIN {SCHEMA}.users i ON i.id = c.investor_id
            WHERE c.author_id = %s OR c.investor_id = %s
            ORDER BY 7 DESC NULLS LAST
            """,
            (user_id, user_id)
        )
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([
            {
                "id": r[0],
                "author": {"id": r[1], "name": r[2]},
                "investor": {"id": r[3], "name": r[4]},
                "last_message": r[5],
                "last_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ])}

    # POST action=create_conversation — создать диалог
    if method == "POST" and action == "create_conversation":
        author_id = body.get("author_id")
        investor_id = body.get("investor_id")
        if not author_id or not investor_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "author_id and investor_id required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.conversations WHERE author_id=%s AND investor_id=%s",
            (author_id, investor_id)
        )
        existing = cur.fetchone()
        if existing:
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": existing[0]})}

        cur.execute(
            f"INSERT INTO {SCHEMA}.conversations (author_id, investor_id) VALUES (%s, %s) RETURNING id",
            (author_id, investor_id)
        )
        conv_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": conv_id})}

    # GET action=messages&conversation_id=X — сообщения диалога
    if method == "GET" and action == "messages":
        conv_id = params.get("conversation_id")
        if not conv_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "conversation_id required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""
            SELECT m.id, m.text, m.created_at, u.id, u.name, u.role
            FROM {SCHEMA}.messages m
            JOIN {SCHEMA}.users u ON u.id = m.sender_id
            WHERE m.conversation_id = %s
            ORDER BY m.created_at ASC
            """,
            (conv_id,)
        )
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps([
            {"id": r[0], "text": r[1], "created_at": r[2].isoformat(),
             "sender": {"id": r[3], "name": r[4], "role": r[5]}}
            for r in rows
        ])}

    # POST action=send_message — отправить сообщение
    if method == "POST" and action == "send_message":
        conv_id = body.get("conversation_id")
        sender_id = body.get("sender_id")
        text = body.get("text", "").strip()
        if not conv_id or not sender_id or not text:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "conversation_id, sender_id, text required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (conversation_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
            (conv_id, sender_id, text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(
            {"id": row[0], "created_at": row[1].isoformat()}
        )}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Unknown action"})}
