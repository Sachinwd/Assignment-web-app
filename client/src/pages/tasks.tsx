import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task } from "@shared/schema";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2, Calendar, MoreVertical, Trash2, Edit2, CheckCircle2, Circle } from "lucide-react";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredTasks = tasks?.filter((task) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "completed"
        ? task.isCompleted
        : !task.isCompleted;
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = tasks?.filter((t) => !t.isCompleted).length || 0;
  const completedCount = tasks?.filter((t) => t.isCompleted).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">My Tasks</h1>
            <p className="text-muted-foreground mt-1">
              You have <span className="font-semibold text-primary">{activeCount}</span> active tasks remaining.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 bg-background border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as any)}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-background border-border/50">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks?.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No tasks found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {search || filter !== "all" 
                  ? "Try adjusting your filters or search query." 
                  : "Get started by creating your first task today."}
              </p>
              {!search && filter === "all" && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  Create Task
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4">
                {filteredTasks?.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <TaskDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        mode="create" 
      />
    </DashboardLayout>
  );
}

function TaskCard({ task }: { task: Task }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const toggleComplete = () => {
    updateTask.mutate({ id: task.id, isCompleted: !task.isCompleted });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`
          group relative bg-card p-5 rounded-2xl border transition-all duration-200
          ${task.isCompleted 
            ? "border-border/50 bg-muted/30" 
            : "border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5"
          }
        `}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={toggleComplete}
            className={`
              mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200
              ${task.isCompleted 
                ? "bg-green-500 border-green-500 text-white" 
                : "border-muted-foreground/30 text-transparent hover:border-primary"
              }
            `}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg leading-none mb-2 ${task.isCompleted ? "text-muted-foreground line-through decoration-border" : "text-foreground"}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm leading-relaxed ${task.isCompleted ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5" />
                {/* Random date for demo since schema lacks createdAt */}
                <span>Today</span> 
              </div>
              {task.isCompleted && (
                <span className="text-green-600 bg-green-500/10 px-2.5 py-1 rounded-md">Completed</span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => deleteTask.mutate(task.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <TaskDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        mode="edit" 
        task={task} 
      />
    </>
  );
}

function TaskDialog({ 
  open, 
  onOpenChange, 
  mode, 
  task 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  mode: "create" | "edit"; 
  task?: Task; 
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  
  const form = useForm<z.infer<typeof insertTaskSchema>>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      isCompleted: task?.isCompleted || false,
    },
  });

  const onSubmit = (values: z.infer<typeof insertTaskSchema>) => {
    if (mode === "create") {
      createTask.mutate(values, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    } else if (task) {
      updateTask.mutate({ id: task.id, ...values }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Task" : "Edit Task"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new item to your todo list." : "Make changes to your existing task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" {...field} className="font-medium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details..." 
                      className="resize-none min-h-[100px]" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {mode === "edit" && (
              <FormField
                control={form.control}
                name="isCompleted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as completed</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Task" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Icon helper
function CheckSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
