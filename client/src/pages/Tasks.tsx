import { useState } from "react";
import { Button, Card, Input, PageTransition } from "@/components/ui/modern";
import { usePersonalTasks, useCreateTask, useToggleTask, useDeleteTask } from "@/hooks/use-tasks-reminders";
import { CheckSquare, Square, Plus, Trash2, ListTodo } from "lucide-react";

export default function Tasks() {
  const { data: tasks, isLoading } = usePersonalTasks();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createTask.mutate(newTitle.trim(), {
      onSuccess: () => setNewTitle(""),
    });
  };

  const open = tasks?.filter((t) => !t.isDone) || [];
  const done = tasks?.filter((t) => t.isDone) || [];

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ListTodo className="text-blue-600" size={28} />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Tasks</h1>
          </div>
          <p className="text-gray-600">Your personal to-do list — only you can see it</p>
        </div>

        {/* Add Task */}
        <Card className="mb-6">
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="What do you need to do?"
              className="flex-1"
              data-testid="input-new-task"
            />
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!newTitle.trim() || createTask.isPending}
              data-testid="button-add-task"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card className="text-center py-8 text-gray-500">Loading...</Card>
        )}

        {/* Empty state */}
        {!isLoading && tasks && tasks.length === 0 && (
          <Card className="text-center py-12 border-2 border-dashed">
            <ListTodo className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-600 font-semibold">No tasks yet</p>
            <p className="text-gray-500 text-sm mt-1">Add your first task above ✨</p>
          </Card>
        )}

        {/* Open tasks */}
        {open.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              To do ({open.length})
            </h2>
            <div className="space-y-2">
              {open.map((task) => (
                <Card key={task.id} className="!p-3 flex items-center gap-3 group">
                  <button
                    onClick={() => toggleTask.mutate(task.id)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    data-testid={`button-toggle-task-${task.id}`}
                  >
                    <Square size={22} />
                  </button>
                  <p className="flex-1 text-gray-900 font-medium" data-testid={`text-task-${task.id}`}>
                    {task.title}
                  </p>
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed tasks */}
        {done.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              Done ({done.length})
            </h2>
            <div className="space-y-2 opacity-60">
              {done.map((task) => (
                <Card key={task.id} className="!p-3 flex items-center gap-3 group">
                  <button
                    onClick={() => toggleTask.mutate(task.id)}
                    className="text-green-500"
                    data-testid={`button-toggle-task-${task.id}`}
                  >
                    <CheckSquare size={22} />
                  </button>
                  <p className="flex-1 text-gray-500 line-through" data-testid={`text-task-${task.id}`}>
                    {task.title}
                  </p>
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
