"""Add modules_allowed to users

Revision ID: add_modules_allowed
Revises: 
Create Date: 2026-02-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_modules_allowed'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add modules_allowed column to users table
    op.add_column('users', 
        sa.Column('modules_allowed', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        schema='public'
    )
    
    # Set default empty array for existing users
    op.execute("UPDATE public.users SET modules_allowed = '[]'::json WHERE modules_allowed IS NULL")


def downgrade():
    # Remove modules_allowed column
    op.drop_column('users', 'modules_allowed', schema='public')
