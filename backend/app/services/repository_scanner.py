import os
import logging
from pathlib import Path
from typing import Dict, List, Any

logger = logging.getLogger("app.services.repository_scanner")

# Map of extensions to programming languages
LANGUAGE_EXTENSION_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".h": "C/C++ Header",
    ".go": "Go",
    ".rs": "Rust",
    ".html": "HTML",
    ".css": "CSS",
    ".sh": "Shell Script",
    ".rb": "Ruby",
    ".php": "PHP",
    ".cs": "C#",
    ".swift": "Swift",
    ".kt": "Kotlin"
}

# Directories to ignore during scanning
EXCLUDED_DIRS = {
    "node_modules", "venv", ".venv", "env", ".git", ".github",
    "__pycache__", "build", "dist", "target", "out", ".idea", ".vscode"
}

class RepositoryScanner:
    def scan_project(self, base_dir: Path) -> Dict[str, Any]:
        """
        Scans a directory tree statically.
        Detects:
        - Languages & frameworks
        - Total file counts
        - Lines of Code (LOC)
        - Key files presence (package.json, requirements.txt, Dockerfile)
        Returns a structured dictionary of metrics.
        """
        logger.info(f"Scanning project directory: {base_dir}")
        resolved_base = base_dir.resolve()
        
        file_count = 0
        total_loc = 0
        languages_map = {}
        
        detected_package_json = False
        detected_requirements_txt = False
        detected_dockerfile = False
        
        dependencies = []
        frameworks = set()

        for root, dirs, files in os.walk(resolved_base):
            # Exclude folders
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
            
            for file in files:
                file_path = Path(root) / file
                file_count += 1
                
                # Check for specific files
                if file.lower() == "package.json":
                    detected_package_json = True
                    self._parse_package_json(file_path, dependencies, frameworks)
                elif file.lower() == "requirements.txt":
                    detected_requirements_txt = True
                    self._parse_requirements_txt(file_path, dependencies, frameworks)
                elif file.lower() == "dockerfile" or file.startswith("Dockerfile"):
                    detected_dockerfile = True
                    frameworks.add("Docker")
                
                # Language detection and line counting
                suffix = file_path.suffix.lower()
                if suffix in LANGUAGE_EXTENSION_MAP:
                    lang = LANGUAGE_EXTENSION_MAP[suffix]
                    languages_map[lang] = languages_map.get(lang, 0) + 1
                    
                    # Count LOC
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = f.readlines()
                            total_loc += len(lines)
                    except Exception as e:
                        logger.warning(f"Failed to read file {file_path} for LOC count: {str(e)}")
                        continue

        # Sort languages by counts
        sorted_languages = [
            lang for lang, count in sorted(languages_map.items(), key=lambda x: x[1], reverse=True)
        ]

        result = {
            "file_count": file_count,
            "total_lines_of_code": total_loc,
            "detected_languages": sorted_languages,
            "detected_frameworks": list(frameworks),
            "configuration_files": {
                "package_json": detected_package_json,
                "requirements_txt": detected_requirements_txt,
                "dockerfile": detected_dockerfile
            },
            "dependencies": dependencies
        }

        logger.info(f"Scan complete. LOC: {total_loc}, Frameworks: {list(frameworks)}")
        return result

    def _parse_package_json(self, path: Path, dependencies: List[str], frameworks: Any):
        """Helper to extract Node dependencies and frameworks from package.json."""
        try:
            import json
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                data = json.load(f)
                
            # Combine dependencies
            deps = data.get("dependencies", {})
            dev_deps = data.get("devDependencies", {})
            all_deps = {**deps, **dev_deps}
            
            for dep in all_deps.keys():
                dependencies.append(dep)
                # Framework heuristics
                if dep == "react":
                    frameworks.add("React")
                elif dep == "express":
                    frameworks.add("Express")
                elif dep == "vue":
                    frameworks.add("Vue")
                elif dep == "angular":
                    frameworks.add("Angular")
                elif dep == "@nestjs/core":
                    frameworks.add("NestJS")
                elif dep == "next":
                    frameworks.add("Next.js")
        except Exception as e:
            logger.warning(f"Failed to parse package.json: {str(e)}")

    def _parse_requirements_txt(self, path: Path, dependencies: List[str], frameworks: Any):
        """Helper to extract Python dependencies and frameworks from requirements.txt."""
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
            for line in lines:
                clean_line = line.strip()
                if not clean_line or clean_line.startswith("#"):
                    continue
                # Split at version constraint characters
                dep_name = clean_line.split("==")[0].split(">=")[0].split("<=")[0].strip()
                dependencies.append(dep_name.lower())
                
                # Framework heuristics
                if dep_name.lower() == "fastapi":
                    frameworks.add("FastAPI")
                elif dep_name.lower() == "django":
                    frameworks.add("Django")
                elif dep_name.lower() == "flask":
                    frameworks.add("Flask")
                elif dep_name.lower() == "tornado":
                    frameworks.add("Tornado")
        except Exception as e:
            logger.warning(f"Failed to parse requirements.txt: {str(e)}")

# Single instance of scanner service
repository_scanner = RepositoryScanner()
