import uuid
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, Text, Integer, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    code_quality_score: Mapped[int] = mapped_column(Integer, nullable=False)
    vulnerabilities: Mapped[dict | list] = mapped_column(JSON, default=list) # JSON list of security issues
    suggestions: Mapped[dict | list] = mapped_column(JSON, default=list)   # JSON list of refactoring suggestions
    full_report_md: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    repository = relationship("Repository", back_populates="reports")

    @property
    def project_id(self) -> uuid.UUID:
        return self.repository_id

    @project_id.setter
    def project_id(self, value: uuid.UUID):
        self.repository_id = value

    @property
    def project(self):
        return self.repository

    @project.setter
    def project(self, value):
        self.repository = value

