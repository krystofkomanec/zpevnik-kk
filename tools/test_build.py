"""Integration tests for the source tree, import ledger and built library."""
import contextlib
import io
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import build


ORIGINAL = "{title: Song}\n{artist: Artist}\n[C]I know the way\n"


def pdf_file(lines):
    """Create a small text-layer PDF using positioned words and built-in Helvetica."""
    stream = '\n'.join(f'BT /F1 12 Tf {x} {y} Td ({text}) Tj ET' for x, y, text in lines)
    objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
        '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        f'<< /Length {len(stream)} >>\nstream\n{stream}\nendstream',
    ]
    data, offsets = b'%PDF-1.4\n', []
    for index, obj in enumerate(objects, 1):
        offsets.append(len(data))
        data += f'{index} 0 obj\n{obj}\nendobj\n'.encode()
    xref = len(data)
    data += b'xref\n0 6\n0000000000 65535 f \n'
    data += ''.join(f'{offset:010} 00000 n \n' for offset in offsets).encode()
    return data + f'trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n{xref}\n%%EOF\n'.encode()


class BuildTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        for path in ('tools', 'ChordPro', 'inbox'):
            (self.root / path).mkdir()
        shutil.copytree(build.ROOT / 'app', self.root / 'app')
        shutil.copy(build.ROOT / 'cteni.js', self.root)
        (self.root / 'README.md').write_text(
            '<!-- statistics:start -->\n<!-- statistics:end -->\n'
            '<!-- pending:start -->\n<!-- pending:end -->\n'
        )
        self.git('init', '-q')
        self.git('config', 'user.name', 'Arrangement Editor')
        self.git('config', 'user.email', 'arranger@example.com')
        patcher = patch.object(build, 'ROOT', self.root)
        patcher.start()
        self.addCleanup(patcher.stop)

    def git(self, *args):
        subprocess.run(['git', *args], cwd=self.root, capture_output=True, check=True)

    def commit(self):
        self.git('add', '.')
        self.git('commit', '-qm', 'Update arrangement sources')

    def build(self):
        with contextlib.redirect_stdout(io.StringIO()) as message:
            build.build()
        return json.loads((self.root / 'library.json').read_text()), message.getvalue()

    def test_legacy_metadata_rename_revisions_addition_deletion_and_repeat(self):
        original = self.root / 'ChordPro/Original.cho'
        original.write_text(ORIGINAL)
        revision = dict(revision=2, author='First Editor', date='2024-01-01T00:00:00+00:00')
        legacy = dict(file='Original.cho', title='Song', artist='Artist', lang='cz',
                      cho=ORIGINAL, note='Editorial note', revision=2, changes=[revision],
                      addedAt='2023-06-03', sourceDate='2023-06-02',
                      sourceTimestamp='2023-06-02T12:34:56')
        (self.root / 'library.json').write_text(json.dumps(dict(version=8, songs=[legacy], catalog=[])))
        # Generated JavaScript may be stale, missing or invalid.
        (self.root / 'knihovna.js').write_text('stale generated data')
        self.commit()

        payload, _ = self.build()
        self.assertEqual(payload['version'], 9)
        song, = payload['songs']
        self.assertEqual({key: song[key] for key in legacy}, legacy)
        identifier = song['id']
        self.assertEqual(original.read_text(), ORIGINAL + f'{{x-arrangement-id: {identifier}}}\n')

        renamed = original.with_name('Rename.cho')
        original.rename(renamed)
        self.commit()
        payload, _ = self.build()
        song, = payload['songs']
        self.assertEqual(payload['version'], 10)
        self.assertEqual((song['id'], song['revision'], song['legacyFiles']), (identifier, 2, ['Original.cho']))
        self.assertEqual(song['changes'], [revision])

        renamed.write_text(renamed.read_text().replace('the way', 'the road'))
        original.write_text(ORIGINAL)
        self.commit()
        payload, _ = self.build()
        song, new = payload['songs']
        self.assertEqual(payload['version'], 11)
        self.assertNotEqual(new['id'], identifier)
        self.assertEqual(song['id'], identifier)
        self.assertEqual(song['revision'], 3)
        self.assertEqual(song['changes'][0], revision)
        self.assertEqual(song['changes'][1]['author'], 'Arrangement Editor')
        for key in ('addedAt', 'sourceDate', 'sourceTimestamp', 'note'):
            self.assertEqual(song[key], legacy[key])

        renamed.unlink()
        self.commit()
        payload, _ = self.build()
        self.assertEqual((payload['version'], payload['songs']), (12, [new]))
        tracked = ['library.json', 'knihovna.js', 'index.html', 'version.json', 'README.md', 'tools/imports.json']
        snapshot = {file: (self.root / file).read_bytes() for file in tracked}
        self.assertEqual(self.build()[0], payload)
        self.assertEqual({file: (self.root / file).read_bytes() for file in tracked}, snapshot)

    @unittest.skipUnless(shutil.which('pdftotext'), 'requires Poppler')
    def test_pdf_refresh_manual_correction_rename_and_deletion(self):
        pdf = self.root / 'inbox/Artist - Imported.pdf'

        def write_pdf(word):
            pdf.write_bytes(pdf_file([
                (40, 760, 'Capo 3'), (40, 720, '[Verse 1]'),
                (40, 700, 'D'), (40, 682, f'I know the {word}'),
                (40, 660, 'G'), (40, 642, 'You are my light'),
            ]))

        write_pdf('way')
        self.commit()
        payload, _ = self.build()
        first, = payload['songs']
        for text in ('{capo: 3}', '{comment: Verse 1}', '[D]I know the way', '[G]You are my light'):
            self.assertIn(text, first['cho'])
        original = self.root / 'ChordPro/Artist - Imported.cho'
        renamed = original.with_name('Renamed.cho')
        original.rename(renamed)
        write_pdf('road')
        imported_pdf = pdf.read_bytes()
        self.commit()
        payload, _ = self.build()
        updated, = payload['songs']
        self.assertEqual(updated['id'], first['id'])
        self.assertEqual(updated['revision'], 2)
        self.assertIn('the road', updated['cho'])
        self.assertFalse(original.exists())

        renamed.write_text(renamed.read_text().replace('the road', 'the river'))
        write_pdf('path')
        self.commit()
        payload, message = self.build()
        self.assertIn('manually edited arrangement', message)
        self.assertIn('the river', payload['songs'][0]['cho'])
        entry = json.loads((self.root / 'tools/imports.json').read_text())[f'inbox/{pdf.name}']
        self.assertFalse(entry['generated'])
        self.assertEqual(entry['id'], first['id'])

        renamed.unlink()
        self.commit()
        payload, _ = self.build()
        self.assertEqual(payload['songs'], [])
        write_pdf('stars')
        self.commit()
        self.assertEqual(self.build()[0], payload)
        copied = self.root / 'inbox/Artist - Different name.pdf'
        copied.write_bytes(imported_pdf)
        self.assertEqual(self.build()[0], payload)
        copied.write_bytes(pdf.read_bytes())
        self.assertEqual(self.build()[0], payload)
        self.assertFalse(list((self.root / 'ChordPro').glob('*.cho')))

    def test_duplicate_ids_are_rejected(self):
        for name in ('First', 'Second'):
            (self.root / f'ChordPro/{name}.cho').write_text(
                ORIGINAL + '{x-arrangement-id: 01234567-89ab-cdef-0123-456789abcdef}\n'
            )
        with self.assertRaisesRegex(ValueError, 'Duplicate arrangement'):
            self.build()


if __name__ == '__main__':
    unittest.main()
