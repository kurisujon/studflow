"""enable rls and policies

Revision ID: c00000000000
Revises: b2ef0ef6eb68
Create Date: 2026-08-25 15:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c00000000000'
down_revision = 'b2ef0ef6eb68'
branch_labels = None
depends_on = None

direct_tables = ['documents', 'user_preferences', 'ai_conversations']
doc_hop_tables = [
    'summaries', 'flashcards', 'document_chunks', 'quizzes', 
    'quiz_attempts', 'related_videos', 'study_annotations', 'ai_history'
]
conv_hop_tables = ['ai_messages']
quiz_questions_table = 'quiz_questions'
citations_table = 'ai_message_citations'

def upgrade() -> None:
    # Direct tables
    for table in direct_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
        op.execute(f"""
            CREATE POLICY tenant_isolation_policy ON {table}
            FOR ALL
            USING (clerk_user_id = current_setting('app.current_user_id', true));
        """)

    # Doc hop tables
    for table in doc_hop_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
        op.execute(f"""
            CREATE POLICY tenant_isolation_policy ON {table}
            FOR ALL
            USING (EXISTS (
                SELECT 1 FROM documents 
                WHERE documents.id = {table}.document_id 
                AND documents.clerk_user_id = current_setting('app.current_user_id', true)
            ));
        """)

    # Conv hop tables
    for table in conv_hop_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
        op.execute(f"""
            CREATE POLICY tenant_isolation_policy ON {table}
            FOR ALL
            USING (EXISTS (
                SELECT 1 FROM ai_conversations 
                WHERE ai_conversations.id = {table}.conversation_id 
                AND ai_conversations.clerk_user_id = current_setting('app.current_user_id', true)
            ));
        """)

    # Quiz questions (2 hop)
    op.execute(f"ALTER TABLE {quiz_questions_table} ENABLE ROW LEVEL SECURITY;")
    op.execute(f"ALTER TABLE {quiz_questions_table} FORCE ROW LEVEL SECURITY;")
    op.execute(f"""
        CREATE POLICY tenant_isolation_policy ON {quiz_questions_table}
        FOR ALL
        USING (EXISTS (
            SELECT 1 FROM quizzes 
            JOIN documents ON documents.id = quizzes.document_id 
            WHERE quizzes.id = {quiz_questions_table}.quiz_id 
            AND documents.clerk_user_id = current_setting('app.current_user_id', true)
        ));
    """)

    # Citations (2 hop)
    op.execute(f"ALTER TABLE {citations_table} ENABLE ROW LEVEL SECURITY;")
    op.execute(f"ALTER TABLE {citations_table} FORCE ROW LEVEL SECURITY;")
    op.execute(f"""
        CREATE POLICY tenant_isolation_policy ON {citations_table}
        FOR ALL
        USING (EXISTS (
            SELECT 1 FROM ai_messages 
            JOIN ai_conversations ON ai_conversations.id = ai_messages.conversation_id 
            WHERE ai_messages.id = {citations_table}.message_id 
            AND ai_conversations.clerk_user_id = current_setting('app.current_user_id', true)
        ));
    """)

def downgrade() -> None:
    all_tables = direct_tables + doc_hop_tables + conv_hop_tables + [quiz_questions_table, citations_table]
    for table in all_tables:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")

