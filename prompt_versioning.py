from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional
import re

@dataclass
class PromptVersion:
    version: str
    tenant_id: str
    data_sensitivity: str
    purpose: str
    content: str
    created_at: datetime = field(default_factory=datetime.now)
    parent_version: Optional[str] = None

    def to_dict(self):
        return {
            "version": self.version,
            "tenant_id": self.tenant_id,
            "data_sensitivity": self.data_sensitivity,
            "purpose": self.purpose,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "parent_version": self.parent_version
        }

class PromptVersioningSystem:
    SENSITIVITY_LEVELS = {"public", "internal", "confidential", "restricted"}
    BLOCKED_PATTERNS = [
        r"(?i)hack\s+the\s+system",
        r"(?i)ignore\s+(all\s+)?(safety|ethical|from\s+above)",
        r"(?i)bypass\s+(security|validation)",
    ]

    def __init__(self):
        self.versions: dict[str, dict[str, PromptVersion]] = {}

    def _parse_version(self, ver: str) -> tuple[int, int, int]:
        parts = ver.split(".")
        return tuple(map(int, parts)) if len(parts) == 3 else (0, 0, 0)

    def _bump_version(self, current: str, change_type: str) -> str:
        major, minor, patch = self._parse_version(current)
        if change_type == "major":
            return f"{major + 1}.0.0"
        elif change_type == "minor":
            return f"{major}.{minor + 1}.0"
        else:
            return f"{major}.{minor}.{patch + 1}"

    def _safety_check(self, text: str) -> dict:
        violations = []
        for pattern in self.BLOCKED_PATTERNS:
            if re.search(pattern, text):
                violations.append(f"Pattern matched: {pattern}")
        return {
            "passed": len(violations) == 0,
            "violations": violations
        }

    def _mock_llm_preview(self, prompt: str) -> str:
        lines = [l.strip() for l in prompt.strip().split("\n") if l.strip()]
        first_step = lines[0] if lines else "[Empty prompt]"
        return f"Step 1: {first_step}\n\n[Preview generated via mock LLM - would execute: '{first_step[:50]}...']"

    def add_prompt(self, tenant_id: str, content: str, metadata: dict,
                  change_type: str = "patch") -> dict:
        if tenant_id not in self.versions:
            self.versions[tenant_id] = {}

        sensitivity = metadata.get("data_sensitivity", "public")
        if sensitivity not in self.SENSITIVITY_LEVELS:
            raise ValueError(f"Invalid sensitivity: {sensitivity}")

        existing = self.versions[tenant_id]
        latest_ver = max(existing.keys(), default="0.0.0", key=lambda v: self._parse_version(v))
        new_ver = self._bump_version(latest_ver, change_type)

        safety = self._safety_check(content)
        if not safety["passed"]:
            raise ValueError(f"Safety check failed: {safety['violations']}")

        preview = self._mock_llm_preview(content)

        prompt_version = PromptVersion(
            version=new_ver,
            tenant_id=tenant_id,
            data_sensitivity=sensitivity,
            purpose=metadata.get("purpose", ""),
            content=content,
            parent_version=latest_ver if latest_ver != "0.0.0" else None
        )
        existing[new_ver] = prompt_version

        return {
            "version": new_ver,
            "safety_check": safety,
            "preview": preview,
            "prompt_entry": prompt_version.to_dict()
        }

    def rollback(self, tenant_id: str, target_version: str) -> dict:
        if tenant_id not in self.versions:
            raise ValueError(f"Tenant not found: {tenant_id}")

        versions = self.versions[tenant_id]
        if target_version not in versions:
            raise ValueError(f"Version not found: {target_version}")

        target = versions[target_version]
        new_ver = self._bump_version(target_version, "patch")

        rollback_entry = PromptVersion(
            version=new_ver,
            tenant_id=tenant_id,
            data_sensitivity=target.data_sensitivity,
            purpose=target.purpose,
            content=target.content,
            parent_version=target_version
        )
        versions[new_ver] = rollback_entry

        return {
            "rolled_back_to": target_version,
            "new_version": new_ver,
            "prompt_entry": rollback_entry.to_dict()
        }

    def get_history(self, tenant_id: str) -> list[dict]:
        if tenant_id not in self.versions:
            return []
        versions = self.versions[tenant_id]
        return [
            {"version": v, **versions[v].to_dict()}
            for v in sorted(versions.keys(), key=lambda x: self._parse_version(x))
        ]


if __name__ == "__main__":
    system = PromptVersioningSystem()

    print("=" * 50)
    print("DEMO: Prompt Versioning System")
    print("=" * 50)

    result = system.add_prompt(
        tenant_id="tenant_001",
        content="Analyze customer feedback for product X and generate sentiment report",
        metadata={
            "data_sensitivity": "internal",
            "purpose": "analytics"
        },
        change_type="patch"
    )
    print(f"\n[ADD v1] {result['version']}")
    print(f"Preview: {result['preview']}")

    result = system.add_prompt(
        tenant_id="tenant_001",
        content="Summarize daily logs and flag anomalies for security review",
        metadata={
            "data_sensitivity": "confidential",
            "purpose": "security"
        },
        change_type="patch"
    )
    print(f"\n[ADD v2] {result['version']}")

    rb = system.rollback("tenant_001", "0.0.1")
    print(f"\n[ROLLBACK] to v1 -> new version: {rb['new_version']}")

    print(f"\n[VERSION HISTORY]")
    for entry in system.get_history("tenant_001"):
        print(f"  {entry['version']}: {entry['purpose']} ({entry['content'][:30]}...)")

    print(f"\n[ SAFETY CHECK TEST ]")
    try:
        system.add_prompt(
            tenant_id="tenant_001",
            content="Hack the system to bypass security",
            metadata={"data_sensitivity": "public", "purpose": "test"}
        )
    except ValueError as e:
        print(f"  Blocked as expected: {e}")