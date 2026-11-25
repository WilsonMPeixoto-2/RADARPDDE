#!/usr/bin/env python3
"""Read explicitly named local PDFs; write a private native-text manifest.

No OCR, network, database, signature validation, or administrative decision.
"""
import argparse
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime, timezone
import hashlib
from io import BytesIO, StringIO
import json
import os
from pathlib import Path
import platform
import re
import sys
import tempfile
from time import perf_counter

import fitz
import pypdf
from pypdf.generic import DictionaryObject, NullObject

VERSION = "local-native-pdf/2"
REPOSITORY = Path(__file__).resolve().parents[3]


class PrivateArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        # argparse normally echoes unknown arguments, which may be private paths.
        raise ValueError("Invalid local extraction arguments.")


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def inherited(field, key):
    seen = set()
    while field is not None:
        field = field.get_object()
        identity = id(field)
        if identity in seen:
            break
        seen.add(identity)
        if key in field:
            return field[key]
        field = field.get("/Parent")
    return None


def inspect_signature_fields(reader):
    signatures = {}

    def register(name, field, origin, page=None):
        if inherited(field, "/FT") != "/Sig":
            return
        key = str(name or "unnamed-signature")
        entry = signatures.setdefault(key, {
            "fieldName": key, "sources": [], "pages": [],
            "valuePresent": False, "byteRangePresent": False
        })
        if origin not in entry["sources"]:
            entry["sources"].append(origin)
        if page is not None and page not in entry["pages"]:
            entry["pages"].append(page)
        value = inherited(field, "/V")
        if value is not None:
            value = value.get_object()
            if isinstance(value, NullObject):
                return
            entry["valuePresent"] = True
            if isinstance(value, DictionaryObject):
                entry["byteRangePresent"] = entry["byteRangePresent"] or bool(value.get("/ByteRange"))

    for name, field in (reader.get_fields() or {}).items():
        register(name, field, "AcroForm/Fields")
    for page_number, page in enumerate(reader.pages, 1):
        for reference in page.get("/Annots", []):
            annotation = reference.get_object()
            if annotation.get("/Subtype") == "/Widget":
                register(inherited(annotation, "/T"), annotation, "page/Widget", page_number)
    return {
        "present": bool(signatures), "count": len(signatures),
        "fields": list(signatures.values()),
        "cryptographicValidation": "not-performed",
        "meaning": "Presence of a PDF /Sig field only; neither signer identity nor validity is established."
    }


def extract(path, document_id):
    started = perf_counter()
    source = path.resolve(strict=True)
    if not source.is_file() or source.suffix.lower() != ".pdf":
        raise ValueError("Every input must be an explicit local PDF file.")
    payload = source.read_bytes()
    pdf_hash = sha256(payload)
    reader = pypdf.PdfReader(BytesIO(payload))
    if reader.is_encrypted:
        raise ValueError("Encrypted PDFs are outside this native-text pilot.")
    with fitz.open(stream=payload, filetype="pdf") as pdf:
        pages = []
        for number, page in enumerate(pdf, 1):
            text = page.get_text("text", sort=True)
            pages.append({
                "page": number, "width": page.rect.width, "height": page.rect.height,
                "text": text, "textSha256": sha256(text.encode("utf-8"))
            })
    combined = "\f".join(page["text"] for page in pages)
    return {
        "id": document_id,
        "source": {
            "path": str(source), "filename": source.name, "byteLength": len(payload),
            "pdfSha256": pdf_hash, "version": "sha256:" + pdf_hash,
            "versionKind": "local-content-hash"
        },
        "pageCount": len(pages), "pages": pages,
        "textSha256": sha256(combined.encode("utf-8")),
        "textLayerPresent": bool(combined.strip()),
        "signatureFieldsPresence": inspect_signature_fields(reader),
        "signatureTextMarkersPresent": bool(re.search(
            r"gov\.?br|assinad[oa]\s+digitalmente|assinatura\s+digital", combined, re.I
        )),
        "elapsedMs": round((perf_counter() - started) * 1000, 3)
    }


def main():
    parser = PrivateArgumentParser(description=__doc__)
    parser.add_argument("pdfs", nargs="+", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    destination = args.output.resolve()
    if destination.is_relative_to(REPOSITORY):
        raise ValueError("Private extraction output must be outside the Git repository.")
    started = perf_counter()
    # PDF library diagnostics can contain source bytes; never forward them to logs.
    with redirect_stderr(StringIO()), redirect_stdout(StringIO()):
        documents = [extract(path, f"document-{index}") for index, path in enumerate(args.pdfs, 1)]
    manifest = {
        "schemaVersion": 1, "private": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "extractor": {
            "version": VERSION, "python": platform.python_version(),
            "pymupdf": fitz.VersionBind, "pypdf": pypdf.__version__,
            "method": "native PDF text, sort=True; no OCR; /Sig inspected independently"
        },
        "documents": documents,
        "elapsedMs": round((perf_counter() - started) * 1000, 3)
    }
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=destination.parent, delete=False) as handle:
        temporary = Path(handle.name)
        os.chmod(temporary, 0o600)
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(temporary, destination)
    # Deliberately omit names, identifiers, text, hashes and source paths from stdout.
    print(json.dumps({
        "documents": len(documents), "pages": sum(doc["pageCount"] for doc in documents),
        "elapsedMs": manifest["elapsedMs"], "privateOutputWritten": True
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Exception text and tracebacks can disclose filenames or document text.
        print(json.dumps({
            "error": "local-document-extraction-failed",
            "message": "Check the local PDF inputs, arguments and private output permissions."
        }), file=sys.stderr)
        sys.exit(1)
