import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending") # pending, parsing, indexing, analyzing, completed, failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Repository metadata extensions
    repository_source: Mapped[str] = mapped_column(String(50), default="ZIP")
    github_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    clone_timestamp: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    commit_hash: Mapped[str | None] = mapped_column(String(50), nullable=True)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="repositories")
    reports = relationship("Report", back_populates="repository", cascade="all, delete-orphan")

    @property
    def name(self) -> str:
        return self.repository_name

    @name.setter
    def name(self, value: str):
        self.repository_name = value

    @property
    def user_id(self):
        return self.owner_id

    @user_id.setter
    def user_id(self, value):
        self.owner_id = value

    @property
    def user(self):
        return self.owner

    @user.setter
    def user(self, value):
        self.owner = value
