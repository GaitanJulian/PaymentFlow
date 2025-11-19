from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from ..core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

# sessionmaker que devuelve AsyncSession
async_session = sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def init_db() -> None:
    """
    Crea las tablas definidas en los modelos de SQLModel.
    Se llama en el startup de FastAPI.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
