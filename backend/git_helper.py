import os
import dulwich.porcelain as dp
from dulwich.repo import Repo

repo_path = r'd:\online_ticket_system'
repo = Repo(repo_path)

# Collect all files respecting .gitignore
ignored_dirs = {
    'venv', 'node_modules', 'dist', 'build', '__pycache__', 
    '.pytest_cache', 'tools', '.git', 'media'
}

files_to_add = []
for root, dirs, files in os.walk(repo_path):
    # Prune ignored directories
    dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.endswith('.egg-info')]
    for f in files:
        if f.endswith(('.sqlite3', '.pyc', '.pyo', '.log', '.env')) or f == 'db.sqlite3':
            continue
        full_path = os.path.join(root, f)
        rel_path = os.path.relpath(full_path, repo_path).replace('\\', '/')
        files_to_add.append(rel_path)

print(f"Staging {len(files_to_add)} files...")
dp.add(repo, paths=files_to_add)

# Check status
status = dp.status(repo)
print(f"Staged files count: {len(status.staged['add'])}")

# Commit
commit_msg = b"feat: Pakistan online ticket system with alphabetical province city selector, real ticket generator, and live rent calculator\n\n- Alphabetical A-Z Pakistan city dropdown with province tabs (Punjab, Sindh, KPK, Balochistan, Islamabad, Gilgit-Baltistan, AJK)\n- Custom journey fare/rent calculator and odometer (KM)\n- Real boarding pass and digital ticket generator with QR code\n- Complete Pakistan city seeding (300+ cities)\n- Removed foreign cities and datasets"

try:
    commit_id = dp.commit(
        repo,
        message=commit_msg,
        author=b"Dad Mohammad <dadmohammad@example.com>",
        committer=b"Dad Mohammad <dadmohammad@example.com>"
    )
    print(f"Successfully created commit: {commit_id.decode('ascii') if isinstance(commit_id, bytes) else commit_id}")
except Exception as e:
    print("Commit status/error:", e)
