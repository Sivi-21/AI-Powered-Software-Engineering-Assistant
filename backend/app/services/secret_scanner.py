import re
import logging
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger("app.services.secret_scanner")

# Standard regexes for detecting secrets
SECRET_PATTERNS = {
    "AWS API Key": r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}",
    "Private Key": r"-----BEGIN\s(?:RSA|EC|DSA|GPG|OPENSSH)\sPRIVATE\sKEY-----",
    "Generic Password/Secret": r"(?i)(?:password|passwd|secret|passphrase|api_key|apikey|jwt_secret|client_secret|db_url|database_url|mongodb_uri|auth_token)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.\/\+\=\:\@]{8,}['\"]",
    "Slack Token": r"xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[a-zA-Z0-9]{24}",
    "GitHub Personal Access Token": r"gh[pso]_[a-zA-Z0-9]{36,255}",
    "Google OAuth Client Secret": r"AIzaSy[a-zA-Z0-9\-_]{33}",
    "Stripe API Key": r"sk_live_[0-9a-zA-Z]{24}",
    "Database Connection String": r"(mongodb(?:\+srv)?|postgres|postgresql|mysql|sqlite):\/\/[a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+:[0-9]+\/[a-zA-Z0-9_\-\.]+"
}

class SecretScanner:
    def scan_file(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        findings = []
        lines = content.splitlines()
        
        for line_num, line in enumerate(lines, 1):
            for name, pattern in SECRET_PATTERNS.items():
                match = re.search(pattern, line)
                if match:
                    # Determine severity
                    severity = "CRITICAL"
                    if "Password" in name or "Connection" in name:
                        severity = "HIGH"
                    elif "Key" in name:
                        severity = "CRITICAL"
                    else:
                        severity = "MEDIUM"
                        
                    # Mask the secret value to prevent printing in report
                    secret_val = match.group(0)
                    masked = secret_val[:6] + "..." + secret_val[-4:] if len(secret_val) > 10 else "********"
                    
                    findings.append({
                        "severity": severity,
                        "file_path": file_path,
                        "line_number": line_num,
                        "description": f"Potential {name} detected.",
                        "snippet": line.strip()[:100].replace(secret_val, masked)
                    })
        return findings

    def scan_project_files(self, parsed_files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        all_findings = []
        for f in parsed_files:
            file_path = f.get("file_path", "")
            content = f.get("content", "")
            all_findings.extend(self.scan_file(file_path, content))
        return all_findings

secret_scanner = SecretScanner()
