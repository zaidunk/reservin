import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { EmptyState, ErrorNotice, LoadingState } from "../../components/ui/States";
import { createTable, listTables, setTableActive, updateTable } from "../../lib/api/management";
import { toAppError } from "../../lib/errors/app-error";
import type { RestaurantTable } from "../../types/domain";
import { TableForm, type TableFormValue } from "./components/TableForm";

export function TablesPage() {
  const queryClient = useQueryClient();
  const [editingTable, setEditingTable] = useState<RestaurantTable | "new">();
  const [toggleTable, setToggleTable] = useState<RestaurantTable>();
  const tables = useQuery({ queryKey: ["tables"], queryFn: listTables });

  const saveTable = useMutation({
    mutationFn: (value: TableFormValue) =>
      editingTable && editingTable !== "new"
        ? updateTable(editingTable.id, value)
        : createTable(value),
    onSuccess: async () => {
      setEditingTable(undefined);
      await queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: (table: RestaurantTable) => setTableActive(table.id, !table.is_active),
    onSuccess: async () => {
      setToggleTable(undefined);
      await queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header dashboard-page__header--action">
        <div><span className="eyebrow">Dining room</span><h1>Tables</h1><p>Keep capacity and availability aligned with the physical restaurant.</p></div>
        <Button onClick={() => { saveTable.reset(); setEditingTable("new"); }}><Plus size={17} /> Add table</Button>
      </header>
      {tables.error || saveTable.error || toggleActive.error ? <ErrorNotice message={toAppError(tables.error ?? saveTable.error ?? toggleActive.error).message} /> : null}
      {tables.isLoading ? <LoadingState label="Loading tables" /> : tables.data?.length ? (
        <section className="management-table-grid" aria-label="Restaurant tables">
          {tables.data.map((table) => (
            <article className={`management-table-card ${table.is_active ? "" : "management-table-card--inactive"}`} key={table.id}>
              <div className="management-table-card__header"><span className="management-table-card__code">{table.code}</span><Badge tone={table.is_active ? "success" : "default"}>{table.is_active ? "Active" : "Inactive"}</Badge></div>
              <h2>{table.name}</h2>
              <div className="management-table-card__meta"><span><Users size={15} /> {table.capacity} guests</span><span><MapPin size={15} /> {table.area || "No area"}</span></div>
              <div className="management-table-card__actions">
                <Button size="small" variant="secondary" onClick={() => { saveTable.reset(); setEditingTable(table); }}><Pencil size={14} /> Edit</Button>
                <Button size="small" variant={table.is_active ? "danger" : "ghost"} onClick={() => setToggleTable(table)}>{table.is_active ? "Deactivate" : "Activate"}</Button>
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No tables configured." message="Add the first reservable table to get started." action={<Button onClick={() => setEditingTable("new")}><Plus size={16} /> Add table</Button>} />}

      <Dialog
        open={Boolean(editingTable)}
        title={editingTable === "new" ? "Add table" : "Edit table"}
        description="Use the same short code staff see in the dining room."
        onClose={() => !saveTable.isPending && setEditingTable(undefined)}
      >
        <TableForm
          table={editingTable && editingTable !== "new" ? editingTable : undefined}
          isLoading={saveTable.isPending}
          onCancel={() => setEditingTable(undefined)}
          onSubmit={(value) => saveTable.mutate(value)}
        />
      </Dialog>

      <Dialog
        open={Boolean(toggleTable)}
        title={toggleTable?.is_active ? "Deactivate table?" : "Activate table?"}
        description={toggleTable ? `${toggleTable.code} · ${toggleTable.name} will ${toggleTable.is_active ? "stop appearing in availability searches" : "accept new reservations again"}.` : undefined}
        onClose={() => !toggleActive.isPending && setToggleTable(undefined)}
      >
        <div className="dialog-actions">
          <Button variant="secondary" disabled={toggleActive.isPending} onClick={() => setToggleTable(undefined)}>Keep current status</Button>
          <Button variant={toggleTable?.is_active ? "danger" : "primary"} isLoading={toggleActive.isPending} onClick={() => toggleTable && toggleActive.mutate(toggleTable)}>{toggleTable?.is_active ? "Deactivate" : "Activate"}</Button>
        </div>
      </Dialog>
    </main>
  );
}
