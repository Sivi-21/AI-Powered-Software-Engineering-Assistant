import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(50), default="Developer Plan")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    github_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)


    # Relationships
    repositories = relationship("Repository", back_populates="owner", cascade="all, delete-orphan")

    @property
    def name(self) -> str:
        return self.full_name

    @name.setter
    def name(self, value: str):
        self.full_name = value

    @property
    def plan(self) -> str:
        return self.plan_type

    @plan.setter
    def plan(self, value: str):
        self.plan_type = value

    @property
    def projects(self):
        return self.repositories

