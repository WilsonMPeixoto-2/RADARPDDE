"""Extract only the seven sealed backup files; never unpack the encrypted payload."""
import os
from pathlib import Path
import stat
import sys
import zipfile

EXPECTED = {
    "backup.tar.gz.enc", "envelope.json", "evidence.json", "release-gate.json",
    "recipient-public.pem", "recipient-private.encrypted.pem", "RECOVERY.txt",
}


def main():
    archive, destination = map(Path, sys.argv[1:])
    if not archive.is_absolute() or not destination.is_absolute():
        raise ValueError("Absolute runner temporary paths required")
    destination.mkdir(mode=0o700)
    with zipfile.ZipFile(archive) as sealed:
        entries = sealed.infolist()
        if len(entries) != len(EXPECTED) or {entry.filename for entry in entries} != EXPECTED:
            raise ValueError("Unexpected backup artifact files")
        for entry in entries:
            mode = entry.external_attr >> 16
            if entry.is_dir() or stat.S_ISLNK(mode):
                raise ValueError("Directories and symlinks are forbidden")
            with sealed.open(entry) as source, (destination / entry.filename).open("xb") as target:
                os.chmod(target.name, 0o600)
                while chunk := source.read(1024 * 1024):
                    target.write(chunk)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit("Encrypted backup artifact extraction failed; no database operation was attempted.")
