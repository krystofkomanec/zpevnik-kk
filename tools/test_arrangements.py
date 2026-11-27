"""Regression checks for independent PDF columns and ChordPro notation."""
import unittest

from check_arrangements import issues
from import_pdf import align, reading_order


class ConversionTests(unittest.TestCase):
    def test_two_columns_remain_in_reading_order(self):
        words = [(y, x, x+20, label) for y in range(10, 70, 10)
                 for x, label in ((30, "left"), (95, "side"), (320, "right"), (390, "side"))]
        rows = reading_order(words, 600, 3)
        self.assertEqual([row[0][2] for row in rows], ["left"]*6 + ["right"]*6)

    def test_right_aligned_chords_do_not_create_a_column(self):
        words = [(y, x, x+6, label) for y in range(10, 70, 10)
                 for x, label in ((30, "G"), (320, "C"))]
        self.assertEqual(len(reading_order(words, 600, 3)), 6)

    def test_trailing_chords_keep_their_order(self):
        self.assertEqual(align([(10,30,"word")], [(45,"A"),(60,"G")]), "word[A][G]")

    def test_source_debris_is_reported_by_line(self):
        self.assertEqual([n for n,_ in issues("text https://example.org/song\nG D Am lyric")], [1, 2])
        self.assertFalse(issues("{start_of_tab}\ne|--0--2--3--|\n{end_of_tab}\n[G] [D] [Am]"))


if __name__ == "__main__":
    unittest.main()
