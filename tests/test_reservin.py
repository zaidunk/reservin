import unittest
from datetime import datetime, timedelta

from reservin import ReservationError, ReservationSystem


class ReservationSystemTests(unittest.TestCase):
    def setUp(self) -> None:
        self.system = ReservationSystem()
        self.system.add_table("T1", 2)
        self.system.add_table("T2", 4)

    def test_creates_reservation_with_smallest_available_table(self) -> None:
        start = datetime(2026, 10, 6, 19, 0)
        end = start + timedelta(hours=2)

        reservation = self.system.create_reservation("Ava", 2, start, end)

        self.assertEqual("T1", reservation.table_id)

    def test_rejects_overlapping_booking_for_same_table_size(self) -> None:
        start = datetime(2026, 10, 6, 19, 0)
        end = start + timedelta(hours=2)
        self.system.create_reservation("Ava", 2, start, end)

        overlap_start = start + timedelta(minutes=30)
        overlap_end = end + timedelta(minutes=30)
        reservation = self.system.create_reservation("Ben", 2, overlap_start, overlap_end)

        self.assertEqual("T2", reservation.table_id)

    def test_raises_when_no_table_is_available(self) -> None:
        start = datetime(2026, 10, 6, 19, 0)
        end = start + timedelta(hours=2)
        self.system.create_reservation("Ava", 2, start, end)
        self.system.create_reservation("Ben", 4, start, end)

        with self.assertRaises(ReservationError):
            self.system.create_reservation("Cara", 2, start, end)

    def test_cancel_reservation_releases_slot(self) -> None:
        start = datetime(2026, 10, 6, 19, 0)
        end = start + timedelta(hours=2)
        reservation = self.system.create_reservation("Ava", 2, start, end)

        cancelled = self.system.cancel_reservation(reservation.reservation_id)
        replacement = self.system.create_reservation("Ben", 2, start, end)

        self.assertTrue(cancelled)
        self.assertEqual("T1", replacement.table_id)


if __name__ == "__main__":
    unittest.main()
