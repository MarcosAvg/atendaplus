"""Create reproducible Chromium and unsigned Firefox packages."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def build(tag=None):
    folders = {"chromium": ROOT / "extension", "firefox": ROOT / "extension-firefox"}
    manifests = {name: json.loads((folder / "manifest.json").read_text())
                 for name, folder in folders.items()}
    version = manifests["chromium"]["version"]
    if manifests["firefox"]["version"] != version:
        raise SystemExit("Las versiones de los manifiestos deben coincidir.")
    if (folders["chromium"] / "notas.js").read_bytes() != (folders["firefox"] / "notas.js").read_bytes():
        raise SystemExit("Las dos copias de notas.js deben coincidir.")
    if tag is not None and tag != f"v{version}":
        raise SystemExit(f"El tag debe ser v{version}, recibido: {tag}")
    output = ROOT / "dist" / f"v{version}"
    output.mkdir(parents=True, exist_ok=True)
    checksums = []
    for browser, folder in folders.items():
        files = {"manifest.json": (folder / "manifest.json").read_bytes(),
                 "notas.js": (folder / "notas.js").read_bytes(),
                 "LICENSE": (ROOT / "LICENSE").read_bytes()}
        archive = output / f"atenda-notas-{browser}-{version}.zip"
        with zipfile.ZipFile(archive, "w") as bundle:
            for name, data in sorted(files.items()):
                entry = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                entry.external_attr = 0o100644 << 16
                bundle.writestr(entry, data)
        with zipfile.ZipFile(archive) as bundle:
            assert bundle.testzip() is None
            assert set(bundle.namelist()) == set(files)
        checksums.append(f"{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}")
        print(archive.relative_to(ROOT))
    (output / "SHA256SUMS.txt").write_text("\n".join(checksums) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tag", help="Verify the release tag matches the manifest versions")
    build(parser.parse_args().tag)
