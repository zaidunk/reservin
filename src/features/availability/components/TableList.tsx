import { Check, MapPin, Users } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/States";
import type { AvailableTable } from "../../../types/domain";

export function TableList({
  tables,
  selectedId,
  onSelect,
}: {
  tables: AvailableTable[];
  selectedId?: string;
  onSelect: (table: AvailableTable) => void;
}) {
  if (tables.length === 0) {
    return (
      <EmptyState
        title="No tables available for this time."
        message="Try another time or adjust your party size."
      />
    );
  }

  return (
    <div className="table-grid" role="list" aria-label="Available tables">
      {tables.map((table) => {
        const isSelected = table.id === selectedId;
        return (
          <div key={table.id} role="listitem">
            <button
              className={`table-card ${isSelected ? "table-card--selected" : ""}`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(table)}
            >
              <div className="table-card__heading">
                <div>
                  <h3>{table.name}</h3>
                </div>
                {isSelected ? (
                  <span className="table-card__check" aria-label="Selected">
                    <Check size={16} aria-hidden="true" />
                  </span>
                ) : (
                  <Badge tone="success">Available</Badge>
                )}
              </div>
              <div className="table-card__meta">
                <span>
                  <Users size={16} aria-hidden="true" /> Up to {table.capacity} guests
                </span>
                <span>
                  <MapPin size={16} aria-hidden="true" /> {table.area || "Main dining room"}
                </span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
