"""Synthetic-only checks for the optional local PDF extraction pilot."""
import importlib.util
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject, DictionaryObject, NameObject, NullObject, NumberObject, TextStringObject,
)

ROOT = Path(__file__).resolve().parents[2]
EXTRACTOR = ROOT / "ops/document-intelligence-poc/local-pdf-pilot/extract_pdf.py"
SPEC = importlib.util.spec_from_file_location("synthetic_local_pdf_extractor", EXTRACTOR)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class LocalPdfExtractorTest(unittest.TestCase):
    def test_unsigned_signature_with_null_value_preserves_field_presence(self):
        writer = PdfWriter()
        page = writer.add_blank_page(width=100, height=100)
        field = DictionaryObject({
            NameObject("/FT"): NameObject("/Sig"),
            NameObject("/T"): TextStringObject("synthetic-empty-signature"),
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/Subtype"): NameObject("/Widget"),
            NameObject("/Rect"): ArrayObject([NumberObject(value) for value in (0, 0, 10, 10)]),
            NameObject("/V"): NullObject(),
        })
        reference = writer._add_object(field)
        writer._root_object[NameObject("/AcroForm")] = DictionaryObject({
            NameObject("/Fields"): ArrayObject([reference]),
        })
        page[NameObject("/Annots")] = ArrayObject([reference])
        payload = BytesIO()
        writer.write(payload)
        payload.seek(0)
        result = MODULE.inspect_signature_fields(PdfReader(payload))
        self.assertTrue(result["present"])
        self.assertEqual(result["count"], 1)
        self.assertFalse(result["fields"][0]["valuePresent"])
        self.assertFalse(result["fields"][0]["byteRangePresent"])
        self.assertEqual(result["fields"][0]["pages"], [1])
        self.assertEqual(result["cryptographicValidation"], "not-performed")

    def test_cli_errors_do_not_disclose_paths_arguments_or_pdf_content(self):
        marker = "SYNTHETIC-PRIVATE-SCHOOL-NAME"
        with tempfile.TemporaryDirectory(prefix="radar-document-pilot-synthetic-") as directory:
            output = str(Path(directory) / "manifest.json")
            missing = str(Path(directory) / f"{marker}-missing.pdf")
            malformed = Path(directory) / "malformed.pdf"
            malformed.write_text(marker, encoding="utf-8")
            for arguments in (
                ["--output", output, missing],
                ["--output", output, str(malformed)],
                ["--output", output, missing, f"--unknown-{marker}"],
            ):
                with self.subTest(arguments_kind=len(arguments)):
                    execution = subprocess.run(
                        [sys.executable, "-B", str(EXTRACTOR), *arguments],
                        capture_output=True, text=True, check=False,
                    )
                    self.assertEqual(execution.returncode, 1)
                    self.assertEqual(execution.stdout, "")
                    self.assertEqual(json.loads(execution.stderr)["error"], "local-document-extraction-failed")
                    self.assertNotIn(marker, execution.stderr)
                    self.assertNotIn(directory, execution.stderr)
                    self.assertFalse(Path(output).exists())


if __name__ == "__main__":
    unittest.main()
