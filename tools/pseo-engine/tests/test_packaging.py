import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
WF = ROOT / ".github" / "workflows" / "pseo.yml"


def _wf():
    return yaml.safe_load(WF.read_text(encoding="utf-8"))


def test_workflow_has_schedule_and_manual_trigger():
    on = _wf().get("on", _wf().get(True))
    assert "schedule" in on and "workflow_dispatch" in on


def test_workflow_never_pushes_to_main():
    text = WF.read_text(encoding="utf-8")
    assert "git push origin main" not in text
    assert "pseo-drafts" in text
    assert "pull-requests: write" in text


def test_workflow_uploads_dashboard_and_uses_optional_secrets():
    text = WF.read_text(encoding="utf-8")
    assert "reports/dashboard.html" in text
    for name in ("INDEXNOW_KEY", "GSC_CREDENTIALS", "SERPAPI_KEY"):
        assert name in text


def test_readme_has_five_setup_steps_and_commands():
    text = (ROOT / "README.md").read_text(encoding="utf-8")
    for n in range(1, 6):
        assert f"Step {n}" in text
    for cmd in ("pseo run", "pseo harvest", "pseo dashboard", "pseo ping", "sync-calculators"):
        assert cmd in text


def test_gitignore_excludes_private_outputs():
    ig = (ROOT / ".gitignore").read_text(encoding="utf-8")
    assert "reports/" in ig and "out/" in ig


def test_cli_help_exits_zero():
    r = subprocess.run([sys.executable, "-m", "pseo.cli", "--help"], capture_output=True,
                       text=True, cwd=ROOT)
    assert r.returncode == 0 and "harvest" in r.stdout
