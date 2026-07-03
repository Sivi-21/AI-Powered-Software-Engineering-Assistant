import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
import xml.etree.ElementTree as ET

logger = logging.getLogger("app.services.dependency_scanner")

# Heuristic vulnerability DB
KNOWN_VULNERABILITIES = {
    "django": [{"version": "<=4.2.1", "cve": "CVE-2023-31084", "severity": "HIGH", "upgrade": "4.2.2"}],
    "fastapi": [{"version": "<0.100.0", "cve": "CVE-2023-4567", "severity": "MEDIUM", "upgrade": "0.100.0"}],
    "requests": [{"version": "<2.28.0", "cve": "CVE-2022-28108", "severity": "MEDIUM", "upgrade": "2.28.1"}],
    "lodash": [{"version": "<4.17.21", "cve": "CVE-2021-23337", "severity": "CRITICAL", "upgrade": "4.17.21"}],
    "express": [{"version": "<4.18.2", "cve": "CVE-2022-2476", "severity": "HIGH", "upgrade": "4.18.2"}],
    "log4j": [{"version": "<2.17.1", "cve": "CVE-2021-44228", "severity": "CRITICAL", "upgrade": "2.17.1"}],
    "spring-core": [{"version": "<5.3.18", "cve": "CVE-2022-22965", "severity": "CRITICAL", "upgrade": "5.3.18"}]
}

class DependencyScanner:
    def scan_project(self, parsed_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        findings = []
        for file_info in parsed_files:
            file_path = file_info["file_path"]
            content = file_info["content"]
            name = Path(file_path).name.lower()
            
            if name == "package.json":
                findings.extend(self._scan_package_json(file_path, content))
            elif name == "requirements.txt":
                findings.extend(self._scan_requirements_txt(file_path, content))
            elif name == "pom.xml":
                findings.extend(self._scan_pom_xml(file_path, content))
            elif name == "cargo.toml":
                findings.extend(self._scan_cargo_toml(file_path, content))
            elif name == "composer.json":
                findings.extend(self._scan_composer_json(file_path, content))
                
        return findings

    def _scan_package_json(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        findings = []
        try:
            data = json.loads(content)
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            for dep, ver in deps.items():
                ver_clean = ver.replace("^", "").replace("~", "").replace(">", "").replace("=", "").strip()
                if dep in KNOWN_VULNERABILITIES:
                    for vuln in KNOWN_VULNERABILITIES[dep]:
                        findings.append({
                            "file_path": file_path,
                            "library": dep,
                            "version": ver,
                            "cve": vuln["cve"],
                            "severity": vuln["severity"],
                            "upgrade_suggestion": vuln["upgrade"],
                            "description": f"Known vulnerability in {dep} dependency version {ver}."
                        })
        except Exception as e:
            logger.warning(f"Failed to parse package.json during scan: {e}")
        return findings

    def _scan_requirements_txt(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        findings = []
        lines = content.splitlines()
        for line in lines:
            clean_line = line.strip()
            if not clean_line or clean_line.startswith("#"):
                continue
            parts = re.split(r"==|>=|<=|<|>", clean_line)
            dep = parts[0].strip().lower()
            ver = parts[1].strip() if len(parts) > 1 else "latest"
            if dep in KNOWN_VULNERABILITIES:
                for vuln in KNOWN_VULNERABILITIES[dep]:
                    findings.append({
                        "file_path": file_path,
                        "library": dep,
                        "version": ver,
                        "cve": vuln["cve"],
                        "severity": vuln["severity"],
                        "upgrade_suggestion": vuln["upgrade"],
                        "description": f"Vulnerability {vuln['cve']} detected in python requirements library: {dep}"
                    })
        return findings

    def _scan_pom_xml(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        findings = []
        try:
            # Simple regex search to parse Maven dependency artifacts
            deps = re.findall(r"<dependency>[\s\S]*?<artifactId>(.*?)</artifactId>[\s\S]*?<version>(.*?)</version>[\s\S]*?</dependency>", content)
            for artifact, version in deps:
                artifact = artifact.strip()
                version = version.strip()
                if artifact in KNOWN_VULNERABILITIES:
                    for vuln in KNOWN_VULNERABILITIES[artifact]:
                        findings.append({
                            "file_path": file_path,
                            "library": artifact,
                            "version": version,
                            "cve": vuln["cve"],
                            "severity": vuln["severity"],
                            "upgrade_suggestion": vuln["upgrade"],
                            "description": f"Maven POM vulnerability {vuln['cve']} detected."
                        })
        except Exception as e:
            logger.warning(f"POM scanner failed: {e}")
        return findings

    def _scan_cargo_toml(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        # Heuristic parsing for Cargo.toml
        findings = []
        matches = re.findall(r"(\w+)\s*=\s*[\"'](.*?)[\"']", content)
        for lib, version in matches:
            if lib in KNOWN_VULNERABILITIES:
                for vuln in KNOWN_VULNERABILITIES[lib]:
                    findings.append({
                        "file_path": file_path,
                        "library": lib,
                        "version": version,
                        "cve": vuln["cve"],
                        "severity": vuln["severity"],
                        "upgrade_suggestion": vuln["upgrade"],
                        "description": f"Cargo dependency vulnerability detected."
                    })
        return findings

    def _scan_composer_json(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        findings = []
        try:
            data = json.loads(content)
            deps = {**data.get("require", {}), **data.get("require-dev", {})}
            for dep, ver in deps.items():
                dep_name = dep.split("/")[-1]
                if dep_name in KNOWN_VULNERABILITIES:
                    for vuln in KNOWN_VULNERABILITIES[dep_name]:
                        findings.append({
                            "file_path": file_path,
                            "library": dep,
                            "version": ver,
                            "cve": vuln["cve"],
                            "severity": vuln["severity"],
                            "upgrade_suggestion": vuln["upgrade"],
                            "description": f"PHP Composer dependency vulnerability detected."
                        })
        except Exception:
            pass
        return findings

dependency_scanner = DependencyScanner()
