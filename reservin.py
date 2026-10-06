from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List
from uuid import uuid4


@dataclass(frozen=True)
class Table:
    table_id: str
    seats: int


@dataclass(frozen=True)
class Reservation:
    reservation_id: str
    customer_name: str
    table_id: str
    party_size: int
    start_time: datetime
    end_time: datetime


class ReservationError(ValueError):
    pass


class ReservationSystem:
    def __init__(self) -> None:
        self._tables: Dict[str, Table] = {}
        self._reservations: Dict[str, Reservation] = {}

    def add_table(self, table_id: str, seats: int) -> None:
        if not table_id:
            raise ReservationError("table_id is required")
        if seats <= 0:
            raise ReservationError("seats must be greater than 0")
        self._tables[table_id] = Table(table_id=table_id, seats=seats)

    def create_reservation(
        self,
        customer_name: str,
        party_size: int,
        start_time: datetime,
        end_time: datetime,
    ) -> Reservation:
        if not customer_name:
            raise ReservationError("customer_name is required")
        if party_size <= 0:
            raise ReservationError("party_size must be greater than 0")
        if end_time <= start_time:
            raise ReservationError("end_time must be after start_time")

        table = self._find_available_table(party_size, start_time, end_time)
        if table is None:
            raise ReservationError("no available table for requested time")

        reservation = Reservation(
            reservation_id=str(uuid4()),
            customer_name=customer_name,
            table_id=table.table_id,
            party_size=party_size,
            start_time=start_time,
            end_time=end_time,
        )
        self._reservations[reservation.reservation_id] = reservation
        return reservation

    def cancel_reservation(self, reservation_id: str) -> bool:
        return self._reservations.pop(reservation_id, None) is not None

    def list_reservations(self) -> List[Reservation]:
        return sorted(self._reservations.values(), key=lambda reservation: reservation.start_time)

    def _find_available_table(
        self,
        party_size: int,
        start_time: datetime,
        end_time: datetime,
    ) -> Table | None:
        suitable_tables = sorted(
            (table for table in self._tables.values() if table.seats >= party_size),
            key=lambda table: table.seats,
        )

        for table in suitable_tables:
            conflicts = any(
                reservation.table_id == table.table_id
                and start_time < reservation.end_time
                and end_time > reservation.start_time
                for reservation in self._reservations.values()
            )
            if not conflicts:
                return table

        return None
