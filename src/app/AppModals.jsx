import { AddHearingModal } from "@/features/calendar";
import { AddCaseModal } from "@/features/cases";
import { AddClientModal } from "@/features/clients";
import { UploadDocModal } from "@/features/documents";
import { AddExpenseModal } from "@/features/finance";
import { AddTaskModal } from "@/features/tasks";

export default function AppModals({
  modal,
  onClose,
  clients,
  cases,
  team,
  user,
  clientsActions,
  casesActions,
  createTask,
  createHearing,
  createDocument,
  createTransaction,
}) {
  const availableTeam = user.role === "ASSISTANT"
    ? team.filter(member => member.id === user.id)
    : team;

  return (
    <>
      {modal?.type === "add-client" && (
        <AddClientModal onClose={onClose} onSave={clientsActions.createClient} />
      )}
      {modal?.type === "edit-client" && (
        <AddClientModal
          onClose={onClose}
          onSave={data => clientsActions.updateClient(modal.data.id, data)}
          initialValues={modal.data}
          title="Edit Client"
          saveLabel="Save Changes"
        />
      )}
      {modal?.type === "add-case" && (
        <AddCaseModal onClose={onClose} onSave={casesActions.createCase} clients={clients} />
      )}
      {modal?.type === "edit-case" && (
        <AddCaseModal
          onClose={onClose}
          onSave={data => casesActions.updateCase(modal.data.id, data)}
          clients={clients}
          initialValues={modal.data}
          title="Edit Case"
          saveLabel="Save Changes"
        />
      )}
      {modal?.type === "add-task" && (
        <AddTaskModal onClose={onClose} onSave={createTask} cases={cases} team={availableTeam} />
      )}
      {modal?.type === "add-hearing" && (
        <AddHearingModal onClose={onClose} onSave={createHearing} cases={cases} team={availableTeam} />
      )}
      {modal?.type === "upload-doc" && (
        <UploadDocModal onClose={onClose} cases={cases} clients={clients} onSave={createDocument} />
      )}
      {modal?.type === "add-expense" && (
        <AddExpenseModal onClose={onClose} clients={clients} cases={cases} onSave={createTransaction} />
      )}
    </>
  );
}
